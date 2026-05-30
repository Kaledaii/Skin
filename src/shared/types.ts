export type Language = "en" | "ne";
export type ThemeMode = "light" | "dark";
export type SubscriptionTier = "free" | "premium";
export type SubscriptionStatus = "free" | "trial" | "premium" | "expired";
export type SubscriptionSource = "manual" | "manual_esewa" | "manual_khalti" | "admin_beta" | "beta" | "esewa" | "khalti" | "stripe" | "demo";
export type PaymentProvider = "khalti" | "esewa";
export type SubscriptionPlanId = "monthly" | "yearly" | "beta";
export type PaymentState = "idle" | "pending" | "pending_review" | "verifying" | "active" | "failed" | "rejected" | "expired";
export type PaymentRequestStatus = "pending_review" | "approved" | "rejected";
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

export type SubscriptionInfo = {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  source: SubscriptionSource;
  startedAt?: string;
  expiresAt?: string;
  plan?: SubscriptionPlanId;
  providerTransactionId?: string;
  paymentState?: PaymentState;
  lastPaymentError?: string;
  paymentRequestId?: string;
};

export type PaymentRequest = {
  id: string;
  userId: string;
  userEmail?: string | null;
  profileName?: string;
  profileLocation?: string;
  profileSkinType?: SkinType;
  provider: PaymentProvider;
  plan: Exclude<SubscriptionPlanId, "beta">;
  amount: number;
  transactionId: string;
  payerName: string;
  payerPhone: string;
  screenshotUri: string;
  screenshotDownloadUrl?: string;
  status: PaymentRequestStatus;
  cloudSyncStatus?: "synced" | "local_only";
  cloudSyncError?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
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
  priceMin?: number;
  priceMax?: number;
  budgetTier: BudgetTier;
  fit: SkinType[];
  concernFit?: string[];
  ingredients?: string[];
  whereToBuy?: string[];
  localAvailability?: boolean;
  fakeRisk?: "low" | "medium" | "high";
  whyMatched?: Record<Language, string>;
  whyNot?: Record<Language, string>;
  budgetAlternative?: string;
  safetyNote?: Record<Language, string>;
  ingredientLabel: Record<Language, string>;
  trustScore: number;
  sponsored: boolean;
  affiliateUrl: string;
  imageUrl?: string;
  imageSourceKey?: string;
  visualCategory?: string;
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
  stressToday?: "low" | "moderate" | "high";
  screenTimeToday?: "less_than_3" | "3_to_6" | "more_than_6";
  movementToday?: "none" | "occasional" | "regular";
  sunscreen: boolean;
  makeupRemoved: boolean;
  smoked: boolean;
  alcohol: boolean;
  weatherActionIds?: string[];
  moodNote?: string;
  skinNote?: string;
  selfieUri?: string;
};

export type NotificationPreferences = {
  routineReminders: boolean;
  weatherAlerts: boolean;
  completionPraise: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type ScheduledNotificationRecord = {
  id: string;
  date: string;
  kind: "routine_morning" | "routine_evening" | "incomplete_steps" | "completion_praise" | "weather_alert";
  notificationId: string;
  createdAt: string;
};

export type CommunityQuestion = {
  id: string;
  title: Record<Language, string>;
  answer: Record<Language, string>;
  verified: boolean;
};
