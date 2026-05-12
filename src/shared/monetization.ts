import { SubscriptionTier } from "./types";

export const premiumPlans = {
  monthly: { id: "monthly", label: "Monthly", price: "Rs. 100", amount: 100, note: "Full Prabha premium for one month." },
  yearly: { id: "yearly", label: "Yearly", price: "Rs. 1000", amount: 1000, note: "Best value for year-round skin tracking." },
  beta: { id: "beta", label: "Admin beta", price: "Manual", amount: 0, note: "Developer/admin test unlock only." }
} as const;

export const premiumFeatures = [
  "Full personalized routine with lifestyle and weather inserts",
  "Skin Habit Score breakdown and weekly skin report",
  "Advanced product match reasons, alternatives, and fake-product warnings",
  "Festival, exam, monsoon, winter, event prep, hostel, and low-budget modes",
  "Full Learn guides and Q&A archive",
  "Progress photo timeline and next-week focus"
];

export function isPremium(tier: SubscriptionTier) {
  return tier === "premium";
}

export function premiumPreviewLabel(tier: SubscriptionTier) {
  return isPremium(tier) ? "Premium active" : "Premium preview";
}
