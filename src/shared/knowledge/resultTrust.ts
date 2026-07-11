import { Product } from "../types";
import { ConditionMatch, GeneratedRoutineResult, QuizProfile } from "./types";

export type MatchConfidence = "Strong match" | "Possible match" | "Watch only";

export function getMatchConfidence(score: number): MatchConfidence {
  if (score >= 8) return "Strong match";
  if (score >= 5) return "Possible match";
  return "Watch only";
}

export function buildTrustReasons(match: ConditionMatch, profile: QuizProfile) {
  const reasons = new Set<string>();
  match.reasons.forEach((reason) => reasons.add(reason));
  if (profile.environment.location_type === "terai") reasons.add("Location: Terai heat/humidity can increase sweat, oil, and heat bumps.");
  if (profile.environment.location_type === "kathmandu_valley") reasons.add("Location: Kathmandu valley dust/AQI can clog pores and dull skin.");
  if (profile.environment.location_type === "hilly" || profile.environment.location_type === "mountain") reasons.add("Location: wind, cold/dry air, and strong UV can weaken the barrier.");
  if (profile.environment.water_source === "well" || profile.environment.water_source === "tanker") reasons.add(`Water: ${profile.environment.water_source} water can irritate or dry skin if harsh.`);
  if (profile.currentRoutine.uses_sunscreen !== "yes") reasons.add("Routine: sunscreen is not consistent, so marks and UV stress can last longer.");
  if ((profile.currentRoutine.uses_makeup_daily === "yes" || profile.currentRoutine.uses_makeup_daily === "sometimes") && profile.currentRoutine.removes_makeup_before_bed !== "yes") reasons.add("Routine: makeup is not always removed, so pore-clog risk rises.");
  if (profile.lifestyle.stress_level === "high") reasons.add("Lifestyle: high stress can worsen oil, pimples, itch, and under-eye puffiness.");
  if (profile.lifestyle.exercise === "none") reasons.add("Lifestyle: low movement can reduce circulation and stress recovery.");
  if (profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "medium") reasons.add("Food: frequent sweet/maida/fried snacks can worsen acne or dullness for some users.");
  if (profile.lifestyle.smoking === "yes") reasons.add("Habit: smoking can slow healing and break collagen faster.");
  if (profile.lifestyle.alcohol === "yes") reasons.add("Habit: alcohol can dehydrate skin and worsen puffiness/redness.");
  if (profile.cycle?.cycleBreakouts === "moderate" || profile.cycle?.cycleBreakouts === "severe") reasons.add("Cycle: hormonal changes around periods can contribute to breakouts, so the plan stays gentle and non-picking focused.");
  if (profile.cycle?.periodsRegular === "irregular" && (profile.cycle?.painfulDeepAcne === "yes" || profile.cycle?.cycleBreakouts === "severe")) reasons.add("Safety: irregular periods with painful deep acne should be discussed with a qualified clinician.");
  return Array.from(reasons).slice(0, 8);
}

export function buildPlanSections(result: GeneratedRoutineResult, products: Product[]) {
  const firstMorning = result.morning[0]?.action ?? "Gentle cleanser";
  const firstEvening = result.evening[0]?.action ?? "Evening cleanse";
  return [
    {
      title: "What to do today",
      body: `${firstMorning} in the morning, ${firstEvening} tonight, and keep SPF/non-picking as the non-negotiable base.`
    },
    {
      title: "7-day reset plan",
      body: "Days 1-2: gentle cleanse + moisturize. Days 3-4: add SPF consistency. Days 5-7: add one food/sleep habit and one matched treatment only."
    },
    {
      title: "Budget routine",
      body: "Start with cleanser, moisturizer, and sunscreen before buying serums. Spend on the step you will use daily."
    },
    {
      title: "Food + habit support",
      body: result.dietEatMore.slice(0, 3).map((food) => food.food_en).join(", ") || "Dal, saag, dahi, water, sleep, and lower sweet drinks."
    },
    {
      title: "Product suggestions",
      body: products.slice(0, 2).map((product) => `${product.name} (${product.price})`).join(" + ") || "Use the Products tab for budget-matched local picks."
    }
  ];
}

export function doctorWarning(match?: ConditionMatch) {
  return match?.condition.when_to_see_doctor ?? "See a dermatologist if symptoms are painful, spreading, scarring, infected, suddenly worsening, or not improving after 8-12 weeks of consistent gentle care.";
}
