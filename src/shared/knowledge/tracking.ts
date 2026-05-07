import { DailyCheckIn, UserProfile } from "../types";
import { GeneratedStep } from "./types";

type HabitScoreInput = {
  completion: Record<string, boolean>;
  routineSteps: GeneratedStep[];
  profile: UserProfile;
  checkIn: DailyCheckIn;
};

export type HabitScore = {
  score: number;
  parts: {
    routine: number;
    care: number;
    wellness: number;
    lifestyle: number;
    logs: number;
  };
  reasons: string[];
};

export function calculateSkinHabitScore({ completion, routineSteps, profile, checkIn }: HabitScoreInput): HabitScore {
  const routineIds = Array.from(new Set(routineSteps.map((step) => step.id)));
  const completed = routineIds.filter((id) => completion[id] || checkIn.completedStepIds.includes(id)).length;
  const routine = routineIds.length ? Math.round((completed / routineIds.length) * 40) : 0;

  const sunscreen = checkIn.sunscreen || profile.quiz.currentRoutine.uses_sunscreen === "yes";
  const makeupUsuallyUsed = profile.quiz.currentRoutine.uses_makeup_daily === "yes" || profile.quiz.currentRoutine.uses_makeup_daily === "sometimes";
  const makeupRemoved = !makeupUsuallyUsed || checkIn.makeupRemoved || profile.quiz.currentRoutine.removes_makeup_before_bed === "yes";
  const care = (sunscreen ? 10 : profile.quiz.currentRoutine.uses_sunscreen === "sometimes" ? 5 : 0) + (makeupRemoved ? 10 : 0);

  const water = checkIn.water === "more_than_2" ? 10 : checkIn.water === "1_to_2" ? 7 : 3;
  const sleep = checkIn.sleep === "6_to_8" || checkIn.sleep === "more_than_8" ? 10 : checkIn.sleep === "5_to_6" ? 6 : 2;
  const wellness = water + sleep;

  const smokingRisk = profile.quiz.lifestyle.smoking === "yes" || checkIn.smoked;
  const alcoholRisk = profile.quiz.lifestyle.alcohol === "yes" || checkIn.alcohol;
  const lifestyle = Math.max(0, 10 - (smokingRisk ? 5 : 0) - (alcoholRisk ? 3 : 0));
  const logs = Math.min(10, (profile.selfieUri || checkIn.selfieUri ? 5 : 0) + (checkIn.skinNote ? 3 : 0) + (checkIn.moodNote ? 2 : 0));

  const reasons: string[] = [];
  reasons.push(routine >= 30 ? "Routine consistency is strong." : "Routine steps still have room today.");
  reasons.push(sunscreen ? "SPF is counted." : "SPF missed: dark marks and UV risk rise.");
  if (makeupUsuallyUsed) reasons.push(makeupRemoved ? "Makeup removal is protecting pores." : "Makeup removal missed: pore-clog risk rises.");
  reasons.push(checkIn.water === "less_than_1" ? "Water is low today." : "Hydration is supporting plump skin.");
  reasons.push(checkIn.sleep === "less_than_5" ? "Sleep is low, so skin repair may slow." : "Sleep is helping repair.");
  if (smokingRisk) reasons.push("Smoking can reduce oxygen flow, break collagen, and slow healing.");
  if (alcoholRisk) reasons.push("Alcohol can dehydrate skin, worsen puffiness, and disturb sleep.");
  if (!profile.selfieUri && !checkIn.selfieUri) reasons.push("Add a weekly selfie for better progress tracking.");

  const score = Math.min(100, routine + care + wellness + lifestyle + logs);
  return { score, parts: { routine, care, wellness, lifestyle, logs }, reasons };
}
