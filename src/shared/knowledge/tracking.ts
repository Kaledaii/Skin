import { DailyCheckIn, UserProfile } from "../types";
import { GeneratedStep } from "./types";
import { calculateWeatherReadiness, WeatherAction } from "./weatherGuidance";

type HabitScoreInput = {
  completion: Record<string, boolean>;
  routineSteps: GeneratedStep[];
  profile: UserProfile;
  checkIn: DailyCheckIn;
  weatherActions?: WeatherAction[];
};

export type HabitScore = {
  score: number;
  parts: {
    routine: number;
    care: number;
    wellness: number;
    lifestyle: number;
    weather: number;
    logs: number;
  };
  reasons: string[];
};

export function calculateSkinHabitScore({ completion, routineSteps, profile, checkIn, weatherActions = [] }: HabitScoreInput): HabitScore {
  const routineIds = Array.from(new Set(routineSteps.map((step) => step.id)));
  const completed = routineIds.filter((id) => completion[id] || checkIn.completedStepIds.includes(id)).length;
  const routine = routineIds.length ? Math.round((completed / routineIds.length) * 30) : 0;

  const sunscreen = checkIn.sunscreen || profile.quiz.currentRoutine.uses_sunscreen === "yes";
  const makeupUsuallyUsed = profile.quiz.currentRoutine.uses_makeup_daily === "yes" || profile.quiz.currentRoutine.uses_makeup_daily === "sometimes";
  const makeupRemoved = !makeupUsuallyUsed || checkIn.makeupRemoved || profile.quiz.currentRoutine.removes_makeup_before_bed === "yes";
  const care = (sunscreen ? 10 : profile.quiz.currentRoutine.uses_sunscreen === "sometimes" ? 5 : 0) + (makeupRemoved ? 10 : 0);

  const water = checkIn.water === "more_than_2" ? 7 : checkIn.water === "1_to_2" ? 5 : 2;
  const sleep = checkIn.sleep === "6_to_8" || checkIn.sleep === "more_than_8" ? 8 : checkIn.sleep === "5_to_6" ? 5 : 1;
  const wellness = water + sleep;
  const stressToday = checkIn.stressToday ?? profile.quiz.lifestyle.stress_level;
  const screenTimeToday = checkIn.screenTimeToday ?? profile.quiz.lifestyle.screen_time_hours;
  const movementToday = checkIn.movementToday ?? profile.quiz.lifestyle.exercise;

  const lifestyleBase = 20;
  const lifestylePenalty =
    (stressToday === "high" ? 3 : 0) +
    (movementToday === "none" ? 3 : 0) +
    (profile.quiz.lifestyle.junk_food_frequency === "high" || profile.quiz.lifestyle.junk_food_frequency === "very_high" ? 3 : 0) +
    (screenTimeToday === "more_than_6" ? 2 : 0) +
    (checkIn.smoked ? 5 : profile.quiz.lifestyle.smoking === "yes" ? 2 : 0) +
    (checkIn.alcohol ? 4 : profile.quiz.lifestyle.alcohol === "yes" ? 2 : 0);
  const lifestyleReward =
    (movementToday === "regular" ? 2 : 0) +
    (profile.quiz.lifestyle.diet === "home_cooked" || profile.quiz.lifestyle.diet === "mostly_dal_bhat" ? 2 : 0);
  const lifestyle = Math.max(0, Math.min(20, lifestyleBase - lifestylePenalty + lifestyleReward));
  const weatherReadiness = calculateWeatherReadiness(weatherActions, checkIn, profile);
  const logs = Math.min(5, (profile.selfieUri || checkIn.selfieUri ? 2 : 0) + (checkIn.skinNote ? 2 : 0) + (checkIn.moodNote ? 1 : 0));

  const reasons: string[] = [];
  reasons.push(routine >= 23 ? "Routine consistency is strong." : "Routine steps still have room today.");
  reasons.push(sunscreen ? "SPF is counted." : "SPF missed: dark marks and UV risk rise.");
  if (makeupUsuallyUsed) reasons.push(makeupRemoved ? "Makeup removal is protecting pores." : "Makeup removal missed: pore-clog risk rises.");
  reasons.push(checkIn.water === "less_than_1" ? "Water is low today." : "Hydration is supporting plump skin.");
  reasons.push(checkIn.sleep === "less_than_5" ? "Sleep is low, so skin repair may slow." : "Sleep is helping repair.");
  if (stressToday === "high") reasons.push("Stress is high today: try 5-min breathing tonight.");
  if (movementToday === "none") reasons.push("No movement today: 15-min walk can help circulation.");
  if (profile.quiz.lifestyle.junk_food_frequency === "high" || profile.quiz.lifestyle.junk_food_frequency === "very_high") reasons.push("Junk food high: reduce sweet drinks/maida first.");
  if (screenTimeToday === "more_than_6") reasons.push("Screen time is high today: wipe phone and protect sleep.");
  if (checkIn.smoked || profile.quiz.lifestyle.smoking === "yes") reasons.push("Smoking can reduce oxygen flow, break collagen, and slow healing.");
  if (checkIn.alcohol || profile.quiz.lifestyle.alcohol === "yes") reasons.push("Alcohol can dehydrate skin, worsen puffiness, and disturb sleep.");
  reasons.push(...weatherReadiness.reasons.slice(0, 2));
  if (!profile.selfieUri && !checkIn.selfieUri) reasons.push("Add a weekly selfie for better progress tracking.");

  const score = Math.min(100, routine + care + wellness + lifestyle + weatherReadiness.score + logs);
  return { score, parts: { routine, care, wellness, lifestyle, weather: weatherReadiness.score, logs }, reasons };
}
