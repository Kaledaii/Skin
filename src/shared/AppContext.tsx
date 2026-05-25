import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { getDefaultQuizProfile } from "./knowledge/engine";
import { activateSubscriptionFromRequest, createManualPaymentRequest, isSubscriptionActive, PaymentSubmissionResult } from "./services/payment";
import {
  AuthResult,
  deleteCloudSnapshot,
  ensureAnonymousUser,
  listPaymentRequests,
  loadRemoteCheckIns,
  loadRemoteProfile,
  loadRemoteSubscription,
  savePaymentRequest,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  syncUserSnapshot,
  updatePaymentRequest,
  updateUserSubscriptionForPayment,
  uploadPaymentScreenshot
} from "./services/firebaseSync";
import { BudgetTier, DailyCheckIn, Language, NotificationPreferences, PaymentProvider, PaymentRequest, PaymentState, SkinType, SubscriptionInfo, SubscriptionPlanId, SubscriptionTier, ThemeMode, UserProfile } from "./types";

type AppState = {
  language: Language;
  setLanguage: (value: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
  tier: SubscriptionTier;
  setTier: (value: SubscriptionTier) => void;
  subscription: SubscriptionInfo;
  paymentState: PaymentState;
  activatePremium: (source?: SubscriptionInfo["source"], plan?: SubscriptionInfo["plan"]) => void;
  submitManualPayment: (input: { provider: PaymentProvider; plan: Exclude<SubscriptionPlanId, "beta">; transactionId: string; payerName: string; payerPhone: string; screenshotUri: string }) => Promise<PaymentSubmissionResult>;
  approvePaymentRequest: (id: string, note?: string) => Promise<string>;
  rejectPaymentRequest: (id: string, note: string) => Promise<string>;
  refreshPaymentRequests: (status?: PaymentRequest["status"] | "all") => Promise<void>;
  paymentRequests: PaymentRequest[];
  pickPaymentScreenshot: () => Promise<string | undefined>;
  loadSubscription: () => Promise<void>;
  signInAnonymously: () => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateQuiz: (section: "lifestyle" | "environment" | "currentRoutine", key: string, value: string) => void;
  toggleQuizArray: (key: "symptoms" | "primaryConcerns", value: string) => void;
  completion: Record<string, boolean>;
  toggleCompletion: (id: string) => void;
  likedTipIds: string[];
  savedTipIds: string[];
  savedProductIds: string[];
  dailyCheckIns: Record<string, DailyCheckIn>;
  todayCheckIn: DailyCheckIn;
  updateTodayCheckIn: (patch: Partial<DailyCheckIn>) => void;
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (patch: Partial<NotificationPreferences>) => void;
  toggleLikedTip: (id: string) => void;
  toggleSavedTip: (id: string) => void;
  toggleSavedProduct: (id: string) => void;
  pickSelfie: () => Promise<void>;
  exportData: () => string;
  deleteCloudData: () => Promise<string>;
  resetData: () => Promise<void>;
};

const defaultProfile: UserProfile = {
  name: "",  // Will be set by user in onboarding
  age: "",
  gender: "female",
  skinType: "combination",
  location: "",
  sleepHours: "6",
  dietHabit: "",
  stressLevel: "medium",
  budgetTier: "200to500",
  symptoms: [],
  quiz: getDefaultQuizProfile(),
  consentAccepted: false
};

export const defaultNotificationPreferences: NotificationPreferences = {
  routineReminders: true,
  weatherAlerts: true,
  completionPraise: true,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00"
};

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>("en");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [tier, setTierState] = useState<SubscriptionTier>("free");
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ status: "free", tier: "free", source: "demo" });
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [likedTipIds, setLikedTipIds] = useState<string[]>([]);
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<Record<string, DailyCheckIn>>({});
  const [today, setToday] = useState(getTodayKey);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const todayCheckIn = dailyCheckIns[today] ?? createDefaultCheckIn(today, profile);

  useEffect(() => {
    // Load from local storage first (cached data)
    AsyncStorage.getItem("skin-nepal-state").then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Pick<AppState, "language" | "themeMode" | "tier" | "profile" | "completion" | "subscription">>;
      if (parsed.language) setLanguageState(parsed.language);
      if (parsed.themeMode) setThemeModeState(parsed.themeMode);
      if (parsed.tier) setTierState(parsed.tier);
      if (parsed.subscription) setSubscription(parsed.subscription);
      if (parsed.profile) {
        const nextProfile = { ...defaultProfile, ...parsed.profile };
        // Skip legacy seed logic since defaultProfile no longer has "Asha"
        setProfile(nextProfile);
      }
      if (parsed.completion) setCompletion(parsed.completion);
      const parsedState = JSON.parse(raw) as { likedTipIds?: string[]; savedTipIds?: string[]; savedProductIds?: string[]; notificationPreferences?: NotificationPreferences };
      if (parsedState.likedTipIds) setLikedTipIds(parsedState.likedTipIds);
      if (parsedState.savedTipIds) setSavedTipIds(parsedState.savedTipIds);
      if (parsedState.savedProductIds) setSavedProductIds(parsedState.savedProductIds);
      if (parsedState.notificationPreferences) setNotificationPreferences({ ...defaultNotificationPreferences, ...parsedState.notificationPreferences });
      const checkInState = JSON.parse(raw) as { dailyCheckIns?: Record<string, DailyCheckIn> };
      if (checkInState.dailyCheckIns) setDailyCheckIns(checkInState.dailyCheckIns);
      const paymentState = JSON.parse(raw) as { paymentState?: PaymentState; paymentRequests?: PaymentRequest[] };
      if (paymentState.paymentState) setPaymentState(paymentState.paymentState);
      if (paymentState.paymentRequests) setPaymentRequests(paymentState.paymentRequests);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    // Save state to local storage (cache backup)
    AsyncStorage.setItem("skin-nepal-state", JSON.stringify({ language, themeMode, tier, subscription, paymentState, paymentRequests, profile, completion, likedTipIds, savedTipIds, savedProductIds, dailyCheckIns, notificationPreferences })).catch(() => undefined);
  }, [language, themeMode, tier, subscription, paymentState, paymentRequests, profile, completion, likedTipIds, savedTipIds, savedProductIds, dailyCheckIns, notificationPreferences]);

  useEffect(() => {
    const ensureToday = () => {
      const next = getTodayKey();
      setToday((current) => (current === next ? current : next));
    };
    ensureToday();
    const timer = setInterval(ensureToday, 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDailyCheckIns((current) => (current[today] ? current : { ...current, [today]: createDefaultCheckIn(today, profile) }));
  }, [profile, today]);

  useEffect(() => {
    // Initialize Firebase authentication and load remote data
    ensureAnonymousUser()
      .then(() => Promise.all([
        loadRemoteSubscription(),
        loadRemoteProfile(),
        loadRemoteCheckIns()
      ]))
      .then(([remoteSubscription, remoteProfile, remoteCheckIns]) => {
        // Load subscription if valid
        if (remoteSubscription && isSubscriptionActive(remoteSubscription)) {
          setSubscription(remoteSubscription);
          setTierState("premium");
          setPaymentState(remoteSubscription.paymentState ?? "active");
        }
        // Load profile if exists
        if (remoteProfile && remoteProfile.name) {
          setProfile(remoteProfile);
        }
        // Load check-ins if exist
        if (remoteCheckIns && Object.keys(remoteCheckIns).length > 0) {
          setDailyCheckIns(remoteCheckIns);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // Auto-sync profile changes to Firebase (5 second debounce to avoid too frequent saves)
    const timeout = setTimeout(() => {
      if (profile.name) {  // Only sync if profile has been filled
        syncUserSnapshot({
          profile,
          subscription,
          dailyCheckIns,
          paymentRequests
        }).catch(() => undefined);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [profile, subscription, dailyCheckIns, paymentRequests]);

  const value = useMemo<AppState>(() => ({
    language,
    setLanguage: setLanguageState,
    themeMode,
    setThemeMode: setThemeModeState,
    tier,
    setTier: (value) => {
      setTierState(value);
      setSubscription((current) => ({
        ...current,
        tier: value,
        status: value === "premium" ? "premium" : "free",
        source: value === "premium" ? current.source : "demo"
      }));
    },
    subscription,
    paymentState,
    activatePremium: (source = "beta", plan = "beta") => {
      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + 1);
      const nextSubscription: SubscriptionInfo = {
        status: "trial",
        tier: "premium",
        source: source === "beta" ? "admin_beta" : source,
        plan: plan ?? "beta",
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        providerTransactionId: `admin-${now.getTime()}`,
        paymentState: "active"
      };
      setTierState("premium");
      setPaymentState("active");
      setSubscription(nextSubscription);
    },
    submitManualPayment: async (input) => {
      setPaymentState("pending");
      const draftId = `pay_${input.provider}_${Date.now()}`;
      let screenshotDownloadUrl: string | undefined;
      try {
        screenshotDownloadUrl = await uploadPaymentScreenshot(input.screenshotUri, draftId);
      } catch {
        screenshotDownloadUrl = undefined;
      }
      const result = createManualPaymentRequest({
        ...input,
        userId: "local-demo-user",
        userEmail: null,
        profileName: profile.name,
        profileLocation: profile.location,
        profileSkinType: profile.skinType,
        screenshotDownloadUrl
      });
      if (!result.ok || !result.request) {
        setPaymentState("failed");
        return result;
      }
      const request = { ...result.request, id: draftId };
      const saved = await savePaymentRequest(request);
      const savedRequest = saved.ok && saved.request ? saved.request : request;
      setPaymentRequests((current) => [savedRequest, ...current.filter((item) => item.id !== savedRequest.id)]);
      setPaymentState("pending_review");
      await syncUserSnapshot({ profile, subscription: { ...subscription, paymentState: "pending_review" }, dailyCheckIns, paymentRequests: [savedRequest, ...paymentRequests] });
      return { ...result, request: savedRequest };
    },
    approvePaymentRequest: async (id, note = "Approved") => {
      const request = paymentRequests.find((item) => item.id === id);
      if (!request) return "Payment request not found.";
      const reviewed: PaymentRequest = { ...request, status: "approved", reviewedAt: new Date().toISOString(), reviewNote: note };
      const nextSubscription = activateSubscriptionFromRequest(reviewed);
      await updatePaymentRequest(reviewed);
      await updateUserSubscriptionForPayment(reviewed, nextSubscription);
      setPaymentRequests((current) => current.map((item) => item.id === id ? reviewed : item));
      if (reviewed.userId === "local-demo-user") {
        setSubscription(nextSubscription);
        setTierState("premium");
        setPaymentState("active");
      }
      return "Payment approved and premium activated.";
    },
    rejectPaymentRequest: async (id, note) => {
      const request = paymentRequests.find((item) => item.id === id);
      if (!request) return "Payment request not found.";
      const reviewed: PaymentRequest = { ...request, status: "rejected", reviewedAt: new Date().toISOString(), reviewNote: note || "Rejected" };
      await updatePaymentRequest(reviewed);
      setPaymentRequests((current) => current.map((item) => item.id === id ? reviewed : item));
      if (reviewed.userId === "local-demo-user") setPaymentState("rejected");
      return "Payment request rejected.";
    },
    refreshPaymentRequests: async (status = "pending_review") => {
      const result = await listPaymentRequests(status === "all" ? undefined : status);
      if (result.ok) setPaymentRequests(result.requests);
    },
    paymentRequests,
    pickPaymentScreenshot: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
      return result.canceled ? undefined : result.assets[0]?.uri;
    },
    loadSubscription: async () => {
      const remote = await loadRemoteSubscription();
      if (remote && isSubscriptionActive(remote)) {
        setSubscription(remote);
        setTierState("premium");
        setPaymentState(remote.paymentState ?? "active");
      } else if (subscription.expiresAt && new Date(subscription.expiresAt).getTime() <= Date.now()) {
        setSubscription((current) => ({ ...current, status: "expired", tier: "free", paymentState: "expired" }));
        setTierState("free");
        setPaymentState("expired");
      }
    },
    signInAnonymously: ensureAnonymousUser,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    profile,
    updateProfile: (patch) => setProfile((current) => ({ ...current, ...patch })),
    updateQuiz: (section, key, optionValue) => setProfile((current) => ({
      ...current,
      quiz: {
        ...current.quiz,
        [section]: {
          ...current.quiz[section],
          [key]: optionValue
        }
      }
    })),
    toggleQuizArray: (key, optionValue) => setProfile((current) => {
      const values = current.quiz[key];
      const nextValues = values.includes(optionValue) ? values.filter((item) => item !== optionValue) : [...values, optionValue];
      return {
        ...current,
        symptoms: key === "symptoms" ? nextValues : current.symptoms,
        quiz: {
          ...current.quiz,
          [key]: nextValues
        }
      };
    }),
    completion,
    toggleCompletion: (id) => setDailyCheckIns((current) => {
      const checkIn = current[today] ?? createDefaultCheckIn(today, profile);
      const existing = checkIn.completedStepIds ?? [];
      const completedStepIds = existing.includes(id) ? existing.filter((item) => item !== id) : [...existing, id];
      return { ...current, [today]: { ...checkIn, completedStepIds, date: today } };
    }),
    likedTipIds,
    savedTipIds,
    savedProductIds,
    dailyCheckIns,
    todayCheckIn,
    updateTodayCheckIn: (patch) => setDailyCheckIns((current) => ({
      ...current,
      [today]: { ...(current[today] ?? createDefaultCheckIn(today, profile)), ...patch, date: today }
    })),
    notificationPreferences,
    updateNotificationPreferences: (patch) => setNotificationPreferences((current) => ({ ...current, ...patch })),
    toggleLikedTip: (id) => setLikedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    toggleSavedTip: (id) => setSavedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    toggleSavedProduct: (id) => setSavedProductIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    pickSelfie: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
      if (!result.canceled) setProfile((current) => ({ ...current, selfieUri: result.assets[0]?.uri }));
    },
    exportData: () => JSON.stringify({ language, themeMode, tier, subscription, paymentState, paymentRequests, profile, completion, likedTipIds, savedTipIds, savedProductIds, dailyCheckIns, notificationPreferences }, null, 2),
    deleteCloudData: async () => {
      const result = await deleteCloudSnapshot();
      return result.ok ? "Cloud data delete request completed." : "Cloud delete is unavailable in local demo mode.";
    },
    resetData: async () => {
      await AsyncStorage.removeItem("skin-nepal-state");
      setLanguageState("en");
      setThemeModeState("light");
      setTierState("free");
      setSubscription({ status: "free", tier: "free", source: "demo" });
      setPaymentState("idle");
      setPaymentRequests([]);
      setProfile(defaultProfile);
      setCompletion({});
      setLikedTipIds([]);
      setSavedTipIds([]);
      setSavedProductIds([]);
      setDailyCheckIns({});
      setToday(getTodayKey());
      setNotificationPreferences(defaultNotificationPreferences);
    }
  }), [completion, language, profile, themeMode, tier, subscription, paymentState, paymentRequests, likedTipIds, savedTipIds, savedProductIds, dailyCheckIns, notificationPreferences, today, todayCheckIn]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

export const skinTypes: SkinType[] = ["oily", "dry", "combination", "sensitive"];
export const budgetTiers: BudgetTier[] = ["under200", "200to500", "500plus"];

function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDefaultCheckIn(date: string, profile: UserProfile): DailyCheckIn {
  return {
    date,
    completedStepIds: [],
    water: (profile.quiz.lifestyle.water_intake_liters as DailyCheckIn["water"]) ?? "1_to_2",
    sleep: (profile.quiz.lifestyle.sleep_hours as DailyCheckIn["sleep"]) ?? "6_to_8",
    stressToday: (profile.quiz.lifestyle.stress_level as DailyCheckIn["stressToday"]) ?? "moderate",
    screenTimeToday: (profile.quiz.lifestyle.screen_time_hours as DailyCheckIn["screenTimeToday"]) ?? "3_to_6",
    movementToday: (profile.quiz.lifestyle.exercise as DailyCheckIn["movementToday"]) ?? "occasional",
    sunscreen: profile.quiz.currentRoutine.uses_sunscreen === "yes",
    makeupRemoved: profile.quiz.currentRoutine.removes_makeup_before_bed === "yes",
    smoked: false,
    alcohol: false,
    weatherActionIds: [],
    selfieUri: profile.selfieUri
  };
}
