import { SubscriptionTier } from "./types";

export const premiumPlans = {
  monthly: { id: "monthly", label: "Monthly", price: "Rs. 199", amount: 199, note: "Best for trying the full skin companion." },
  yearly: { id: "yearly", label: "Yearly", price: "Rs. 1999", amount: 1999, note: "2 months free for serious progress tracking." },
  beta: { id: "beta", label: "Beta launch", price: "Rs. 99", amount: 99, note: "First month launch offer for early users." }
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
