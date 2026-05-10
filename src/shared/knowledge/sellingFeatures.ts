import { Product, UserProfile } from "../types";

export const premiumModes = [
  mode("exam", "Exam Mode", "3-minute routine, stress breakouts, late-night sleep rescue, phone hygiene.", "Morning SPF, night cleanse, phone wipe, one glass water before chiya, and 5-minute sleep reset.", "Best for exam weeks, office deadlines, or high screen-time days.", "Your premium plan keeps this short and adjusts the night routine around sleep, stress, screen time, and active pimples.", [
    ["Tonight plan", "Cleanse, moisturize, spot treat only active pimples, then phone away 20 minutes before sleep."],
    ["Trigger watch", "Low sleep + stress + chips/sweet drinks can push oiliness and picking."],
    ["Tiny habit", "One water bottle on desk and one phone wipe before long study sessions."],
    ["Avoid", "Do not try a new serum the night before exam or presentation day."]
  ]),
  mode("festival", "Festival Mode", "Dashain/Tihar food, makeup, travel dust, late nights, and 3-day recovery.", "Double cleanse after makeup, hydrate after salty/fried food, and avoid new actives before photos.", "Use before and after Dashain, Tihar, weddings, parties, and travel.", "Your premium plan adds a before-event checklist, makeup removal priority, and a 3-day recovery reset after fried food or late nights.", [
    ["Before photos", "Keep routine boring: moisturizer, SPF, makeup you already trust."],
    ["After makeup", "First cleanse makeup/SPF, second cleanse skin, then moisturize."],
    ["Food reset", "Next day: dal, saag, dahi, fruit, and extra water. No panic detox needed."],
    ["Avoid", "No harsh scrub after heavy makeup or Holi colors."]
  ]),
  mode("monsoon", "Monsoon Mode", "Humidity, fungal bumps, sweat rinse, dry towels, light moisturizer.", "Light gel moisturizer, sweat rinse, dry towel habit, and itchy bump watchlist.", "Unlock premium to adapt this by Terai humidity and current weather.", "Your premium plan adapts this by today's humidity, rain chance, sweat level, and Terai/Kathmandu/hilly location signals.", [
    ["Today plan", "Use light moisturizer, SPF, and rinse sweat after commute or workout."],
    ["Weather logic", "If rain chance is high, carry umbrella and keep towel/pillowcase dry."],
    ["Bump watch", "Tiny same-size itchy bumps can be sweat/yeast-triggered; avoid heavy oils."],
    ["Budget pick", "Prioritize gentle cleanser + light gel moisturizer before serums."]
  ]),
  mode("winter", "Winter Barrier Mode", "Cold wind, dry cheeks, lip balm, lukewarm water, richer moisturizer.", "Gentle cleanse, damp-skin moisturizer, lip balm, and wind barrier care.", "Unlock premium to shift richer creams by hills, mountain, or Kathmandu winter.", "Your premium plan shifts moisturizer weight, lip care, and wind-barrier steps based on hills, mountain dryness, or Kathmandu winter dust.", [
    ["Morning plan", "Lukewarm rinse, moisturizer on damp skin, SPF, lip balm."],
    ["Night repair", "Gentle cleanse, richer moisturizer on cheeks, lip balm before sleep."],
    ["Location logic", "Mountain/hilly users need more wind barrier; Kathmandu users still need dust cleanse."],
    ["Avoid", "Hot water and harsh exfoliation when skin feels tight."]
  ]),
  mode("event", "Wedding/Event Prep Mode", "7-day glow plan, no risky new actives, emergency pimple care.", "No new actives, steady SPF, gentle exfoliation timing, and pimple calm steps.", "Unlock premium to turn this into a 7-day countdown.", "Your premium plan gives a 7-day countdown: what to use, what not to try, emergency pimple care, and makeup-removal safety.", [
    ["7 days before", "Stop experimenting. Keep cleanser, moisturizer, SPF steady."],
    ["2 days before", "Hydrate, sleep, no new facial, no strong peel."],
    ["Event day", "Ice active pimple briefly, use pimple patch if possible, makeup gently."],
    ["After event", "Remove makeup fully before sleep, then barrier repair."]
  ]),
  mode("hostel", "Hostel Routine Mode", "Low-space, low-budget, shared bathroom, pillowcase/towel hygiene.", "Micellar backup, quick cleanser, pillowcase flip, towel drying, and under-budget basics.", "Unlock premium to build hostel-safe routine baskets.", "Your premium plan builds a hostel-safe basket with low-space products, towel hygiene, shared-bathroom timing, and budget alternatives.", [
    ["3-step basket", "Cleanser, moisturizer, sunscreen. Add micellar water if makeup/SPF is heavy."],
    ["Hygiene", "Dry towel fully, do not share face towel, flip pillowcase mid-week."],
    ["Busy day backup", "Micellar water + moisturizer is better than sleeping with makeup/SPF."],
    ["Budget", "Buy one good basic at a time instead of many small random items."]
  ]),
  mode("budget", "Low Budget Mode", "Under Rs. 500/1000/2000 routines using local basics first.", "Cleanser + moisturizer + SPF first, then one treatment only if needed.", "Unlock premium to compare Daraz/pharmacy alternatives by budget.", "Your premium plan compares under Rs. 500/1000/2000 routines, safer pharmacy options, and fake-product risk before buying.", [
    ["Under Rs. 500", "Gentle cleanser + basic moisturizer first. Use umbrella/hat if sunscreen budget is tight for a few days."],
    ["Under Rs. 1000", "Add daily sunscreen. Skip serum until basics are consistent."],
    ["Under Rs. 2000", "Add one concern treatment only: acne, marks, or barrier. Not all at once."],
    ["Fake warning", "Avoid too-cheap online deals. Check expiry, seller, batch, and seal."]
  ])
];

function mode(
  id: string,
  title: string,
  body: string,
  preview: string,
  action: string,
  unlockedAction: string,
  premiumSections: Array<[string, string]>
) {
  return { id, title, body, preview, action, unlockedAction, premiumSections: premiumSections.map(([title, body]) => ({ title, body })) };
}

export function buildSkinTwin(profile: UserProfile) {
  const location = profile.quiz.environment.location_type;
  const makeup = profile.quiz.currentRoutine.uses_makeup_daily !== "no" ? "makeup users" : "low-makeup users";
  const stress = profile.quiz.lifestyle.stress_level === "high" ? "high-stress weeks" : "normal-stress weeks";
  return `Girls with ${profile.skinType} skin in ${location} who are ${makeup} often need ${focusForLocation(location)}, plus ${stress === "high-stress weeks" ? "a shorter night routine and sleep reset" : "consistent SPF and evening cleanse"}.`;
}

export function buildBudgetRoutine(profile: UserProfile, products: Product[]) {
  const target =
    profile.budgetTier === "under200"
      ? { label: "Under Rs. 500", max: 500 }
      : profile.budgetTier === "200to500"
        ? { label: "Under Rs. 1000", max: 1000 }
        : { label: "Under Rs. 2000", max: 2000 };
  const picks = products
    .filter((product) => product.fit.includes(profile.skinType) && (product.priceMin ?? 9999) <= target.max)
    .slice(0, 4);
  return {
    label: target.label,
    picks,
    note: picks.length >= 3 ? "Cleanser + moisturizer + SPF first. Serums come after consistency." : "Use pharmacy/local alternatives in the same category before buying expensive serums."
  };
}

export function checkIngredient(text: string) {
  const value = text.toLowerCase();
  if (!value.trim()) return "Type an ingredient or product claim to get a simple safety note. No button needed.";
  if (value.includes("lemon") || value.includes("toothpaste")) return "Avoid: do not use on face. It can burn, irritate, and leave darker marks, especially in sun.";
  if (value.includes("baking soda")) return "Avoid: too alkaline for facial skin and can damage the skin barrier.";
  if (value.includes("niacinamide")) return "Good: beginner-friendly for oil control, barrier support, redness, and dark marks. Start once daily.";
  if (value.includes("retinol")) return "Careful: useful but start slowly at night only. Avoid during pregnancy unless a doctor says okay. SPF is mandatory.";
  if (value.includes("salicylic") || value.includes("bha")) return "Good for oily pores, blackheads, and acne. Start 2-3 nights weekly to avoid dryness.";
  if (value.includes("fragrance") || value.includes("perfume")) return "Caution: can irritate sensitive or pigmentation-prone skin. Patch test carefully.";
  if (value.includes("spf") || value.includes("sunscreen")) return "Good: for Nepal, SPF 30+ daily is minimum; SPF 50 PA+++ is better for marks and melasma.";
  if (value.includes("vitamin c")) return "Good for glow and pollution support, but start low if sensitive and always use sunscreen.";
  return "Unknown ingredient: patch test first, check expiry/batch, and stop if burning, swelling, or new bumps appear.";
}

function focusForLocation(location: string) {
  if (location === "terai") return "sweat rinse, light moisturizer, and fungal-bump prevention";
  if (location === "kathmandu_valley") return "dust/AQI cleansing, antioxidant support, and SPF";
  if (location === "mountain" || location === "hilly") return "barrier repair, lip care, and high-UV protection";
  return "routine consistency and weather-aware care";
}
