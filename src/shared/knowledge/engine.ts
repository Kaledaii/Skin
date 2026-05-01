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
  acne: ["C001", "C011", "C012", "C014"],
  dark_spots: ["C002", "C005", "C010"],
  pigmentation: ["C002", "C005", "C010", "C015"],
  dullness: ["C006", "C007", "C013", "C015"],
  dryness: ["C003", "C008"],
  dehydration: ["C003", "C008", "C013"],
  oiliness: ["C004", "C009"],
  redness: ["C005", "C008", "C014"],
  uneven_tone: ["C002", "C005", "C007", "C010"],
  large_pores: ["C004", "C009"],
  rough_texture: ["C006", "C007", "C009"],
  sensitivity: ["C006", "C008", "C012"],
  wrinkles: ["C015"],
  dark_circles: ["C013"]
};

export function getDefaultQuizProfile(): QuizProfile {
  return JSON.parse(JSON.stringify(fallbackProfile)) as QuizProfile;
}

export function generateRoutine(profile: QuizProfile): GeneratedRoutineResult {
  const matches = matchConditions(profile);
  const sourceConditions = matches.map((match) => match.condition);

  const conditionMorning = sourceConditions.flatMap((condition) => condition.routine.morning ?? []).map(toGeneratedStep);
  const conditionEvening = sourceConditions.flatMap((condition) => condition.routine.evening ?? []).map(toGeneratedStep);
  const movedToEvening = conditionMorning.filter(shouldMoveToEvening);
  const morning =
    sourceConditions.length > 0
      ? mergeSteps([...coreMorningSteps(), ...conditionMorning.filter((step) => shouldShowInDailyRoutine(step) && !shouldMoveToEvening(step))], "morning").slice(0, 8)
      : fallbackMorning();
  const evening =
    sourceConditions.length > 0
      ? mergeSteps([...coreEveningSteps(), ...conditionEvening.filter(shouldShowInDailyRoutine), ...movedToEvening], "evening").slice(0, 8)
      : fallbackEvening();
  const weekly =
    sourceConditions.length > 0 ? mergeSteps(sourceConditions.flatMap((condition) => condition.routine.weekly ?? []).map(toGeneratedWeeklyStep), "weekly").slice(0, 6) : [];
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
    id: normalizeAction(cleanRoutineAction(step.action)),
    action: cleanRoutineAction(step.action),
    instruction: { en: step.instruction_en, ne: step.instruction_ne ?? step.instruction_en },
    durationSeconds: step.duration_seconds
  };
}

function toGeneratedWeeklyStep(step: KnowledgeWeeklyStep): GeneratedStep {
  return {
    id: normalizeAction(cleanRoutineAction(step.action)),
    action: cleanRoutineAction(step.action),
    instruction: { en: step.instruction_en, ne: step.instruction_ne ?? step.instruction_en },
    frequency: step.frequency
  };
}

function mergeSteps(steps: GeneratedStep[], period: "morning" | "evening" | "weekly" = "morning") {
  const map = new Map<string, GeneratedStep>();
  for (const step of steps) {
    const key = normalizeAction(step.action);
    if (!map.has(key)) map.set(key, { ...step, id: key });
  }
  return Array.from(map.values()).sort((a, b) => priority(a.action, period) - priority(b.action, period));
}

function cleanRoutineAction(action: string) {
  return action.replace(/^(Diet|Habit|Evening habit):\s*/i, "").trim();
}

function shouldShowInDailyRoutine(step: GeneratedStep) {
  const text = `${step.action} ${step.instruction.en}`.toLowerCase();
  if (text.startsWith("diet:")) return false;
  if (text.includes("eat ") || text.includes("drink ") || text.includes("iron-rich") || text.includes("water daily")) return false;
  if (text.includes("blood test") || text.includes("food diary")) return false;
  return true;
}

function shouldMoveToEvening(step: GeneratedStep) {
  const text = `${step.action} ${step.instruction.en}`.toLowerCase();
  return text.includes("sleep") || text.includes("before bed") || text.includes("pillowcase") || text.includes("night");
}

function coreMorningSteps(): GeneratedStep[] {
  return [
    {
      id: "gentle-cleanser",
      action: "Gentle cleanser",
      instruction: { en: "Start by washing away sweat and overnight buildup with lukewarm water.", ne: "Start by washing away sweat and overnight buildup with lukewarm water." }
    },
    {
      id: "toner-rose-water",
      action: "Toner or rose water",
      instruction: { en: "Pat on rose water or a gentle toner to prep skin without friction.", ne: "Pat on rose water or a gentle toner to prep skin without friction." }
    },
    {
      id: "vitamin-c-antioxidant",
      action: "Vitamin C or antioxidant serum",
      instruction: { en: "Use this before moisturizer and SPF, especially on polluted or high-UV days.", ne: "Use this before moisturizer and SPF, especially on polluted or high-UV days." }
    },
    {
      id: "light-moisturizer",
      action: "Light moisturizer",
      instruction: { en: "Seal hydration while skin is still slightly damp.", ne: "Seal hydration while skin is still slightly damp." }
    },
    {
      id: "sunscreen-spf30",
      action: "Sunscreen SPF 30+",
      instruction: { en: "Finish with sunscreen on face, neck, and exposed skin every morning.", ne: "Finish with sunscreen on face, neck, and exposed skin every morning." }
    }
  ];
}

function coreEveningSteps(): GeneratedStep[] {
  return [
    {
      id: "first-cleanse",
      action: "First cleanse",
      instruction: { en: "Remove sunscreen, makeup, oil, and pollution with micellar water or an oil cleanse.", ne: "Remove sunscreen, makeup, oil, and pollution with micellar water or an oil cleanse." }
    },
    {
      id: "second-cleanse",
      action: "Second cleanse",
      instruction: { en: "Follow with a gentle water-based cleanser so pores are actually clean.", ne: "Follow with a gentle water-based cleanser so pores are actually clean." }
    },
    {
      id: "treatment-serum",
      action: "Treatment serum or spot care",
      instruction: { en: "Apply niacinamide, acne spot care, or the matched treatment only after cleansing.", ne: "Apply niacinamide, acne spot care, or the matched treatment only after cleansing." }
    },
    {
      id: "night-moisturizer",
      action: "Night moisturizer",
      instruction: { en: "Finish by repairing the barrier before sleep.", ne: "Finish by repairing the barrier before sleep." }
    }
  ];
}

function priority(action: string, period: "morning" | "evening" | "weekly") {
  const normalized = action.toLowerCase();
  if (period === "weekly") {
    if (normalized.includes("steam")) return 10;
    if (normalized.includes("exfoliat") || normalized.includes("scrub")) return 20;
    if (normalized.includes("clay") || normalized.includes("multani") || normalized.includes("mask") || normalized.includes("ubtan")) return 30;
    if (normalized.includes("aloe") || normalized.includes("honey") || normalized.includes("oat")) return 40;
    return 60;
  }

  if (normalized.includes("cleanse") || normalized.includes("cleanser") || normalized.includes("wash")) return 10;
  if (normalized.includes("toner") || normalized.includes("rose water")) return 20;
  if (normalized.includes("vitamin c") || normalized.includes("antioxidant")) return period === "morning" ? 30 : 80;
  if (normalized.includes("niacinamide") || normalized.includes("retinol") || normalized.includes("treatment") || normalized.includes("spot") || normalized.includes("benzoyl") || normalized.includes("salicylic") || normalized.includes("acne")) return period === "morning" ? 35 : 30;
  if (normalized.includes("mask") || normalized.includes("paste") || normalized.includes("neem") || normalized.includes("turmeric") || normalized.includes("aloe")) return period === "morning" ? 45 : 35;
  if (normalized.includes("moistur") || normalized.includes("cream") || normalized.includes("barrier")) return 40;
  if (normalized.includes("sunscreen") || normalized.includes("spf")) return period === "morning" ? 50 : 80;
  if (normalized.includes("sleep") || normalized.includes("pillowcase") || normalized.includes("phone")) return 90;
  if (normalized.includes("hydrat")) return 60;
  return 70;
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

  if (location === "mountain") {
    return {
      id: "mountain-barrier-water",
      title: { en: "Mountain barrier water care", ne: "Mountain barrier water care" },
      tips: {
        en: [
          "Cold, dry mountain air makes skin lose water faster, so moisturize within 60 seconds after washing.",
          source === "well" ? "If you use well water, boil and cool it or filter it for the final face rinse." : "Use lukewarm water only; hot water strips the barrier quickly at altitude.",
          "Add a thicker night cream or facial oil on tight, flaky areas."
        ],
        ne: [
          "Mountain air le skin chhito dry banauchha, face wash pachi 60 seconds bhitra moisturizer lagaunuhos.",
          source === "well" ? "well water bhaye final rinse ko lagi boil/cool gareko wa filtered pani use garnuhos." : "hot water haina, lukewarm pani use garnuhos; altitude ma barrier chhito weak hunchha.",
          "tight wa flaky area ma rati thicker cream wa facial oil thapnuhos."
        ]
      }
    };
  }

  if (location === "hilly") {
    return {
      id: "hilly-seasonal-water",
      title: { en: "Hilly-region water care", ne: "Hilly-region water care" },
      tips: {
        en: [
          "Hilly weather swings between sun, wind, and dry evenings, so keep cleansing gentle.",
          source === "well" ? "For well water, filter the final rinse if your cheeks feel tight after washing." : "If tap water feels harsh, finish with a splash of filtered water.",
          "Use moisturizer before skin fully dries to protect the barrier."
        ],
        ne: [
          "Hilly weather ma sun, wind ra dry evening change huncha, cleansing gentle rakhnu hos.",
          source === "well" ? "well water le cheeks tight bhaye final rinse filtered pani le garnuhos." : "tap water harsh lage final rinse filtered pani le garnuhos.",
          "skin pura nasukdai moisturizer lagaera barrier jogaunuhos."
        ]
      }
    };
  }

  if (location === "terai" || source === "well") {
    return {
      id: "terai-well",
      title: { en: "Terai well water care", ne: "Terai well water care" },
      tips: {
        en: ["Use filtered or boiled/cooled water for the final face rinse.", "If water is muddy or iron-rich, avoid direct face washing until it is filtered.", "Use micellar water first when skin feels gritty."],
        ne: ["final face rinse ko lagi filtered wa boil/cool gareko pani use garnuhos.", "pani muddy wa iron-rich chha bhane filter nagari face wash nagarnuhos.", "skin gritty lage pahile micellar water use garnuhos."]
      }
    };
  }

  if (source === "tanker") {
    return {
      id: "tanker-barrier",
      title: { en: "Tanker-water barrier care", ne: "Tanker-water barrier care" },
      tips: {
        en: ["Tanker water can be chlorinated, so use a filtered final rinse when possible.", "Let stored water sit before face washing if it smells strongly of chlorine.", "Moisturize immediately after washing to protect the barrier."],
        ne: ["tanker water ma chlorine huna sakchha, sakey samma filtered final rinse garnuhos.", "chlorine smell dherai aaye pani kehi ber rakhna dinuhos.", "wash pachi turuntai moisturizer lagaunuhos."]
      }
    };
  }

  return {
    id: "kathmandu-hard-water",
    title: { en: "Kathmandu hard-water care", ne: "Kathmandu hard-water care" },
    tips: {
      en: ["Use filtered water for the final rinse when skin feels tight.", "Micellar water can remove sunscreen before cleanser.", "Avoid harsh scrubbing because hard water can already stress the barrier."],
      ne: ["skin tight lage final rinse filtered pani le garnuhos.", "cleanser aghi sunscreen hatauna micellar water use garna sakincha.", "hard water le barrier stress garna sakchha, jorle scrub nagarnuhos."]
    }
  };
}

function buildDailyMicroTips(profile: QuizProfile, matches: ConditionMatch[], waterTip: WaterQualityTip): DailyMicroTip[] {
  const tips: DailyMicroTip[] = [];
  const topId = matches[0]?.condition.id;

  if (topId === "C001") {
    tips.push({ id: "acne-touch", tag: "acne", text: { en: "Active pimples? Hands off, cleanse gently tonight, and spot treat only.", ne: "active pimple chha? haat nalagaunuhos, beluka gentle cleanse garera spot treatment matra garnuhos." } });
  } else if (topId === "C002" || topId === "C005") {
    tips.push({ id: "pigment-spf", tag: "marks", text: { en: "Dark marks fade slower without daily SPF, even when you stay indoors.", ne: "daily SPF bina dark marks dhilo fade hunchha, indoor basda pani." } });
  } else if (topId === "C003") {
    tips.push({ id: "dry-barrier", tag: "barrier", text: { en: "Tight after washing? Apply moisturizer while skin is still damp.", ne: "wash pachi skin tight hunchha? ali bhijekai bela moisturizer lagaunuhos." } });
  } else if (topId === "C004") {
    tips.push({ id: "oil-moisturizer", tag: "oil", text: { en: "Oily skin still needs moisturizer; skipping it can trigger more oil.", ne: "oily skin lai pani moisturizer chahinchha; skip garda ajhai oil badhna sakchha." } });
  } else if (topId === "C006") {
    tips.push({ id: "sensitive-pause", tag: "sensitive", text: { en: "Sensitive today? Pause actives and use only cleanser, moisturizer, SPF.", ne: "sensitive chha? aaja actives roknuhos, cleanser, moisturizer, SPF matra." } });
  } else if (topId === "C007") {
    tips.push({ id: "dull-antioxidant", tag: "glow", text: { en: "Dull skin needs sleep, water, and a gentle cleanse before more actives.", ne: "dull skin ko lagi dherai actives bhanda pahile sleep, pani ra gentle cleanse chahinchha." } });
  }

  if (profile.lifestyle.water_intake_liters === "less_than_1") {
    tips.push({ id: "hydrate", tag: "hydration", text: { en: "Under 1L water today? Add one glass before tea.", ne: "aaja pani kam bhayo? chiya aghi ek glass pani thapnuhos." } });
  }
  if (profile.environment.current_season === "monsoon") {
    tips.push({ id: "monsoon", tag: "monsoon", text: { en: "Monsoon humidity is high; keep skin folds dry.", ne: "monsoon humidity dherai chha; skin folds dry rakhnu hos." } });
  }
  if (profile.currentRoutine.uses_sunscreen === "no" || profile.currentRoutine.uses_sunscreen === "sometimes") {
    tips.push({ id: "uv-sunscreen", tag: "uv", text: { en: "Sunscreen is the non-negotiable step for your selected plan.", ne: "tapai ko plan ma sunscreen non-negotiable step ho." } });
  }
  tips.push({ id: waterTip.id, tag: "water", text: { en: waterTip.tips.en[0], ne: waterTip.tips.ne[0] } });

  return tips.length > 0 ? tips : [{ id: waterTip.id, tag: "water", text: { en: waterTip.tips.en[0], ne: waterTip.tips.ne[0] } }];
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
