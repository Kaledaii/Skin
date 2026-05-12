import { DailyCheckIn, UserProfile } from "../types";
import { HabitScore } from "./tracking";

export type WeeklySkinReport = {
  title: string;
  summary: string;
  bestHabit: string;
  weakestHabit: string;
  likelyTrigger: string;
  whyChanged: string;
  nextWeekFocus: string;
  productAdjustment: string;
  modeSuggestion: string;
  sevenDayPlan: string[];
};

export function buildWeeklySkinReport(profile: UserProfile, checkIn: DailyCheckIn, score: HabitScore): WeeklySkinReport {
  const lifestyle = profile.quiz.lifestyle;
  const makeupRisk = profile.quiz.currentRoutine.uses_makeup_daily !== "no" && !checkIn.makeupRemoved;
  const lowSleep = checkIn.sleep === "less_than_5" || lifestyle.sleep_hours === "less_than_5";
  const lowWater = checkIn.water === "less_than_1" || lifestyle.water_intake_liters === "less_than_1";
  const stress = checkIn.stressToday === "high" || lifestyle.stress_level === "high";
  const foodRisk = lifestyle.junk_food_frequency === "high" || lifestyle.junk_food_frequency === "medium";

  const bestHabit = checkIn.sunscreen ? "SPF consistency protected marks and UV stress." : checkIn.makeupRemoved ? "Makeup removal protected pores tonight." : score.parts.routine >= 20 ? "Routine completion was your strongest habit." : "You logged enough data to learn your pattern.";
  const weakestHabit = makeupRisk
    ? "Makeup removal is the clearest weak spot."
    : lowSleep
      ? "Sleep is the biggest repair blocker."
      : lowWater
        ? "Water is low, so tightness/dullness can show."
        : foodRisk
          ? "Sweet/maida/fried food frequency may be holding progress back."
          : stress
            ? "Stress is the main flare trigger to calm."
            : "Routine consistency is the next upgrade.";

  const likelyTrigger = makeupRisk
    ? "makeup + sleep-time pore clogging"
    : lowSleep
      ? "low sleep + stress hormones"
      : foodRisk
        ? "frequent sugar/maida/fried snacks"
        : profile.quiz.environment.location_type === "terai"
          ? "heat, sweat, humidity, and water quality"
          : profile.quiz.environment.location_type === "kathmandu_valley"
            ? "dust/AQI plus evening cleansing gaps"
            : "dry wind, strong UV, and barrier stress";

  const nextWeekFocus = makeupRisk
    ? "Every night: first cleanse makeup/SPF, then gentle face wash."
    : lowSleep
      ? "Move bedtime 30 minutes earlier for 4 nights."
      : foodRisk
        ? "Reduce cold drinks or maida first; do not try to fix every food at once."
        : "Complete the first 3 routine steps daily before adding anything new.";
  const whyChanged = score.parts.lifestyle < 12
    ? "Lifestyle points pulled the score down most: sleep, stress, movement, smoke/alcohol, screen time, or food signals need attention."
    : score.parts.weather < 6
      ? "Weather readiness was low, so UV/AQI/rain/humidity actions should be prepared earlier in the day."
      : score.parts.routine < 20
        ? "Routine completion changed the score most. The app rewards boring consistency because skin repairs slowly."
        : "Your core habits were stable; keep tracking so the next pattern is easier to spot.";
  const productAdjustment = makeupRisk
    ? "Add micellar water or oil cleanser before face wash; skip heavy foundation for 2-3 days if bumps are new."
    : lowSleep || stress
      ? "Do not add strong actives this week. Keep cleanser, moisturizer, SPF, and one spot treatment only."
      : profile.quiz.environment.location_type === "terai"
        ? "Use lighter moisturizer and non-comedogenic sunscreen; avoid heavy oils during sweaty days."
        : profile.quiz.environment.location_type === "mountain"
          ? "Use richer moisturizer on damp skin and lip balm with SPF."
          : "Keep one reliable sunscreen and one gentle cleanser before buying extra serums.";
  const sevenDayPlan = [
    "Days 1-2: keep routine simple and log sleep, water, SPF, and makeup removal.",
    "Days 3-4: fix the weakest trigger only; do not change every habit together.",
    "Day 5: check whether new bumps, dryness, or marks are improving or worsening.",
    "Days 6-7: repeat the working steps and prepare next week's weather/product adjustment."
  ];

  return {
    title: score.score >= 75 ? "Good progress week" : score.score >= 50 ? "Steady reset week" : "Repair-first week",
    summary: `Your skin score is ${score.score}/100. The pattern points mostly to ${likelyTrigger}.`,
    bestHabit,
    weakestHabit,
    likelyTrigger,
    whyChanged,
    nextWeekFocus,
    productAdjustment,
    modeSuggestion: suggestMode(profile),
    sevenDayPlan
  };
}

function suggestMode(profile: UserProfile) {
  const env = profile.quiz.environment;
  const lifestyle = profile.quiz.lifestyle;
  if (env.current_season === "monsoon" || env.location_type === "terai") return "Monsoon Mode";
  if (env.current_season === "winter" || env.location_type === "mountain") return "Winter Barrier Mode";
  if (lifestyle.stress_level === "high" || lifestyle.sleep_hours === "less_than_5") return "Exam Mode";
  if (profile.budgetTier === "under200") return "Low Budget Mode";
  return "Festival/Event Prep Mode";
}
