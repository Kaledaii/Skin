import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import { DailyCheckIn, UserProfile } from "../types";
import { EnvironmentalData } from "../services/environment";

export type WeatherActionTone = "warning" | "advice" | "tip" | "success";

export type WeatherAction = {
  id: string;
  tone: WeatherActionTone;
  icon: ComponentProps<typeof Feather>["name"];
  label: "Carry" | "Warning" | "Tonight" | "Tip" | "Ready";
  title: string;
  message: string;
  autoSatisfiedBy?: "sunscreen";
};

export function buildWeatherActions(data: EnvironmentalData): WeatherAction[] {
  const actions: WeatherAction[] = [];
  const rainLikely = data.rainProbability >= 45 || data.rain > 0 || data.precipitation > 0 || isRainCode(data.weatherCode);

  if (rainLikely) {
    actions.push({
      id: "rain-carry-umbrella",
      tone: "tip",
      icon: "cloud-rain",
      label: "Carry",
      title: "Rain likely: umbrella + clean towel",
      message: "Carry umbrella, protect sunscreen/makeup, and avoid muddy splash water on face. Beluka gentle cleanse garnu."
    });
  }

  if (data.uv >= 8) {
    actions.push({
      id: "uv-high-spf50",
      tone: "warning",
      icon: "sun",
      label: "Warning",
      title: "High UV today",
      message: "SPF 50, hat/dupatta, shade, and reapply if sweating. UV le PIH, melasma, tanning badhauna sakcha.",
      autoSatisfiedBy: "sunscreen"
    });
  } else if (data.uv >= 5) {
    actions.push({
      id: "uv-moderate-spf",
      tone: "tip",
      icon: "sun",
      label: "Tip",
      title: "UV still matters",
      message: "Cloudy day ma pani sunscreen lagaunu. Face, neck, ears cover garnu.",
      autoSatisfiedBy: "sunscreen"
    });
  }

  if (data.aqi > 150 || data.pm25 >= 55) {
    actions.push({
      id: "aqi-high-mask-cleanse",
      tone: "warning",
      icon: "shield",
      label: "Warning",
      title: "Air quality is rough",
      message: "Mask outdoors if possible, avoid heavy roadside walking, and double cleanse tonight to remove fine dust."
    });
  } else if (data.aqi > 100 || data.pm25 >= 35) {
    actions.push({
      id: "aqi-moderate-antioxidant",
      tone: "advice",
      icon: "shield",
      label: "Tonight",
      title: "Dust/pollution support",
      message: "Use gentle evening cleanse. Vitamin C/E foods like amla, citrus, nuts, saag help antioxidant support."
    });
  }

  if (data.humidity >= 78 && data.feelsLike >= 27) {
    actions.push({
      id: "humid-heat-sweat",
      tone: "advice",
      icon: "droplet",
      label: "Tip",
      title: "Heat + humidity: keep it light",
      message: "Use light moisturizer, rinse sweat gently, and keep hairline/neck dry to reduce itchy sweat bumps."
    });
  }

  if (data.humidity <= 35 || data.temperature <= 12 || data.wind >= 22 || data.windGusts >= 32) {
    actions.push({
      id: "dry-wind-barrier",
      tone: "advice",
      icon: "wind",
      label: "Tip",
      title: "Dry wind/cold: barrier care",
      message: "Use lukewarm water, richer moisturizer, lip balm, and moisturize while skin is damp."
    });
  }

  return actions.length > 0
    ? actions
    : [{
        id: "weather-steady",
        tone: "success",
        icon: "smile",
        label: "Ready",
        title: "Weather looks manageable",
        message: "Normal cleanser, moisturizer, SPF, and water are enough today."
      }];
}

export function calculateWeatherReadiness(actions: WeatherAction[], checkIn: DailyCheckIn, profile: UserProfile) {
  const relevant = actions.filter((action) => action.id !== "weather-steady");
  if (relevant.length === 0) {
    return { score: 10, reasons: ["Weather readiness is steady today."] };
  }

  const completed = new Set(checkIn.weatherActionIds ?? []);
  let ready = 0;
  const reasons: string[] = [];
  for (const action of relevant) {
    const autoReady = action.autoSatisfiedBy === "sunscreen" && (checkIn.sunscreen || profile.quiz.currentRoutine.uses_sunscreen === "yes");
    const done = completed.has(action.id) || autoReady;
    if (done) ready += 1;
    reasons.push(done ? `${action.title}: prepared.` : `${action.title}: add this to today's plan.`);
  }

  return { score: Math.round((ready / relevant.length) * 10), reasons };
}

function isRainCode(code: number) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(Math.round(code));
}
