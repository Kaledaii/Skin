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
  },
  cycle: {
    periodTiming: "prefer_not_to_say",
    periodsRegular: "prefer_not_to_say",
    cycleBreakouts: "none",
    cycleSkinChange: "no_change",
    painfulDeepAcne: "no"
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
  const contextual = buildContextualRoutine(profile);

  const conditionMorning = sourceConditions.flatMap((condition) => condition.routine.morning ?? []).map(toGeneratedStep);
  const conditionEvening = sourceConditions.flatMap((condition) => condition.routine.evening ?? []).map(toGeneratedStep);
  const movedToEvening = conditionMorning.filter(shouldMoveToEvening);
  const morning =
    sourceConditions.length > 0
      ? mergeSteps([...coreMorningSteps(), ...contextual.morning, ...conditionMorning.filter((step) => shouldShowInDailyRoutine(step) && !shouldMoveToEvening(step))], "morning").slice(0, 8)
      : mergeSteps([...fallbackMorning(), ...contextual.morning], "morning").slice(0, 8);
  const evening =
    sourceConditions.length > 0
      ? mergeSteps([...coreEveningSteps(), ...contextual.evening, ...conditionEvening.filter(shouldShowInDailyRoutine), ...movedToEvening], "evening").slice(0, 8)
      : mergeSteps([...fallbackEvening(), ...contextual.evening], "evening").slice(0, 8);
  const weekly =
    sourceConditions.length > 0 ? mergeSteps([...contextual.weekly, ...sourceConditions.flatMap((condition) => condition.routine.weekly ?? []).map(toGeneratedWeeklyStep)], "weekly").slice(0, 6) : contextual.weekly;
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
      ? [...buildLifestyleContextTips(profile), ...sourceConditions.flatMap((condition) => condition.nepal_context_tips ?? []).map((tip) => ({
          category: tip.category,
          text: { en: sanitizeTextForProfile(tip.tip_en, profile), ne: tip.tip_ne ?? sanitizeTextForProfile(tip.tip_en, profile) }
        }))].slice(0, 6)
      : [
          ...buildLifestyleContextTips(profile),
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

  const usesMakeup = profile.currentRoutine.uses_makeup_daily === "yes" || profile.currentRoutine.uses_makeup_daily === "sometimes";
  const missesMakeupRemoval = usesMakeup && profile.currentRoutine.removes_makeup_before_bed !== "yes";
  if (missesMakeupRemoval && ["C001", "C004", "C009"].includes(condition.id)) {
    score += 2;
    reasons.push("Makeup removal: daily makeup not always removed before sleep");
  }
  if (profile.lifestyle.smoking === "yes" && ["C007", "C013", "C015"].includes(condition.id)) {
    score += 2;
    reasons.push("Lifestyle: smoking can slow healing and break collagen");
  }
  if (profile.lifestyle.alcohol === "yes" && ["C005", "C007", "C013", "C015"].includes(condition.id)) {
    score += 2;
    reasons.push("Lifestyle: alcohol can worsen dehydration, puffiness, and redness");
  }
  if (profile.lifestyle.stress_level === "high" && ["C001", "C006", "C007", "C013", "C014"].includes(condition.id)) {
    score += 2;
    reasons.push("Lifestyle: high stress can worsen acne, sensitivity, dullness, and puffiness");
  }
  if (profile.lifestyle.exercise === "none" && ["C007", "C013", "C015"].includes(condition.id)) {
    score += 1;
    reasons.push("Lifestyle: low movement can reduce glow and stress recovery");
  }
  if ((profile.lifestyle.diet === "junk_food_frequent" || profile.lifestyle.junk_food_frequency === "medium" || profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "very_high") && ["C001", "C004", "C007", "C009", "C010"].includes(condition.id)) {
    score += profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "very_high" ? 2 : 1;
    reasons.push("Lifestyle: frequent sweet/maida/fried foods may affect acne, oiliness, dullness, and marks");
  }
  if (profile.lifestyle.water_intake_liters === "less_than_1" && ["C003", "C007", "C013"].includes(condition.id)) {
    score += 2;
    reasons.push("Lifestyle: low water can show as tightness, dullness, or puffiness");
  }
  if (profile.lifestyle.screen_time_hours === "more_than_6" && ["C001", "C007", "C013"].includes(condition.id)) {
    score += 1;
    reasons.push("Lifestyle: high screen time can affect sleep, stress, and phone hygiene");
  }
  if (profile.lifestyle.diet === "vegetarian" && ["C007", "C013"].includes(condition.id)) {
    score += 1;
    reasons.push("Diet pattern: vegetarian users may need protein, iron, zinc, and B12-style support");
  }
  if ((profile.cycle?.cycleBreakouts === "moderate" || profile.cycle?.cycleBreakouts === "severe" || profile.cycle?.painfulDeepAcne === "yes") && ["C001", "C011", "C012", "C014"].includes(condition.id)) {
    score += profile.cycle?.cycleBreakouts === "severe" || profile.cycle?.painfulDeepAcne === "yes" ? 2 : 1;
    reasons.push("Cycle signal: period-linked breakouts can flare with hormone changes");
  }

  if (condition.id === "C015" && profile.ageGroup === "18_24" && !hasStrongPrematureAgingSignal(profile)) {
    return { condition, score: 0, reasons: ["Premature aging held back: no strong aging signal for this age group"] };
  }

  return { condition, score, reasons };
}

function hasStrongPrematureAgingSignal(profile: QuizProfile) {
  const symptoms = new Set(profile.symptoms);
  const concerns = new Set(profile.primaryConcerns);
  const highSun = profile.lifestyle.outdoor_exposure === "high" && profile.currentRoutine.uses_sunscreen !== "yes";
  return (
    symptoms.has("wrinkles") ||
    symptoms.has("dark_spots_sun") ||
    concerns.has("wrinkles") ||
    profile.lifestyle.smoking === "yes" ||
    profile.lifestyle.alcohol === "yes" ||
    profile.lifestyle.sleep_hours === "less_than_5" ||
    highSun
  );
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

function buildContextualRoutine(profile: QuizProfile): { morning: GeneratedStep[]; evening: GeneratedStep[]; weekly: GeneratedStep[] } {
  const morning: GeneratedStep[] = [];
  const evening: GeneratedStep[] = [];
  const weekly: GeneratedStep[] = [];
  const location = profile.environment.location_type;
  const usesMakeup = profile.currentRoutine.uses_makeup_daily === "yes" || profile.currentRoutine.uses_makeup_daily === "sometimes";
  const missesMakeupRemoval = usesMakeup && profile.currentRoutine.removes_makeup_before_bed !== "yes";

  if (missesMakeupRemoval) {
    evening.push({
      id: "makeup-first-cleanse",
      action: "Makeup first cleanse",
      instruction: {
        en: "Use micellar water or oil cleanser first, then gentle face wash. Sleeping with makeup can clog pores and trigger tiny bumps.",
        ne: "Pahile micellar water wa oil cleanser, ani gentle face wash. Makeup liyera sutda pores clog bhayera sano bumps aauna sakcha."
      }
    });
    weekly.push({
      id: "clean-makeup-brushes",
      action: "Clean makeup brushes",
      instruction: {
        en: "Wash makeup brushes once weekly and dry fully before use.",
        ne: "Makeup brush weekly wash garnuhos ra ramrari dry bhaye pachi matra use garnuhos."
      },
      frequency: "Weekly"
    });
  }

  if (profile.lifestyle.smoking === "yes") {
    evening.push({
      id: "smoking-repair-note",
      action: "Smoking repair support",
      instruction: {
        en: "Smoking can slow healing and break collagen. Add antioxidant foods today and avoid picking pimples.",
        ne: "Smoking le healing slow ra collagen break garna sakcha. Aaja antioxidant foods thapnuhos ra pimple na-nichornu."
      }
    });
  }

  if (profile.lifestyle.alcohol === "yes") {
    evening.push({
      id: "alcohol-recovery-hydration",
      action: "Alcohol recovery hydration",
      instruction: {
        en: "Alcohol can dehydrate skin and worsen puffiness. Drink water, keep routine gentle, and sleep earlier tonight.",
        ne: "Alcohol le skin dry/puffy banauna sakcha. Pani piunuhos, routine gentle rakhnu ra aaja chhito sutnu."
      }
    });
  }

  if (profile.lifestyle.stress_level === "high") {
    evening.push({
      id: "stress-breathing-reset",
      action: "5-minute stress reset",
      instruction: {
        en: "Before sleep, do 5 slow breaths and keep routine simple. Stress can worsen acne, itch, dullness, and under-eye puffiness.",
        ne: "Sutnu aghi 5 slow breaths garnuhos ra routine simple rakhnu. Stress le pimple, itch, dullness ra under-eye puffiness badhauna sakcha."
      }
    });
  }

  if (profile.cycle && profile.cycle.periodTiming !== "not_applicable" && profile.cycle.periodTiming !== "prefer_not_to_say") {
    if (profile.cycle.cycleBreakouts === "moderate" || profile.cycle.cycleBreakouts === "severe" || profile.cycle.painfulDeepAcne === "yes" || profile.cycle.painfulDeepAcne === "sometimes") {
      evening.push({
        id: "cycle-breakout-reset",
        action: "Cycle breakout reset",
        instruction: {
          en: "Around your period, keep the routine boring: gentle cleanse, moisturizer, SPF, and spot care only on active pimples. Do not scrub or pick.",
          ne: "Period tira routine simple rakhnu: gentle cleanse, moisturizer, SPF, active pimple ma matra spot care. Scrub/pick nagarnu."
        }
      });
      weekly.push({
        id: "cycle-pimple-patch",
        action: "Pimple patch support",
        instruction: {
          en: "Use hydrocolloid patches on whiteheads to reduce picking. Painful deep acne or scarring needs clinician advice.",
          ne: "whitehead ma hydrocolloid patch use garna sakincha picking kam garna. Painful deep acne/scarring bhaye clinician advice."
        },
        frequency: "During flare"
      });
    }
    if (profile.cycle.cycleSkinChange === "oilier") {
      morning.push({
        id: "cycle-oil-balance",
        action: "Light oil-balance care",
        instruction: {
          en: "If skin feels oilier around your period, use a light non-comedogenic moisturizer and avoid heavy oils on acne-prone zones.",
          ne: "period tira oily lage light non-comedogenic moisturizer use garnu, acne-prone zone ma heavy oil avoid garnu."
        }
      });
    }
    if (profile.cycle.cycleSkinChange === "drier" || profile.cycle.cycleSkinChange === "sensitive") {
      evening.push({
        id: "cycle-barrier-care",
        action: "Cycle barrier care",
        instruction: {
          en: "If skin feels dry or sensitive during this cycle, pause harsh actives and focus on moisturizer, SPF, sleep, and water.",
          ne: "cycle ma dry/sensitive lage harsh actives roknu; moisturizer, SPF, sleep, pani ma focus garnu."
        }
      });
    }
    if (profile.cycle.periodsRegular === "irregular" && (profile.cycle.cycleBreakouts === "severe" || profile.cycle.painfulDeepAcne === "yes")) {
      weekly.push({
        id: "cycle-clinician-note",
        action: "Clinician check note",
        instruction: {
          en: "Irregular periods with painful deep acne should be discussed with a qualified clinician. This app gives skincare support, not hormone diagnosis.",
          ne: "irregular period ra painful deep acne bhaye qualified clinician sanga kura garnu. App skincare support ho, hormone diagnosis hoina."
        },
        frequency: "Safety"
      });
    }
  }

  if (profile.lifestyle.exercise === "none") {
    morning.push({
      id: "movement-glow-walk",
      action: "15-minute easy movement",
      instruction: {
        en: "Walk, dance, stairs, or home chores count. Gentle movement helps circulation and stress.",
        ne: "Walk, dance, stairs wa ghar ko kaam pani count huncha. Movement le circulation ra stress ma help garcha."
      }
    });
  } else if (profile.lifestyle.exercise === "regular") {
    evening.push({
      id: "post-sweat-cleanse",
      action: "Post-sweat cleanse",
      instruction: {
        en: "After heavy sweat, rinse gently and change sweaty clothes. Exercise is good; trapped sweat is the issue.",
        ne: "Dherai sweat pachi gentle rinse ra sweaty clothes change garnu. Exercise ramro ho; trapped sweat problem ho."
      }
    });
  }

  if (profile.lifestyle.diet === "junk_food_frequent" || profile.lifestyle.junk_food_frequency === "medium" || profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "very_high") {
    morning.push({
      id: "low-glycemic-swap",
      action: "One food swap",
      instruction: {
        en: "Swap one cold drink, mithai, chips, or maida snack with dahi, fruit, chana, nuts, or home khaja.",
        ne: "Ek cold drink, mithai, chips wa maida snack lai dahi, fruit, chana, nuts wa ghar ko khaja sanga swap garnu."
      }
    });
  }

  if (location === "kathmandu_valley") {
    evening.push({
      id: "kathmandu-pollution-double-cleanse",
      action: "Pollution double cleanse",
      instruction: {
        en: "After dusty commutes or high AQI, remove sunscreen/dust first, then use gentle cleanser so PM2.5 and roadside film do not sit overnight.",
        ne: "Dusty commute wa high AQI pachi pahile sunscreen/dhulo hataunu, ani gentle cleanser. PM2.5 ra road dust overnight basna nadinu."
      }
    });
    weekly.push({
      id: "kathmandu-clay-mask",
      action: "Clay or multani mitti mask",
      instruction: {
        en: "Use a clay or multani mitti mask once weekly on oily/clog-prone zones only. Do not let it crack fully dry.",
        ne: "Oily/clog-prone zone ma weekly clay/multani mitti mask. Pura crack dry huna nadinu."
      },
      frequency: "Weekly"
    });
  }

  if (profile.lifestyle.screen_time_hours === "more_than_6") {
    evening.push({
      id: "phone-hygiene-sleep",
      action: "Phone hygiene + sleep guard",
      instruction: {
        en: "Wipe phone screen and keep it away for the first 20 minutes in bed to protect sleep and cheek acne.",
        ne: "Phone screen wipe garnu ra bed ma first 20 min phone tada rakhnu, sleep ra cheek acne protect garna."
      }
    });
  }

  if (location === "terai") {
    morning.push({
      id: "terai-light-moisturizer",
      action: "Light non-comedogenic moisturizer",
      instruction: {
        en: "Use a light gel or lotion so sweat and heat do not make skin feel heavy.",
        ne: "Terai heat ma light gel/lotion use garnuhos, heavy feel hunna."
      }
    });
    evening.push({
      id: "terai-sweat-rinse",
      action: "Sweat rinse",
      instruction: {
        en: "After heavy sweat, rinse gently and keep skin folds dry to lower heat-and-humidity bumps.",
        ne: "Dherai pasina pachi gentle rinse garnuhos ra skin folds dry rakhnu hos."
      }
    });
    weekly.push({
      id: "terai-fungal-check",
      action: "Fungal bump check",
      instruction: {
        en: "In hot humid weeks, check forehead, chest, back, neck folds for itchy same-size bumps. Keep cotton clothes and dry towels.",
        ne: "Hot humid week ma forehead, chest, back, neck folds ma itchy same-size bumps check garnu. Cotton clothes ra dry towel."
      },
      frequency: "Weekly"
    });
  }

  if (location === "mountain" || location === "hilly") {
    morning.push({
      id: "altitude-barrier-moisturizer",
      action: "Barrier moisturizer",
      instruction: {
        en: "Cold, wind, and altitude dry skin faster. Moisturize while skin is still damp.",
        ne: "Cold, wind ra altitude le skin dry banauchha. Skin damp huda moisturizer lagaunuhos."
      }
    });
    evening.push({
      id: "lukewarm-water-only",
      action: "Lukewarm water only",
      instruction: {
        en: "Avoid hot water on face; it strips the barrier faster in dry weather.",
        ne: "Face ma hot water avoid garnuhos; dry weather ma barrier chhito weak hunchha."
      }
    });
    weekly.push({
      id: "wind-barrier-check",
      action: "Wind barrier check",
      instruction: {
        en: "Check cheeks, lips, and nose corners for wind burn or flaky patches. Add richer moisturizer before cold/windy exposure.",
        ne: "Cheeks, lips ra nose corner ma wind burn/flaky patch check garnu. Cold/windy exposure aghi richer moisturizer."
      },
      frequency: "Weekly"
    });
  }

  return { morning, evening, weekly };
}

function buildLifestyleContextTips(profile: QuizProfile) {
  const tips: Array<{ category: string; text: Record<Language, string> }> = [];
  const location = profile.environment.location_type;
  if (profile.lifestyle.smoking === "yes") {
    tips.push({
      category: "smoking",
      text: {
        en: "Smoking can reduce oxygen flow, slow pimple healing, darken lips/under-eyes, and break collagen faster. Reduce gently, no shame.",
        ne: "Smoking le oxygen flow kam, pimple healing slow, lips/under-eye dark ra collagen break garna sakcha. Bistarai reduce garnu, shame haina."
      }
    });
  }
  if (profile.lifestyle.alcohol === "yes") {
    tips.push({
      category: "alcohol",
      text: {
        en: "Alcohol can dehydrate skin, disturb sleep, and worsen puffiness the next day. Add water and keep the routine simple.",
        ne: "Alcohol le dehydration, sleep disturb ra puffiness badhauna sakcha. Pani thapnu ra routine simple rakhnu."
      }
    });
  }
  if (profile.currentRoutine.uses_makeup_daily === "yes" || profile.currentRoutine.uses_makeup_daily === "sometimes") {
    tips.push({
      category: "makeup",
      text: {
        en: "Daily makeup is okay, but choose non-comedogenic products, remove it before sleep, and clean brushes weekly.",
        ne: "Daily makeup okay ho, tara non-comedogenic product, sutnu aghi remove, ra weekly brush clean garnu."
      }
    });
  }
  if (profile.lifestyle.stress_level === "high") {
    tips.push({
      category: "stress",
      text: {
        en: "High stress can worsen pimples, itch, redness, dullness, and under-eye puffiness. Add a tiny breathing and sleep routine.",
        ne: "High stress le pimple, itch, redness, dullness ra under-eye puffiness badhauna sakcha. Sano breathing ra sleep routine thapnu."
      }
    });
  }
  if (profile.lifestyle.exercise === "none") {
    tips.push({
      category: "movement",
      text: {
        en: "No gym needed: 15 minutes walking, dancing, stairs, or home chores can support circulation and stress.",
        ne: "Gym chahidaina: 15 min walk, dance, stairs wa ghar ko kaam le circulation ra stress support garcha."
      }
    });
  }
  if (profile.lifestyle.diet === "junk_food_frequent" || profile.lifestyle.junk_food_frequency === "medium" || profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "very_high") {
    tips.push({
      category: "food",
      text: {
        en: "Frequent cold drinks, mithai, maida, momo/chowmein, and fried snacks can affect acne/oiliness for some users. Reduce one trigger first.",
        ne: "Cold drinks, mithai, maida, momo/chowmein ra fried snacks frequent bhaye acne/oiliness ma effect parna sakcha. Pahile ek trigger kam garnu."
      }
    });
  } else if (profile.lifestyle.diet === "home_cooked" || profile.lifestyle.diet === "mostly_dal_bhat") {
    tips.push({
      category: "food",
      text: {
        en: "Dal bhat is a strong base. Add protein, saag + lemon, dahi, and seasonal fruit for glow support.",
        ne: "Dal bhat ramro base ho. Protein, saag + lemon, dahi ra seasonal fruit thapda glow support huncha."
      }
    });
  }
  if (profile.lifestyle.diet === "vegetarian") {
    tips.push({
      category: "vegetarian",
      text: {
        en: "Vegetarian routine can work well; watch protein, iron, zinc, and B12-style support without fear.",
        ne: "Vegetarian routine ramro huncha; protein, iron, zinc ra B12-style support calmly hernu."
      }
    });
  }
  if (profile.lifestyle.screen_time_hours === "more_than_6") {
    tips.push({
      category: "screen",
      text: {
        en: "High screen time can push late sleep and phone-touch breakouts. Wipe phone and protect bedtime.",
        ne: "High screen time le late sleep ra phone-touch breakouts badhauna sakcha. Phone wipe ra bedtime protect garnu."
      }
    });
  }
  if (location === "terai") {
    tips.push({ category: "terai", text: { en: "For Terai heat, think sweat control and light layers, not harsh scrubbing.", ne: "Terai heat ma sweat control ra light layers sochnu, harsh scrub haina." } });
    tips.push({ category: "fungal", text: { en: "Terai heat plus humidity can trigger itchy same-size fungal bumps on forehead, chest, back, or neck folds. Keep cotton clothes and dry towels.", ne: "Terai heat ra humidity le forehead/chest/back/neck folds ma itchy same-size fungal bumps aauna sakcha. Cotton clothes ra dry towel rakhnu." } });
  } else if (location === "mountain" || location === "hilly") {
    tips.push({ category: "barrier", text: { en: "For hills and mountains, barrier repair matters because wind and dry air pull water from skin.", ne: "Hills/mountain ma wind ra dry air le skin dry banauchha, barrier repair important." } });
    tips.push({ category: "wind", text: { en: "Cold wind can cause tight cheeks, flaky lips, and nose-corner irritation. Lukewarm water and damp-skin moisturizer help.", ne: "Cold wind le cheeks tight, lips flaky, nose-corner irritation garna sakcha. Lukewarm water ra damp-skin moisturizer help." } });
  } else if (location === "kathmandu_valley") {
    tips.push({ category: "pollution", text: { en: "Kathmandu dust and PM2.5 can sit in pores by evening. Mask outdoors when needed and double cleanse after dusty commutes.", ne: "Kathmandu dust/PM2.5 beluka pores ma basna sakcha. Bahira mask ra dusty commute pachi double cleanse." } });
    tips.push({ category: "water", text: { en: "If Kathmandu tap water makes skin tight, use micellar first cleanse, gentle face wash, and filtered final rinse when possible.", ne: "Kathmandu tap water le skin tight bhaye micellar first cleanse, gentle face wash, possible bhaye filtered final rinse." } });
  }
  return tips;
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
  if (profile.lifestyle.stress_level === "high") {
    tips.push({ id: "stress-reset", tag: "stress", text: { en: "Stress high today? Five slow breaths before sleep counts as skin care.", ne: "aaja stress high? sutnu aghi five slow breaths pani skincare nai ho." } });
  }
  if (profile.lifestyle.exercise === "none") {
    tips.push({ id: "movement", tag: "movement", text: { en: "No exercise? 15 minutes walk, dance, stairs, or chores can support glow.", ne: "exercise chaina? 15 min walk, dance, stairs wa kaam le glow support garna sakcha." } });
  }
  if (profile.lifestyle.junk_food_frequency === "high" || profile.lifestyle.junk_food_frequency === "very_high") {
    tips.push({ id: "junk-swap", tag: "food", text: { en: "High junk food week? Reduce cold drinks or maida first, not everything at once.", ne: "junk food high? sabai ekai choti haina, pahile cold drinks wa maida kam garnu." } });
  }
  const cycleTips = buildCycleMicroTips(profile);
  tips.push(...cycleTips);
  if (profile.lifestyle.screen_time_hours === "more_than_6") {
    tips.push({ id: "phone-clean", tag: "screen", text: { en: "Wipe your phone tonight; cheek acne can be phone-touch related.", ne: "aaja phone wipe garnu; cheek acne phone-touch related huna sakcha." } });
  }
  tips.push({ id: waterTip.id, tag: "water", text: { en: waterTip.tips.en[0], ne: waterTip.tips.ne[0] } });

  return tips.length > 0 ? tips : [{ id: waterTip.id, tag: "water", text: { en: waterTip.tips.en[0], ne: waterTip.tips.ne[0] } }];
}

function buildCycleMicroTips(profile: QuizProfile): DailyMicroTip[] {
  const cycle = profile.cycle;
  if (!cycle || cycle.periodTiming === "not_applicable" || cycle.periodTiming === "prefer_not_to_say") return [];
  const tips: DailyMicroTip[] = [];
  if (cycle.cycleBreakouts === "moderate" || cycle.cycleBreakouts === "severe" || cycle.painfulDeepAcne === "yes" || cycle.painfulDeepAcne === "sometimes") {
    tips.push({
      id: "cycle-breakout-gentle",
      tag: "cycle",
      text: {
        en: "Period-linked breakout? Keep cleanser gentle, do not scrub or pick, and use spot care only on active pimples.",
        ne: "period sanga pimple badhcha? cleanser gentle rakhnu, scrub/pick nagarnu, active pimple ma matra spot care."
      }
    });
  }
  if (cycle.cycleSkinChange === "oilier") {
    tips.push({ id: "cycle-oil", tag: "cycle", text: { en: "Oilier around your period? Keep moisturizer light, cleanse gently twice, and avoid adding many new products.", ne: "period tira oily huncha? light moisturizer, gentle cleanse twice, dherai naya product nathapnu." } });
  }
  if (cycle.cycleSkinChange === "drier" || cycle.cycleSkinChange === "sensitive") {
    tips.push({ id: "cycle-barrier", tag: "cycle", text: { en: "Sensitive or dry this cycle? Pause harsh actives and protect the barrier with moisturizer and SPF.", ne: "cycle ma sensitive/dry? harsh actives roknu, moisturizer ra SPF le barrier protect garnu." } });
  }
  if (cycle.periodsRegular === "irregular" && (cycle.cycleBreakouts === "severe" || cycle.painfulDeepAcne === "yes")) {
    tips.push({ id: "cycle-doctor", tag: "safety", text: { en: "Irregular periods plus painful deep acne deserves clinician advice. The app can guide habits, not diagnose hormones.", ne: "irregular period ra painful deep acne bhaye clinician sanga kura garnu. App le habit guide garcha, hormone diagnose gardaina." } });
  }
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

export function contextualConditionDescription(condition: KnowledgeCondition, profile: QuizProfile, language: Language) {
  const base = localized(language, condition.description_en, condition.description_ne);
  const location = profile.environment.location_type;
  if (language === "ne") return base;
  if (location === "kathmandu_valley") return explainHardTerms(base);

  const locationCause =
    location === "terai"
      ? "Terai heat, sweat, humidity, dust, and hard or well water can irritate skin and clog pores."
      : location === "mountain"
        ? "Mountain cold, wind, strong UV, and dry air can weaken the skin barrier and make marks look worse."
        : "Hilly sun, wind, dust, changing weather, and water quality can stress the skin barrier.";

  return explainHardTerms(
    base
      .replace(/Kathmandu's PM2\.5 pollution[^,.]*(?:[,.])/gi, `${locationCause} `)
      .replace(/Kathmandu pollution[^,.]*(?:[,.])/gi, `${locationCause} `)
      .replace(/Kathmandu's PM2\.5 creates a visible film of particles on skin by end of day[^,.]*(?:[,.])/gi, `${locationCause} `)
      .replace(/Specific to people living in Kathmandu and other polluted valleys\./gi, "Can happen in Nepal when local weather, dust, water, and lifestyle triggers stack up.")
  );
}

function explainHardTerms(text: string) {
  return text
    .replace(/\bmelasma\b/gi, "melasma (gaala/upper lip tira aaune brown patch problem)")
    .replace(/\bPIH\b/g, "PIH (pimple pachi basne daag)")
    .replace(/\bPM2\.5\b/g, "PM2.5 (sano dhulo/pollution particle)");
}

function sanitizeTextForProfile(text: string, profile: QuizProfile) {
  if (profile.environment.location_type === "kathmandu_valley") return explainHardTerms(text);
  const locationCause =
    profile.environment.location_type === "terai"
      ? "Terai heat, sweat, humidity, dust, and water quality"
      : profile.environment.location_type === "mountain"
        ? "Mountain cold, wind, dry air, strong UV, and water quality"
        : "Hilly sun, wind, dust, changing weather, and water quality";
  return explainHardTerms(
    text
      .replace(/Kathmandu's PM2\.5/gi, locationCause)
      .replace(/Kathmandu pollution/gi, locationCause)
      .replace(/Kathmandu AQI/gi, "local AQI")
      .replace(/one night of sleeping with Kathmandu pollution on your face/gi, "one night of sleeping with dust, sweat, sunscreen, or pollution on your face")
  );
}
