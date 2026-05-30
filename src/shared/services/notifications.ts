import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { EnvironmentalData } from "./environment";
import { getFirebase } from "./firebase";
import { NotificationPreferences, ScheduledNotificationRecord } from "../types";

const STORAGE_PREFIX = "prabha-notification";

type RoutineProgress = {
  date: string;
  percent: number;
  completed: number;
  total: number;
};

export async function requestNotificationAccess() {
  if (Platform.OS === "web") return { granted: false, reason: "web" as const };
  const Notifications = await getNotifications();
  if (!Notifications) return { granted: false, reason: "expo-go" as const };
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { granted: false, reason: "denied" as const };
  await ensureChannels();
  return { granted: true, reason: "granted" as const };
}

export async function scheduleDailyRoutineReminders(date: string, preferences: NotificationPreferences) {
  if (!preferences.routineReminders || Platform.OS === "web") return [];
  const access = await requestNotificationAccess();
  if (!access.granted) return [];
  const records: ScheduledNotificationRecord[] = [];
  const morning = nextLocalDateAt(8, 0);
  const evening = nextLocalDateAt(20, 30);
  if (morning) {
    records.push(await scheduleOnce(date, "routine_morning", {
      title: "Good morning glow",
      body: "Cleanser, moisturizer, sunscreen. Tiny steps, steady skin.",
      triggerDate: morning,
      channelId: "routine-reminders"
    }));
  }
  if (evening) {
    records.push(await scheduleOnce(date, "routine_evening", {
      title: "Night routine time",
      body: "Cleanse SPF, dust, and makeup before sleep so pores can breathe.",
      triggerDate: evening,
      channelId: "routine-reminders"
    }));
  }
  return records;
}

export async function scheduleIncompleteStepReminder(progress: RoutineProgress, preferences: NotificationPreferences) {
  if (!preferences.routineReminders || Platform.OS === "web" || progress.total <= 0 || progress.percent >= 100) return undefined;
  const access = await requestNotificationAccess();
  if (!access.granted) return undefined;
  const triggerDate = nextLocalDateAt(21, 15);
  if (!triggerDate) return undefined;
  return scheduleOnce(progress.date, "incomplete_steps", {
    title: "One gentle step left?",
    body: `${progress.completed}/${progress.total} routine steps done. No pressure, cleanser + moisturizer is still a win.`,
    triggerDate,
    channelId: "routine-reminders"
  });
}

export async function scheduleCompletionPraise(date: string, preferences: NotificationPreferences) {
  if (!preferences.completionPraise || Platform.OS === "web") return undefined;
  if (preferences.quietHoursEnabled && isNowInQuietHours(preferences)) return undefined;
  const access = await requestNotificationAccess();
  if (!access.granted) return undefined;
  return scheduleOnce(date, "completion_praise", {
    title: "Routine complete",
    body: "You finished today's skincare steps. Soft consistency is the glow plan.",
    channelId: "routine-reminders"
  });
}

export async function scheduleWeatherAlerts(date: string, data: EnvironmentalData, preferences: NotificationPreferences) {
  if (!preferences.weatherAlerts || Platform.OS === "web") return [];
  if (preferences.quietHoursEnabled && isNowInQuietHours(preferences)) return [];
  const access = await requestNotificationAccess();
  if (!access.granted) return [];
  const alerts = buildWeatherAlerts(data);
  const records: ScheduledNotificationRecord[] = [];
  for (const alert of alerts) {
    records.push(await scheduleOnce(date, "weather_alert", { ...alert, channelId: "weather-alerts" }, alert.id));
  }
  return records;
}

export async function registerExpoPushToken() {
  if (Platform.OS === "web") return { ok: false, mode: "web" as const, token: undefined };
  if (Constants.appOwnership === "expo") return { ok: false, mode: "expo-go" as const, token: undefined };
  const access = await requestNotificationAccess();
  if (!access.granted) return { ok: false, mode: access.reason, token: undefined };
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return { ok: false, mode: "expo-go" as const, token: undefined };
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    const firebase = getFirebase();
    const user = firebase?.auth.currentUser;
    if (firebase && user) {
      await setDoc(doc(firebase.db, "pushTokens", user.uid), { uid: user.uid, token, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(firebase.db, "users", user.uid), { expoPushToken: token, updatedAt: serverTimestamp() }, { merge: true });
    }
    return { ok: true, mode: firebase && user ? "firebase-synced" as const : "local-token" as const, token };
  } catch (error) {
    return { ok: false, mode: "failed" as const, token: undefined, message: error instanceof Error ? error.message : "Push token unavailable." };
  }
}

export async function cancelTodayNotifications(date: string) {
  if (Platform.OS === "web") return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  const keys = await AsyncStorage.getAllKeys();
  const todayKeys = keys.filter((key) => key.startsWith(`${STORAGE_PREFIX}-${date}`));
  const pairs = await AsyncStorage.multiGet(todayKeys);
  await Promise.all(
    pairs
      .map(([, value]) => (value ? (JSON.parse(value) as ScheduledNotificationRecord).notificationId : undefined))
      .filter(Boolean)
      .map((id) => Notifications.cancelScheduledNotificationAsync(id as string))
  );
  await AsyncStorage.multiRemove(todayKeys);
}

function buildWeatherAlerts(data: EnvironmentalData) {
  const alerts: Array<{ id: string; title: string; body: string; triggerDate?: Date }> = [];
  if (data.rainProbability >= 45 || data.rain > 0 || data.precipitation > 0) {
    alerts.push({ id: "rain", title: "Rain likely today", body: "Carry umbrella. Keep towel/pillowcase dry and cleanse sweat gently tonight." });
  }
  if (data.uv >= 8) alerts.push({ id: "uv-strong", title: "Strong UV warning", body: "SPF 50, hat/umbrella, and reapply if outdoors. Marks darken fast in high UV." });
  else if (data.uv >= 6) alerts.push({ id: "uv", title: "UV is high", body: "Do not skip sunscreen today, even if it feels cloudy." });
  if (data.feelsLike >= 38) alerts.push({ id: "extreme-heat", title: "Extreme heat skin alert", body: "Hydrate, avoid heavy oils, rinse sweat, and watch for heat rash or dizziness." });
  else if (data.feelsLike >= 32) alerts.push({ id: "heat", title: "Hot day routine", body: "Use light moisturizer, reapply SPF, and rinse sweat after commute." });
  if (data.windGusts >= 35) alerts.push({ id: "wind", title: "Strong wind/dust alert", body: "Wind can dry and dust can clog. Moisturize well and double cleanse tonight." });
  if (data.aqi > 100) alerts.push({ id: "aqi", title: "Pollution cleansing reminder", body: "AQI is high. Double cleanse tonight and use barrier-friendly moisturizer." });
  return alerts;
}

async function scheduleOnce(
  date: string,
  kind: ScheduledNotificationRecord["kind"],
  input: { title: string; body: string; triggerDate?: Date; channelId: string },
  extraId = "default"
) {
  const Notifications = await getNotifications();
  if (!Notifications) throw new Error("Notifications are unavailable in Expo Go.");
  const storageKey = `${STORAGE_PREFIX}-${date}-${kind}-${extraId}`;
  const existing = await AsyncStorage.getItem(storageKey);
  if (existing) return JSON.parse(existing) as ScheduledNotificationRecord;
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: { title: input.title, body: input.body, data: { url: "/(tabs)/home", kind } },
    trigger: input.triggerDate
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: input.triggerDate,
          channelId: Platform.OS === "android" ? input.channelId : undefined
        }
      : null
  });
  const record: ScheduledNotificationRecord = { id: storageKey, date, kind, notificationId, createdAt: new Date().toISOString() };
  await AsyncStorage.setItem(storageKey, JSON.stringify(record));
  return record;
}

async function ensureChannels() {
  if (Platform.OS !== "android") return;
  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync("routine-reminders", {
    name: "Routine reminders",
    importance: Notifications.AndroidImportance.DEFAULT
  });
  await Notifications.setNotificationChannelAsync("weather-alerts", {
    name: "Weather skin alerts",
    importance: Notifications.AndroidImportance.DEFAULT
  });
}

async function getNotifications() {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") return undefined;
  return import("expo-notifications");
}

function nextLocalDateAt(hour: number, minute: number) {
  const now = new Date();
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  return date > now ? date : undefined;
}

function isNowInQuietHours(preferences: NotificationPreferences) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(preferences.quietHoursStart);
  const end = parseTime(preferences.quietHoursEnd);
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function parseTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return hour * 60 + minute;
}
