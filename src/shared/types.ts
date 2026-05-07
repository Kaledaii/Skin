export type Language = "en" | "ne";
export type ThemeMode = "light" | "dark";
export type SubscriptionTier = "free" | "premium";
export type SkinType = "oily" | "dry" | "combination" | "sensitive";
export type Gender = "female" | "male" | "nonbinary" | "preferNot";
export type BudgetTier = "under200" | "200to500" | "500plus";
export type SeasonMode = "summer" | "monsoon" | "dashain" | "winter";

export type QuizProfile = import("./knowledge/types").QuizProfile;

export type UserProfile = {
  name: string;
  age: string;
  gender: Gender;
  skinType: SkinType;
  location: string;
  sleepHours: string;
  dietHabit: string;
  stressLevel: string;
  budgetTier: BudgetTier;
  symptoms: string[];
  quiz: QuizProfile;
  selfieUri?: string;
  consentAccepted: boolean;
};

export type RoutineStep = {
  id: string;
  title: Record<Language, string>;
  description: Record<Language, string>;
  reason: Record<Language, string>;
  premiumOnly?: boolean;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  budgetTier: BudgetTier;
  fit: SkinType[];
  ingredientLabel: Record<Language, string>;
  trustScore: number;
  sponsored: boolean;
  affiliateUrl: string;
};

export type Tip = {
  id: string;
  title: Record<Language, string>;
  body: Record<Language, string>;
  season: SeasonMode;
  duration: string;
};

export type RoutineLog = {
  date: string;
  morning: boolean;
  evening: boolean;
  hydration: number;
  sleep: number;
};

export type DailyCheckIn = {
  date: string;
  completedStepIds: string[];
  water: "less_than_1" | "1_to_2" | "more_than_2";
  sleep: "less_than_5" | "5_to_6" | "6_to_8" | "more_than_8";
  sunscreen: boolean;
  makeupRemoved: boolean;
  smoked: boolean;
  alcohol: boolean;
  moodNote?: string;
  skinNote?: string;
  selfieUri?: string;
};

export type CommunityQuestion = {
  id: string;
  title: Record<Language, string>;
  answer: Record<Language, string>;
  verified: boolean;
};
