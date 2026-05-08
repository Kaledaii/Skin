import { Product, UserProfile } from "../types";

export const premiumModes = [
  { id: "exam", title: "Exam Mode", body: "3-minute routine, stress breakouts, late-night sleep rescue, phone hygiene." },
  { id: "festival", title: "Festival Mode", body: "Dashain/Tihar food, makeup, travel dust, late nights, and 3-day recovery." },
  { id: "monsoon", title: "Monsoon Mode", body: "Humidity, fungal bumps, sweat rinse, dry towels, light moisturizer." },
  { id: "winter", title: "Winter Barrier Mode", body: "Cold wind, dry cheeks, lip balm, lukewarm water, richer moisturizer." },
  { id: "event", title: "Wedding/Event Prep Mode", body: "7-day glow plan, no risky new actives, emergency pimple care." },
  { id: "hostel", title: "Hostel Routine Mode", body: "Low-space, low-budget, shared bathroom, pillowcase/towel hygiene." },
  { id: "budget", title: "Low Budget Mode", body: "Under Rs. 500/1000/2000 routines using local basics first." }
];

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
  if (!value.trim()) return "Type an ingredient or product claim to get a simple safety note.";
  if (value.includes("lemon") || value.includes("toothpaste")) return "Avoid on face. It can irritate and leave darker marks, especially in sun.";
  if (value.includes("niacinamide")) return "Good beginner ingredient for oil, barrier, redness, and dark marks. Start once daily.";
  if (value.includes("retinol")) return "Useful but slow-start only at night. Avoid if pregnant unless doctor says okay. SPF is mandatory.";
  if (value.includes("salicylic") || value.includes("bha")) return "Useful for oily pores, blackheads, and acne. Start 2-3 nights weekly to avoid dryness.";
  if (value.includes("fragrance") || value.includes("perfume")) return "Can irritate sensitive or pigmentation-prone skin. Patch test carefully.";
  if (value.includes("spf") || value.includes("sunscreen")) return "Good. For Nepal, SPF 30+ daily is minimum; SPF 50 PA+++ is better for marks/melasma.";
  return "Patch test first, check expiry/batch, and stop if burning, swelling, or new bumps appear.";
}

function focusForLocation(location: string) {
  if (location === "terai") return "sweat rinse, light moisturizer, and fungal-bump prevention";
  if (location === "kathmandu_valley") return "dust/AQI cleansing, antioxidant support, and SPF";
  if (location === "mountain" || location === "hilly") return "barrier repair, lip care, and high-UV protection";
  return "routine consistency and weather-aware care";
}
