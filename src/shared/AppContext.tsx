import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { getDefaultQuizProfile } from "./knowledge/engine";
import { BudgetTier, DailyCheckIn, Language, SkinType, SubscriptionInfo, SubscriptionTier, ThemeMode, UserProfile } from "./types";

type AppState = {
  language: Language;
  setLanguage: (value: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
  tier: SubscriptionTier;
  setTier: (value: SubscriptionTier) => void;
  subscription: SubscriptionInfo;
  activatePremium: (source?: SubscriptionInfo["source"], plan?: SubscriptionInfo["plan"]) => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateQuiz: (section: "lifestyle" | "environment" | "currentRoutine", key: string, value: string) => void;
  toggleQuizArray: (key: "symptoms" | "primaryConcerns", value: string) => void;
  completion: Record<string, boolean>;
  toggleCompletion: (id: string) => void;
  likedTipIds: string[];
  savedTipIds: string[];
  dailyCheckIns: Record<string, DailyCheckIn>;
  todayCheckIn: DailyCheckIn;
  updateTodayCheckIn: (patch: Partial<DailyCheckIn>) => void;
  toggleLikedTip: (id: string) => void;
  toggleSavedTip: (id: string) => void;
  pickSelfie: () => Promise<void>;
  resetData: () => Promise<void>;
};

const defaultProfile: UserProfile = {
  name: "Asha",
  age: "24",
  gender: "female",
  skinType: "combination",
  location: "Kathmandu",
  sleepHours: "6",
  dietHabit: "dal-bhat, curd, seasonal fruits",
  stressLevel: "medium",
  budgetTier: "200to500",
  symptoms: [],
  quiz: getDefaultQuizProfile(),
  consentAccepted: true
};

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>("en");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [tier, setTierState] = useState<SubscriptionTier>("free");
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ status: "free", tier: "free", source: "demo" });
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [likedTipIds, setLikedTipIds] = useState<string[]>([]);
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);
  const [dailyCheckIns, setDailyCheckIns] = useState<Record<string, DailyCheckIn>>({});
  const today = getTodayKey();
  const todayCheckIn = dailyCheckIns[today] ?? createDefaultCheckIn(today, profile);

  useEffect(() => {
    AsyncStorage.getItem("skin-nepal-state").then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Pick<AppState, "language" | "themeMode" | "tier" | "profile" | "completion" | "subscription">>;
      if (parsed.language) setLanguageState(parsed.language);
      if (parsed.themeMode) setThemeModeState(parsed.themeMode);
      if (parsed.tier) setTierState(parsed.tier);
      if (parsed.subscription) setSubscription(parsed.subscription);
      if (parsed.profile) {
        const nextProfile = { ...defaultProfile, ...parsed.profile };
        const legacySeed =
          nextProfile.name === "Asha" &&
          nextProfile.quiz?.symptoms?.includes("pimples_jawline") &&
          nextProfile.quiz?.symptoms?.includes("cysts_painful") &&
          nextProfile.quiz?.symptoms?.includes("shiny_tzone") &&
          (nextProfile.quiz?.primaryConcerns?.length ?? 0) === 0;
        setProfile(legacySeed ? { ...defaultProfile, ...parsed.profile, symptoms: [], quiz: getDefaultQuizProfile() } : nextProfile);
      }
      if (parsed.completion) setCompletion(parsed.completion);
      const parsedState = JSON.parse(raw) as { likedTipIds?: string[]; savedTipIds?: string[] };
      if (parsedState.likedTipIds) setLikedTipIds(parsedState.likedTipIds);
      if (parsedState.savedTipIds) setSavedTipIds(parsedState.savedTipIds);
      const checkInState = JSON.parse(raw) as { dailyCheckIns?: Record<string, DailyCheckIn> };
      if (checkInState.dailyCheckIns) setDailyCheckIns(checkInState.dailyCheckIns);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("skin-nepal-state", JSON.stringify({ language, themeMode, tier, subscription, profile, completion, likedTipIds, savedTipIds, dailyCheckIns }));
  }, [language, themeMode, tier, subscription, profile, completion, likedTipIds, savedTipIds, dailyCheckIns]);

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
    activatePremium: (source = "beta", plan = "beta") => {
      const now = new Date();
      const expires = new Date(now);
      expires.setMonth(expires.getMonth() + (plan === "yearly" ? 12 : plan === "monthly" ? 1 : 3));
      setTierState("premium");
      setSubscription({
        status: plan === "beta" ? "trial" : "premium",
        tier: "premium",
        source,
        plan,
        startedAt: now.toISOString(),
        expiresAt: expires.toISOString()
      });
    },
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
    toggleCompletion: (id) => setCompletion((current) => ({ ...current, [id]: !current[id] })),
    likedTipIds,
    savedTipIds,
    dailyCheckIns,
    todayCheckIn,
    updateTodayCheckIn: (patch) => setDailyCheckIns((current) => ({
      ...current,
      [today]: { ...(current[today] ?? createDefaultCheckIn(today, profile)), ...patch, date: today }
    })),
    toggleLikedTip: (id) => setLikedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    toggleSavedTip: (id) => setSavedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    pickSelfie: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
      if (!result.canceled) setProfile((current) => ({ ...current, selfieUri: result.assets[0]?.uri }));
    },
    resetData: async () => {
      await AsyncStorage.removeItem("skin-nepal-state");
      setLanguageState("en");
      setThemeModeState("light");
      setTierState("free");
      setSubscription({ status: "free", tier: "free", source: "demo" });
      setProfile(defaultProfile);
      setCompletion({});
      setLikedTipIds([]);
      setSavedTipIds([]);
      setDailyCheckIns({});
    }
  }), [completion, language, profile, themeMode, tier, subscription, likedTipIds, savedTipIds, dailyCheckIns, today, todayCheckIn]);

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
  return new Date().toISOString().slice(0, 10);
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
