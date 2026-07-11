import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";
import { DailyCheckIn, UserProfile } from "../types";

export type LifestyleSignal = {
  id: string;
  tone: "warning" | "advice" | "tip" | "success" | "neutral";
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  title: string;
  body: string;
};

export function buildLifestyleSignals(profile: UserProfile, checkIn?: DailyCheckIn): LifestyleSignal[] {
  const quiz = profile.quiz;
  const lifestyle = quiz.lifestyle;
  const routine = quiz.currentRoutine;
  const stressToday = checkIn?.stressToday ?? lifestyle.stress_level;
  const movementToday = checkIn?.movementToday ?? lifestyle.exercise;
  const screenTimeToday = checkIn?.screenTimeToday ?? lifestyle.screen_time_hours;
  const signals: LifestyleSignal[] = [];
  const usesMakeup = routine.uses_makeup_daily === "yes" || routine.uses_makeup_daily === "sometimes";
  const makeupRemoved = checkIn?.makeupRemoved || routine.removes_makeup_before_bed === "yes";

  if (stressToday === "high") {
    signals.push(signal("stress", "warning", "activity", "Stress", "High stress is active", "Stress can worsen pimples, sensitivity, oiliness, dullness, and under-eye puffiness. Try 5 minutes breathing before sleep."));
  } else if (stressToday === "moderate") {
    signals.push(signal("stress", "tip", "activity", "Stress", "Stress noted", "Keep a small night wind-down. Phone down, cleanser, moisturizer, then sleep plan."));
  }

  if (movementToday === "none") {
    signals.push(signal("exercise-none", "advice", "activity", "Movement", "No exercise logged", "A 15-minute walk, dancing, stairs, or home chores counts. Movement helps circulation and stress."));
  } else if (movementToday === "regular") {
    signals.push(signal("exercise-regular", "success", "activity", "Movement", "Regular movement is helping", "After sweat-heavy workouts, rinse gently and change sweaty clothes so pores stay calmer."));
  }

  if (lifestyle.diet === "junk_food_frequent" || lifestyle.junk_food_frequency === "medium" || lifestyle.junk_food_frequency === "high" || lifestyle.junk_food_frequency === "very_high") {
    signals.push(signal("junk-food", "warning", "coffee", "Food", "Junk food is a skin signal", "Frequent sweet drinks, maida, fried snacks, momo/chowmein can worsen acne/oiliness for some. Reduce cold drinks first."));
  } else if (lifestyle.diet === "home_cooked" || lifestyle.diet === "mostly_dal_bhat") {
    signals.push(signal("dal-bhat", "success", "check-circle", "Food", "Dal bhat base is strong", "Dal gives protein. Add saag + lemon, dahi, eggs/paneer/soybean or machha when possible for glow support."));
  }

  if (lifestyle.diet === "vegetarian") {
    signals.push(signal("vegetarian", "tip", "coffee", "Food", "Vegetarian balance check", "Watch protein, iron, zinc, and B12-style support. Dal, chana, soybean, paneer, eggs if eaten, saag + lemon help."));
  }

  if ((checkIn?.water ?? lifestyle.water_intake_liters) === "less_than_1") {
    signals.push(signal("water-low", "warning", "droplet", "Water", "Water is low today", "Low water can make skin look tight, dull, or puffy. Add one glass before chiya or cold drink."));
  }

  if ((checkIn?.sleep ?? lifestyle.sleep_hours) === "less_than_5") {
    signals.push(signal("sleep-low", "warning", "moon", "Sleep", "Sleep is low", "Skin repair slows when sleep is very low. Keep tonight's routine simple and aim 30 minutes earlier."));
  } else if ((checkIn?.sleep ?? lifestyle.sleep_hours) === "5_to_6") {
    signals.push(signal("sleep-medium", "tip", "moon", "Sleep", "Sleep could improve", "Even a small sleep upgrade can reduce puffiness, stress, and picking urges."));
  }

  if (screenTimeToday === "more_than_6") {
    signals.push(signal("screen-time", "advice", "smartphone", "Screen", "High screen time", "Screen time can push late sleep and phone-touch breakouts. Wipe phone and keep it away for first 20 minutes in bed."));
  }

  if (lifestyle.outdoor_exposure === "high") {
    signals.push(signal("outdoor", "tip", "sun", "Outdoor", "High sun/dust exposure", "SPF, shade, and evening cleanse matter more when commute, college, field work, or travel is high."));
  }

  if (lifestyle.smoking === "yes" || checkIn?.smoked) {
    signals.push(signal("smoking", "warning", "x-circle", "Smoking", checkIn?.smoked ? "Smoke risk logged today" : "Smoking risk in profile", "Smoking can reduce oxygen flow, slow pimple healing, darken lips/under-eyes, and break collagen. Reduce gently, no shame."));
  }

  if (lifestyle.alcohol === "yes" || checkIn?.alcohol) {
    signals.push(signal("alcohol", "warning", "alert-triangle", "Alcohol", checkIn?.alcohol ? "Alcohol risk logged today" : "Alcohol risk in profile", "Alcohol can dehydrate skin, disturb sleep, worsen puffiness/redness. Next step: water, light food, gentle cleanse."));
  }

  if (usesMakeup) {
    signals.push(
      makeupRemoved
        ? signal("makeup-removed", "success", "check-circle", "Makeup", "Makeup removal is protecting pores", "Non-comedogenic makeup plus full removal before sleep lowers acne cosmetica and tiny bump risk.")
        : signal("makeup-missed", "warning", "x-circle", "Makeup", "Makeup removal is not consistent", "Use micellar water/oil cleanse first, then gentle cleanser. Clean brushes weekly and avoid sharing lip/eye products.")
    );
  }

  if (profile.gender === "female" && quiz.cycle?.periodTiming !== "not_applicable" && quiz.cycle?.periodTiming !== "prefer_not_to_say") {
    if (quiz.cycle.cycleBreakouts === "moderate" || quiz.cycle.cycleBreakouts === "severe" || quiz.cycle.painfulDeepAcne === "yes" || quiz.cycle.painfulDeepAcne === "sometimes") {
      signals.push(signal("cycle-breakouts", "advice", "calendar", "Cycle", "Period-linked breakouts noted", "Hormonal shifts around periods can trigger oil and acne. Keep care gentle, avoid scrubbing/picking, and use spot care only where needed."));
    }
    if (quiz.cycle.periodsRegular === "irregular" && (quiz.cycle.cycleBreakouts === "severe" || quiz.cycle.painfulDeepAcne === "yes")) {
      signals.push(signal("cycle-safety", "warning", "alert-triangle", "Cycle safety", "Clinician advice recommended", "Irregular periods plus painful deep acne deserves qualified medical advice. Prabha can support habits, not diagnose hormones."));
    }
  }

  return signals.slice(0, 9);
}

function signal(
  id: string,
  tone: LifestyleSignal["tone"],
  icon: LifestyleSignal["icon"],
  label: string,
  title: string,
  body: string
): LifestyleSignal {
  return { id, tone, icon, label, title, body };
}
