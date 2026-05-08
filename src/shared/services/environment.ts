import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type EnvironmentalSource = "gps" | "fallback";

export type EnvironmentalData = {
  temperature: number;
  feelsLike: number;
  uv: number;
  humidity: number;
  wind: number;
  windGusts: number;
  precipitation: number;
  rain: number;
  rainProbability: number;
  cloudCover: number;
  weatherCode: number;
  aqi: number;
  pm25: number;
  pm10: number;
  source: EnvironmentalSource;
};

type EnvironmentalState = {
  data: EnvironmentalData | null;
  loading: boolean;
  error: string | null;
};

type Coordinates = {
  latitude: number;
  longitude: number;
  source: EnvironmentalSource;
};

type WeatherResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    precipitation?: number;
    rain?: number;
    weather_code?: number;
    cloud_cover?: number;
  };
  daily?: {
    uv_index_max?: number[];
    precipitation_probability_max?: number[];
  };
};

type AirQualityResponse = {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
};

const KATHMANDU_COORDS: Coordinates = {
  latitude: 27.7172,
  longitude: 85.324,
  source: "fallback"
};

const POLLUTION_NOTIFICATION_PREFIX = "skin-nepal-pollution-reminder";

export function useEnvironmentalData(): EnvironmentalState {
  const [state, setState] = useState<EnvironmentalState>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    async function loadEnvironment() {
      try {
        const coords = await getCoordinates();
        const data = await fetchEnvironmentalData(coords);
        if (!mounted) return;
        setState({ data, loading: false, error: null });
        await schedulePollutionReminder(data.aqi);
      } catch (error) {
        if (!mounted) return;
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load local air quality."
        });
      }
    }

    loadEnvironment();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export function getAqiGuidance(aqi: number) {
  if (aqi <= 50) {
    return {
      level: "Good" as const,
      tone: "secondary" as const,
      message: "Air is clean! Your standard routine is perfect."
    };
  }

  if (aqi <= 100) {
    return {
      level: "Fair" as const,
      tone: "accent" as const,
      message: "Moderate pollution. Use an antioxidant serum (like Vitamin C) to block free radicals."
    };
  }

  return {
    level: "Poor" as const,
    tone: "danger" as const,
    message: "High pollution alert! Double cleanse tonight to remove microscopic soot from your pores."
  };
}

async function getCoordinates(): Promise<Coordinates> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return KATHMANDU_COORDS;

    const location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      source: "gps"
    };
  } catch {
    return KATHMANDU_COORDS;
  }
}

async function fetchEnvironmentalData(coords: Coordinates): Promise<EnvironmentalData> {
  try {
    return await fetchForCoordinates(coords);
  } catch (error) {
    if (coords.source === "fallback") throw error;
    return fetchForCoordinates(KATHMANDU_COORDS);
  }
}

async function fetchForCoordinates(coords: Coordinates): Promise<EnvironmentalData> {
  const params = `latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?${params}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,precipitation,rain,weather_code,cloud_cover&daily=uv_index_max,precipitation_probability_max`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${params}&current=us_aqi,pm2_5,pm10`;

  const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
  if (!weatherRes.ok || !airRes.ok) {
    throw new Error("Unable to load weather and air quality right now.");
  }

  const [weather, air] = (await Promise.all([weatherRes.json(), airRes.json()])) as [WeatherResponse, AirQualityResponse];
  return {
    temperature: requireNumber(weather.current?.temperature_2m, "temperature"),
    feelsLike: requireNumber(weather.current?.apparent_temperature, "apparent temperature"),
    uv: requireNumber(weather.daily?.uv_index_max?.[0], "UV index"),
    humidity: requireNumber(weather.current?.relative_humidity_2m, "humidity"),
    wind: requireNumber(weather.current?.wind_speed_10m, "wind speed"),
    windGusts: optionalNumber(weather.current?.wind_gusts_10m),
    precipitation: optionalNumber(weather.current?.precipitation),
    rain: optionalNumber(weather.current?.rain),
    rainProbability: optionalNumber(weather.daily?.precipitation_probability_max?.[0]),
    cloudCover: optionalNumber(weather.current?.cloud_cover),
    weatherCode: optionalNumber(weather.current?.weather_code),
    aqi: Math.round(requireNumber(air.current?.us_aqi, "AQI")),
    pm25: requireNumber(air.current?.pm2_5, "PM2.5"),
    pm10: requireNumber(air.current?.pm10, "PM10"),
    source: coords.source
  };
}

function requireNumber(value: unknown, label: string) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} data is unavailable right now.`);
  }
  return value;
}

function optionalNumber(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

async function schedulePollutionReminder(aqi: number) {
  if (aqi <= 100 || Platform.OS === "web") return;

  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(20, 0, 0, 0);
  if (reminderTime <= now) return;

  const dateKey = getLocalDateKey(now);
  const storageKey = `${POLLUTION_NOTIFICATION_PREFIX}-${dateKey}`;
  const existingId = await AsyncStorage.getItem(storageKey);
  if (existingId) return;

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("pollution-reminders", {
      name: "Pollution reminders",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Air was dusty today!",
      body: "Don't forget to double-cleanse before bed to save your pores."
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
      channelId: Platform.OS === "android" ? "pollution-reminders" : undefined
    }
  });

  await AsyncStorage.setItem(storageKey, notificationId);
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
