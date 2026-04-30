import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { getDefaultQuizProfile } from "./knowledge/engine";
import { BudgetTier, Language, SkinType, SubscriptionTier, ThemeMode, UserProfile } from "./types";

type AppState = {
  language: Language;
  setLanguage: (value: Language) => void;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
  tier: SubscriptionTier;
  setTier: (value: SubscriptionTier) => void;
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateQuiz: (section: "lifestyle" | "environment" | "currentRoutine", key: string, value: string) => void;
  toggleQuizArray: (key: "symptoms" | "primaryConcerns", value: string) => void;
  completion: Record<string, boolean>;
  toggleCompletion: (id: string) => void;
  likedTipIds: string[];
  savedTipIds: string[];
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
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [likedTipIds, setLikedTipIds] = useState<string[]>([]);
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("skin-nepal-state").then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Pick<AppState, "language" | "themeMode" | "tier" | "profile" | "completion">>;
      if (parsed.language) setLanguageState(parsed.language);
      if (parsed.themeMode) setThemeModeState(parsed.themeMode);
      if (parsed.tier) setTierState(parsed.tier);
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
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("skin-nepal-state", JSON.stringify({ language, themeMode, tier, profile, completion, likedTipIds, savedTipIds }));
  }, [language, themeMode, tier, profile, completion, likedTipIds, savedTipIds]);

  const value = useMemo<AppState>(() => ({
    language,
    setLanguage: setLanguageState,
    themeMode,
    setThemeMode: setThemeModeState,
    tier,
    setTier: setTierState,
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
      setProfile(defaultProfile);
      setCompletion({});
      setLikedTipIds([]);
      setSavedTipIds([]);
    }
  }), [completion, language, profile, themeMode, tier, likedTipIds, savedTipIds]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

export const skinTypes: SkinType[] = ["oily", "dry", "combination", "sensitive"];
export const budgetTiers: BudgetTier[] = ["under200", "200to500", "500plus"];
