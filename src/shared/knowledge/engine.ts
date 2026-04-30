import rawKnowledgeBase from "./skin_knowledge_base.json";
import { Language } from "../types";
import {
  ConditionMatch,
  DailyMicroTip,
  GeneratedRoutineResult,
  GeneratedStep,
  KnowledgeBase,
  KnowledgeCondition,
  KnowledgeFood,
  KnowledgeRoutineStep,
  KnowledgeWeeklyStep,
  QuizProfile,
  WaterQualityTip
} from "./types";

export const knowledgeBase = rawKnowledgeBase as KnowledgeBase;

const fallbackProfile: QuizProfile = {
  primaryConcerns: [],
  symptoms: [],
  ageGroup: "18_24",
  lifestyle: {
    sleep_hours: "5_to_6",
    diet: "home_cooked",
    junk_food_frequency: "low",
    water_intake_liters: "1_to_2",
    stress_level: "moderate",
    exercise: "occasional",
    smoking: "no",
    alcohol: "no",
    screen_time_hours: "3_to_6",
    outdoor_exposure: "moderate"
  },
  environment: {
    location_type: "kathmandu_valley",
    water_source: "tap_municipal",
    current_season: "autumn",
    pollution_exposure: "moderate"
  },
  currentRoutine: {
    uses_sunscreen: "sometimes",
    cleanses_twice: "no",
    moisturizes: "yes",
    uses_toner: "no",
    uses_makeup_daily: "sometimes",
    removes_makeup_before_bed: "sometimes"
  }
};

const primaryConcernConditionMap: Record<string, string[]> = {
  acne: ["C001"],
  dark_spots: ["C002", "C005"],
  dullness: ["C007"],
  dryness: ["C003"],
  oiliness: ["C004"],
  redness: ["C006"],
  uneven_tone: ["C002", "C005", "C007"],
  large_pores: ["C004"],
  rough_texture: ["C007", "C003"],
  sensitivity: ["C006"],
  wrinkles: ["C003", "C007"],
  dark_circles: ["C007"]
};

export function getDefaultQuizProfile(): QuizProfile {
  return JSON.parse(JSON.stringify(fallbackProfile)) as QuizProfile;
}

export function generateRoutine(profile: QuizProfile): GeneratedRoutineResult {
  const matches = matchConditions(profile);
  const sourceConditions = matches.map((match) => match.condition);

  const morning =
    sourceConditions.length > 0
      ? mergeSteps(sourceConditions.flatMap((condition) => condition.routine.morning ?? []).map(toGeneratedStep))
      : fallbackMorning();
  const evening =
    sourceConditions.length > 0
      ? mergeSteps(sourceConditions.flatMap((condition) => condition.routine.evening ?? []).map(toGeneratedStep))
      : fallbackEvening();
  const weekly =
    sourceConditions.length > 0 ? mergeSteps(sourceConditions.flatMap((condition) => condition.routine.weekly ?? []).map(toGeneratedWeeklyStep)) : [];
  const dietEatMore =
    sourceConditions.length > 0
      ? uniqueFoods(sourceConditions.flatMap((condition) => condition.diet_recommendations?.eat_more ?? [])).slice(0, 5)
      : [
          { food_en: "Curd (Dahi)", food_ne: "दही", reason_en: "Probiotics support calmer skin.", reason_ne: "Probiotics ले छाला शान्त राख्न मद्दत गर्छ।" },
          { food_en: "Dal and lentils", food_ne: "दाल र केराउ", reason_en: "Protein helps skin repair.", reason_ne: "Protein ले छाला repair गर्न मद्दत गर्छ।" },
          { food_en: "Spinach and greens", food_ne: "पालक र हरियो साग", reason_en: "Micronutrients help skin look fresh.", reason_ne: "Micronutrients ले छाला fresh देखिन मद्दत गर्छ।" }
        ];
  const dietAvoid =
    sourceConditions.length > 0
      ? uniqueFoods(sourceConditions.flatMap((condition) => condition.diet_recommendations?.avoid ?? [])).slice(0, 4)
      : [
          { food_en: "Fried snacks", food_ne: "भुटेका snack", reason_en: "Can make skin feel heavier.", reason_ne: "छाला heavy feel हुन सक्छ।" },
          { food_en: "Excess spicy food", food_ne: "धेरै पिरो खाना", reason_en: "May trigger irritation.", reason_ne: "इरिटेशन बढ्न सक्छ।" }
        ];
  const contextTips =
    sourceConditions.length > 0
      ? sourceConditions.flatMap((condition) => condition.nepal_context_tips ?? []).slice(0, 4).map((tip) => ({
          category: tip.category,
          text: { en: tip.tip_en, ne: tip.tip_ne ?? tip.tip_en }
        }))
      : [
          {
            category: "general",
            text: {
              en: "Keep the routine simple for two weeks before adding more products.",
              ne: "नयाँ product थप्नुअघि दुई हप्ता routine simple राख्नुहोस्।"
            }
          }
        ];
  const waterTip = getWaterQualityTip(profile);
  const dailyMicroTips = buildDailyMicroTips(profile, matches, waterTip);

  return { matches, morning, evening, weekly, dietEatMore, dietAvoid, contextTips, waterTip, dailyMicroTips };
}

export function matchConditions(profile: QuizProfile): ConditionMatch[] {
  if (profile.primaryConcerns.length === 0 && profile.symptoms.length === 0) {
    return [];
  }

  return knowledgeBase.conditions
    .map((condition) => scoreCondition(condition, profile))
    .filter((match) => match.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function scoreCondition(condition: KnowledgeCondition, profile: QuizProfile): ConditionMatch {
  const reasons: string[] = [];
  let score = 0;

  for (const symptom of condition.trigger_symptoms.primary ?? []) {
    if (profile.symptoms.includes(symptom)) {
      score += 3;
      reasons.push(`Primary symptom: ${humanize(symptom)}`);
    }
  }
  for (const symptom of condition.trigger_symptoms.secondary ?? []) {
    if (profile.symptoms.includes(symptom)) {
      score += 2;
      reasons.push(`Supporting symptom: ${humanize(symptom)}`);
    }
  }
  for (const concern of profile.primaryConcerns) {
    if (primaryConcernConditionMap[concern]?.includes(condition.id)) {
      score += 4;
      reasons.push(`Primary concern: ${humanize(concern)}`);
    }
  }
  for (const trigger of condition.trigger_lifestyle?.high_impact ?? []) {
    if (matchesProfileTrigger(trigger, profile)) {
      score += 2;
      reasons.push(`Lifestyle: ${humanize(trigger)}`);
    }
  }
  for (const trigger of condition.trigger_lifestyle?.moderate_impact ?? []) {
    if (matchesProfileTrigger(trigger, profile)) {
      score += 1;
      reasons.push(`Lifestyle: ${humanize(trigger)}`);
    }
  }
  for (const trigger of condition.trigger_environment ?? []) {
    if (matchesKeyValue(trigger, profile.environment)) {
      score += 1;
      reasons.push(`Environment: ${humanize(trigger)}`);
    }
  }
  if ((condition.trigger_age ?? []).includes(profile.ageGroup)) {
    score += 1;
    reasons.push(`Age group: ${humanize(profile.ageGroup)}`);
  }

  return { condition, score, reasons };
}

function matchesKeyValue(trigger: string, bucket: Record<string, string>) {
  const [key, value] = trigger.split(":");
  return Boolean(key && value && bucket[key] === value);
}

function matchesLifestyleTrigger(trigger: string, lifestyle: Record<string, string>) {
  const [key, value] = trigger.split(":");
  if (!key || !value) return false;
  if (lifestyle[key] === value) return true;
  if (key === "diet" && value === "junk_food_frequent") {
    const junkFoodLevel = lifestyle.junk_food_frequency ?? "low";
    return junkFoodLevel === "high" || junkFoodLevel === "very_high";
  }
  return false;
}

function matchesProfileTrigger(trigger: string, profile: QuizProfile) {
  const [key, value] = trigger.split(":");
  if (!key || !value) return false;

  if (key.startsWith("current_routine.")) {
    const field = key.replace("current_routine.", "");
    return profile.currentRoutine[field] === value;
  }

  return matchesLifestyleTrigger(trigger, profile.lifestyle) || matchesKeyValue(trigger, profile.environment) || matchesKeyValue(trigger, profile.currentRoutine);
}

function toGeneratedStep(step: KnowledgeRoutineStep): GeneratedStep {
  return {
    id: normalizeAction(step.action),
    action: step.action,
    instruction: { en: step.instruction_en, ne: step.instruction_ne ?? step.instruction_en },
    durationSeconds: step.duration_seconds
  };
}

function toGeneratedWeeklyStep(step: KnowledgeWeeklyStep): GeneratedStep {
  return {
    id: normalizeAction(step.action),
    action: step.action,
    instruction: { en: step.instruction_en, ne: step.instruction_ne ?? step.instruction_en },
    frequency: step.frequency
  };
}

function mergeSteps(steps: GeneratedStep[]) {
  const map = new Map<string, GeneratedStep>();
  for (const step of steps) {
    const key = normalizeAction(step.action);
    if (!map.has(key)) map.set(key, { ...step, id: key });
  }
  return Array.from(map.values()).sort((a, b) => priority(a.action) - priority(b.action));
}

function priority(action: string) {
  const normalized = action.toLowerCase();
  if (normalized.includes("benzoyl") || normalized.includes("acne") || normalized.includes("salicylic")) return 1;
  if (normalized.includes("cleanse") || normalized.includes("cleanser")) return 2;
  if (normalized.includes("sunscreen") || normalized.includes("spf")) return 3;
  if (normalized.includes("moistur")) return 4;
  if (normalized.includes("vitamin") || normalized.includes("bright") || normalized.includes("niacinamide")) return 5;
  if (normalized.includes("hydrat")) return 6;
  return 10;
}

function uniqueFoods(foods: KnowledgeFood[]) {
  const map = new Map<string, KnowledgeFood>();
  for (const food of foods) {
    if (!map.has(food.food_en)) map.set(food.food_en, food);
  }
  return Array.from(map.values());
}

function fallbackMorning(): GeneratedStep[] {
  return [
    {
      id: "gentle-cleanser",
      action: "Gentle cleanser",
      instruction: { en: "Wash away sweat and dust without scrubbing hard.", ne: "पसिना र धुलो हल्का रूपमा सफा गर्नुहोस्।" }
    },
    {
      id: "light-moisturizer",
      action: "Light moisturizer",
      instruction: { en: "Use a light moisturizer to keep the barrier comfortable.", ne: "छालाको barrier आरामदायक राख्न हल्का moisturizer लगाउनुहोस्।" }
    },
    {
      id: "sunscreen-spf30",
      action: "Sunscreen SPF 30+",
      instruction: { en: "Finish with sunscreen before stepping outside.", ne: "बाहिर निस्कनुअघि sunscreen लगाउनुहोस्।" }
    }
  ];
}

function fallbackEvening(): GeneratedStep[] {
  return [
    {
      id: "evening-cleanser",
      action: "Evening cleanse",
      instruction: { en: "Remove dust, sunscreen, and sweat gently.", ne: "धुलो, sunscreen र पसिना हल्का रूपमा हटाउनुहोस्।" }
    },
    {
      id: "night-moisturizer",
      action: "Night moisturizer",
      instruction: { en: "Seal in moisture before sleep.", ne: "सुत्नुअघि moisture lock गर्नुहोस्।" }
    },
    {
      id: "water-check",
      action: "Hydration check",
      instruction: { en: "Drink a glass of water if your day has been dry or busy.", ne: "दिनभरि पानी कम भयो भने एक गिलास पानी पिउनुहोस्।" }
    }
  ];
}

function getWaterQualityTip(profile: QuizProfile): WaterQualityTip {
  const location = profile.environment.location_type;
  const source = profile.environment.water_source;

  if (location === "terai" || source === "well") {
    return {
      id: "terai-well",
      title: { en: "Terai well water care", ne: "Terai well water care" },
      tips: {
        en: ["Use filtered or boiled/cooled water for the final face rinse.", "If water is muddy or iron-rich, avoid direct face washing until it is filtered.", "Use micellar water first when skin feels gritty."],
        ne: ["final face rinse का लागि filtered वा उमालेर चिस्याएको पानी प्रयोग गर्नुहोस्।", "पानी धमिलो वा iron-rich छ भने filter नगरी अनुहार नधुनुहोस्।", "छाला gritty लागे पहिले micellar water प्रयोग गर्नुहोस्।"]
      }
    };
  }

  if (location === "mountain" || source === "tanker") {
    return {
      id: "mountain-tanker",
      title: { en: "Mountain tanker water care", ne: "Mountain tanker water care" },
      tips: {
        en: ["Tanker water can be chlorinated, so use a filtered final rinse when possible.", "Let stored water sit before face washing if it smells strongly of chlorine.", "Moisturize immediately after washing to protect the barrier."],
        ne: ["tanker water मा chlorine हुन सक्छ, सकेसम्म filtered final rinse गर्नुहोस्।", "chlorine गन्ध धेरै आए पानी केही बेर राखेर मात्र अनुहार धुनुहोस्।", "धोएपछि तुरुन्त moisturizer लगाएर barrier जोगाउनुहोस्।"]
      }
    };
  }

  return {
    id: "kathmandu-hard-water",
    title: { en: "Kathmandu hard-water care", ne: "Kathmandu hard-water care" },
    tips: {
      en: ["Use filtered water for the final rinse when skin feels tight.", "Micellar water can remove sunscreen before cleanser.", "Avoid harsh scrubbing because hard water can already stress the barrier."],
      ne: ["छाला tight लागे final rinse filtered पानीले गर्नुहोस्।", "cleanser अघि sunscreen हटाउन micellar water प्रयोग गर्न सकिन्छ।", "hard water ले barrier stress गर्न सक्छ, त्यसैले जोरले scrub नगर्नुहोस्।"]
    }
  };
}

function buildDailyMicroTips(profile: QuizProfile, matches: ConditionMatch[], waterTip: WaterQualityTip): DailyMicroTip[] {
  const tips: DailyMicroTip[] = [
    {
      id: "uv-sunscreen",
      tag: "uv",
      text: { en: "UV is high today — do not skip sunscreen.", ne: "आज UV index धेरै छ — sunscreen नछोड्नुस्।" }
    },
    {
      id: "dashain-double-cleanse",
      tag: "festival",
      text: { en: "After oily Dashain food, double cleanse at night.", ne: "Dashain मा oily खाना खाएपछि double cleanse गर्नुस्।" }
    }
  ];

  if (profile.lifestyle.water_intake_liters === "less_than_1") {
    tips.push({ id: "hydrate", tag: "hydration", text: { en: "Under 1L water today? Add one glass before tea.", ne: "आज पानी कम भयो? चिया अघि एक गिलास पानी थप्नुस्।" } });
  }
  if (profile.environment.current_season === "monsoon") {
    tips.push({ id: "monsoon", tag: "monsoon", text: { en: "Monsoon humidity is high — keep skin folds dry.", ne: "मनसुन humidity धेरै छ — skin folds सुख्खा राख्नुस्।" } });
  }
  if (matches[0]?.condition.id === "C001") {
    tips.push({ id: "acne-touch", tag: "acne", text: { en: "Active pimples? Hands off, spot treat only.", ne: "active pimple छ? हात नलगाउनुस्, spot treatment मात्र।" } });
  }
  tips.push({ id: waterTip.id, tag: "water", text: { en: waterTip.tips.en[0], ne: waterTip.tips.ne[0] } });

  return tips;
}

function normalizeAction(action: string) {
  return action.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function humanize(value: string) {
  return value.replace(/:/g, ": ").replace(/_/g, " ");
}

export function localized(language: Language, en: string, ne?: string) {
  return language === "ne" ? ne ?? en : en;
}
