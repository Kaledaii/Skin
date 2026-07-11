import { initMonitoring } from "./services/monitoring";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { getDefaultQuizProfile } from "./knowledge/engine";
import { activateSubscriptionFromRequest, createManualPaymentRequest, isSubscriptionActive, PaymentSubmissionResult } from "./services/payment";
import {
  AuthResult,
  AuthUserSummary,
  deleteCloudSnapshot,
  ensureAnonymousUser,
  getCurrentAuthUserSummary,
  getPaymentRequestById,
  linkAnonymousUserWithEmail,
  listPaymentRequests,
  loadRemoteCheckIns,
  loadRemoteProfile,
  loadRemoteSubscription,
  loadUserSnapshot,
  savePaymentRequest,
  signInAndLoadSnapshot,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  syncUserSnapshot,
  submitAppReview,
  updatePaymentRequest,
  updateUserSubscriptionForPayment,
  uploadPaymentScreenshot
} from "./services/firebaseSync";
import { addAdminAction, getCurrentAuthEmail } from "./services/firebaseSync";
import { AppReview, BudgetTier, DailyCheckIn, Gender, Language, NotificationPreferences, PaymentProvider, PaymentRequest, PaymentState, ProfileAddOnStatus, QuizReview, SkinType, SubscriptionInfo, SubscriptionPlanId, SubscriptionTier, ThemeMode, UserProfile, UserSnapshot } from "./types";

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
  refreshPaymentRequests: (status?: PaymentRequest["status"] | "all") => Promise<string>;
  retryPendingPaymentSync: () => Promise<string>;
  paymentRequests: PaymentRequest[];
  pickPaymentScreenshot: () => Promise<string | undefined>;
  loadSubscription: () => Promise<void>;
  signInAnonymously: () => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  authUser: AuthUserSummary | null;
  authStatus: string | null;
  authReady: boolean;
  authRequired: boolean;
  recoveryPhone: string;
  signUpAndSync: (input: { email: string; password: string; phone: string }) => Promise<AuthResult>;
  signInAndRestore: (input: { email: string; password: string; phone?: string }) => Promise<AuthResult>;
  syncNow: () => Promise<string>;
  refreshAccountData: () => Promise<string>;
  hydrateFromCloudSnapshot: (snapshot?: UserSnapshot) => void;
  submitReview: (input: { rating: AppReview["rating"]; experience: string }) => Promise<string>;
  profile: UserProfile;
  profiles: Record<string, UserProfile>;
  activeProfileId: string;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateQuiz: (section: "lifestyle" | "environment" | "currentRoutine" | "cycle", key: string, value: string) => void;
  toggleQuizArray: (key: "symptoms" | "primaryConcerns", value: string) => void;
  switchProfile: (profileId: string) => void;
  addProfile: () => string;
  activateProfileAddOn: (profileId: string) => void;
  dueQuizReviewDay: 15 | 30 | null;
  submitQuizReview: (review: Omit<QuizReview, "id" | "createdAt">) => void;
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
  pickSelfieFromCamera: () => Promise<void>;
  pickSelfieFromLibrary: () => Promise<void>;
  exportData: () => string;
  deleteCloudData: () => Promise<string>;
  resetData: () => Promise<void>;
};

const defaultProfile: UserProfile = {
  profileId: "primary",
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
  consentAccepted: false,
  addOnStatus: "included",
  quizReviews: []
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
  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({ primary: defaultProfile });
  const [activeProfileId, setActiveProfileId] = useState("primary");
  const [completion, setCompletion] = useState<Record<string, boolean>>({});
  const [likedTipIds, setLikedTipIds] = useState<string[]>([]);
  const [savedTipIds, setSavedTipIds] = useState<string[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [profileSavedProductIds, setProfileSavedProductIds] = useState<Record<string, string[]>>({ primary: [] });
  const [profileDailyCheckIns, setProfileDailyCheckIns] = useState<Record<string, Record<string, DailyCheckIn>>>({ primary: {} });
  const [today, setToday] = useState(getTodayKey);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const dailyCheckIns = profileDailyCheckIns[activeProfileId] ?? {};
  const todayCheckIn = dailyCheckIns[today] ?? createDefaultCheckIn(today, profile);
  const dueQuizReviewDay = getDueQuizReviewDay(profile);
  const authRequired = authReady && !authUser?.email;

  useEffect(() => {
    // Initialize monitoring (Sentry) if configured
    try { initMonitoring(); } catch {}
    // Load from local storage first (cached data)
    AsyncStorage.getItem("skin-nepal-state").then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Pick<AppState, "language" | "themeMode" | "tier" | "profile" | "completion" | "subscription">> & {
        profiles?: Record<string, UserProfile>;
        activeProfileId?: string;
        profileDailyCheckIns?: Record<string, Record<string, DailyCheckIn>>;
        profileSavedProductIds?: Record<string, string[]>;
        recoveryPhone?: string;
      };
      if (parsed.language) setLanguageState(parsed.language);
      if (parsed.themeMode) setThemeModeState(parsed.themeMode);
      if (parsed.tier) setTierState(parsed.tier);
      if (parsed.subscription) setSubscription(parsed.subscription);
      if (parsed.recoveryPhone) setRecoveryPhone(parsed.recoveryPhone);
      const migratedProfiles = migrateProfiles(parsed.profiles, parsed.profile);
      const nextActiveProfileId = parsed.activeProfileId && migratedProfiles[parsed.activeProfileId] ? parsed.activeProfileId : Object.keys(migratedProfiles)[0] ?? "primary";
      setProfiles(migratedProfiles);
      setActiveProfileId(nextActiveProfileId);
      setProfile(migratedProfiles[nextActiveProfileId] ?? defaultProfile);
      if (parsed.profileDailyCheckIns) {
        setProfileDailyCheckIns(parsed.profileDailyCheckIns);
      }
      if (parsed.completion) setCompletion(parsed.completion);
      const parsedState = JSON.parse(raw) as { likedTipIds?: string[]; savedTipIds?: string[]; savedProductIds?: string[]; notificationPreferences?: NotificationPreferences };
      if (parsedState.likedTipIds) setLikedTipIds(parsedState.likedTipIds);
      if (parsedState.savedTipIds) setSavedTipIds(parsedState.savedTipIds);
      if (parsed.profileSavedProductIds) {
        setProfileSavedProductIds(parsed.profileSavedProductIds);
        setSavedProductIds(parsed.profileSavedProductIds[nextActiveProfileId] ?? []);
      } else if (parsedState.savedProductIds) {
        setSavedProductIds(parsedState.savedProductIds);
        setProfileSavedProductIds({ [nextActiveProfileId]: parsedState.savedProductIds });
      }
      if (parsedState.notificationPreferences) setNotificationPreferences({ ...defaultNotificationPreferences, ...parsedState.notificationPreferences });
      const checkInState = JSON.parse(raw) as { dailyCheckIns?: Record<string, DailyCheckIn> };
      if (checkInState.dailyCheckIns && !parsed.profileDailyCheckIns) setProfileDailyCheckIns({ [nextActiveProfileId]: checkInState.dailyCheckIns });
      const paymentState = JSON.parse(raw) as { paymentState?: PaymentState; paymentRequests?: PaymentRequest[] };
      if (paymentState.paymentState) setPaymentState(paymentState.paymentState);
      if (paymentState.paymentRequests) setPaymentRequests(paymentState.paymentRequests);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    // Save state to local storage (cache backup)
    AsyncStorage.setItem("skin-nepal-state", JSON.stringify({ language, themeMode, tier, subscription, paymentState, paymentRequests, profile, profiles, activeProfileId, recoveryPhone, completion, likedTipIds, savedTipIds, savedProductIds, profileSavedProductIds, dailyCheckIns, profileDailyCheckIns, notificationPreferences })).catch(() => undefined);
  }, [language, themeMode, tier, subscription, paymentState, paymentRequests, profile, profiles, activeProfileId, recoveryPhone, completion, likedTipIds, savedTipIds, savedProductIds, profileSavedProductIds, dailyCheckIns, profileDailyCheckIns, notificationPreferences]);

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
    setProfileDailyCheckIns((current) => {
      const activeCheckIns = current[activeProfileId] ?? {};
      if (activeCheckIns[today]) return current;
      return { ...current, [activeProfileId]: { ...activeCheckIns, [today]: createDefaultCheckIn(today, profile) } };
    });
  }, [activeProfileId, profile, today]);

  useEffect(() => {
    // Initialize Firebase authentication and load remote data
    ensureAnonymousUser()
      .then(async () => {
        const currentAuth = getCurrentAuthUserSummary();
        setAuthUser(currentAuth);
        if (currentAuth?.email) {
          const snapshot = await loadUserSnapshot();
          if (snapshot.ok) {
            hydrateFromCloudSnapshot(snapshot.snapshot);
            setAuthStatus(snapshot.message);
          }
        }
        return Promise.all([
        loadRemoteSubscription(),
        loadRemoteProfile(),
        loadRemoteCheckIns()
        ]);
      })
      .then(([remoteSubscription, remoteProfile, remoteCheckIns]) => {
        // Load subscription if valid
        if (remoteSubscription && isSubscriptionActive(remoteSubscription)) {
          setSubscription(remoteSubscription);
          setTierState("premium");
          setPaymentState(remoteSubscription.paymentState ?? "active");
        }
        // Load profile if exists
        if (remoteProfile && remoteProfile.name) {
          const normalized = normalizeProfile(remoteProfile, activeProfileId, "included");
          setProfile(normalized);
          setProfiles((current) => ({ ...current, [normalized.profileId ?? activeProfileId]: normalized }));
        }
        // Load check-ins if exist
        if (remoteCheckIns && Object.keys(remoteCheckIns).length > 0) {
          setProfileDailyCheckIns((current) => ({ ...current, [activeProfileId]: remoteCheckIns }));
        }
      })
      .catch(() => undefined)
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    // Auto-sync profile changes to Firebase (5 second debounce to avoid too frequent saves)
    const timeout = setTimeout(() => {
      if (profile.name) {  // Only sync if profile has been filled
        syncUserSnapshot({
          profile,
          profiles,
          activeProfileId,
          subscription,
          dailyCheckIns,
          profileDailyCheckIns,
          profileSavedProductIds,
          recoveryPhone,
          notificationPreferences,
          paymentRequests
        }).catch(() => undefined);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [profile, profiles, activeProfileId, subscription, dailyCheckIns, profileDailyCheckIns, profileSavedProductIds, recoveryPhone, notificationPreferences, paymentRequests]);

  useEffect(() => {
    const pending = paymentRequests.filter((item) => item.status === "pending_review" || item.status === "approved");
    if (!pending.length || tier === "premium") return;
    let cancelled = false;
    const checkApprovedRequests = async () => {
      for (const request of pending) {
        const cloudRequest = await getPaymentRequestById(request.id);
        if (cancelled || !cloudRequest.ok || !cloudRequest.request) continue;
        if (cloudRequest.request.status === "approved") {
          const nextSubscription = activateSubscriptionFromRequest(cloudRequest.request);
          setPaymentRequests((current) => current.map((item) => item.id === cloudRequest.request?.id ? { ...cloudRequest.request, cloudSyncStatus: "synced" } : item));
          setSubscription(nextSubscription);
          setTierState("premium");
          setPaymentState("active");
          return;
        }
        if (cloudRequest.request.status === "rejected") {
          setPaymentRequests((current) => current.map((item) => item.id === cloudRequest.request?.id ? { ...cloudRequest.request, cloudSyncStatus: "synced" } : item));
          setPaymentState("rejected");
          return;
        }
      }
    };
    checkApprovedRequests().catch(() => undefined);
    const timer = setInterval(() => checkApprovedRequests().catch(() => undefined), 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paymentRequests, tier]);

  useEffect(() => {
    const applyExpiry = () => {
      if (subscription.tier !== "premium" || !subscription.expiresAt) return;
      if (new Date(subscription.expiresAt).getTime() > Date.now()) return;
      setSubscription((current) => ({ ...current, status: "expired", tier: "free", paymentState: "expired" }));
      setTierState("free");
      setPaymentState("expired");
    };
    applyExpiry();
    const timer = setInterval(applyExpiry, 60 * 1000);
    return () => clearInterval(timer);
  }, [subscription.expiresAt, subscription.tier]);

  const hydrateFromCloudSnapshot = (snapshot?: UserSnapshot) => {
    if (!snapshot) return;
    if (snapshot.recoveryPhone) setRecoveryPhone(snapshot.recoveryPhone);
    if (snapshot.subscription) {
      setSubscription(snapshot.subscription);
      setTierState(isSubscriptionActive(snapshot.subscription) ? "premium" : snapshot.subscription.tier);
      setPaymentState(snapshot.subscription.paymentState ?? snapshot.paymentState ?? paymentState);
    } else if (snapshot.paymentState) {
      setPaymentState(snapshot.paymentState);
    }
    if (snapshot.paymentRequests) setPaymentRequests(snapshot.paymentRequests);
    const nextProfiles = migrateProfiles(snapshot.profiles, snapshot.profile);
    const nextActiveProfileId = snapshot.activeProfileId && nextProfiles[snapshot.activeProfileId] ? snapshot.activeProfileId : Object.keys(nextProfiles)[0] ?? "primary";
    setProfiles(nextProfiles);
    setActiveProfileId(nextActiveProfileId);
    setProfile(nextProfiles[nextActiveProfileId] ?? defaultProfile);
    if (snapshot.profileDailyCheckIns) {
      setProfileDailyCheckIns(snapshot.profileDailyCheckIns);
    } else if (snapshot.dailyCheckIns) {
      setProfileDailyCheckIns({ [nextActiveProfileId]: snapshot.dailyCheckIns });
    }
    if (snapshot.profileSavedProductIds) {
      setProfileSavedProductIds(snapshot.profileSavedProductIds);
      setSavedProductIds(snapshot.profileSavedProductIds[nextActiveProfileId] ?? []);
    }
    if (snapshot.notificationPreferences) {
      setNotificationPreferences({ ...defaultNotificationPreferences, ...snapshot.notificationPreferences });
    }
  };

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
      if (!authUser?.email) {
        return { ok: false, message: "Please sign in with email before submitting payment so premium can be restored later." };
      }
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
        userId: authUser.uid,
        userEmail: authUser.email,
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
      let saved: Awaited<ReturnType<typeof savePaymentRequest>>;
      try {
        saved = await savePaymentRequest(request);
      } catch {
        saved = { ok: false, mode: "local-demo", request };
      }
      const savedRequest = saved.ok && saved.request
        ? { ...saved.request, cloudSyncStatus: "synced" as const, cloudSyncError: undefined }
        : { ...request, cloudSyncStatus: "local_only" as const, cloudSyncError: "error" in saved ? saved.error : "Could not sync to Firebase admin inbox." };
      setPaymentRequests((current) => [savedRequest, ...current.filter((item) => item.id !== savedRequest.id)]);
      setRecoveryPhone(input.payerPhone.trim());
      setPaymentState("pending_review");
      try {
        await syncUserSnapshot({ profile, profiles, activeProfileId, subscription: { ...subscription, paymentState: "pending_review" }, dailyCheckIns, profileDailyCheckIns, profileSavedProductIds, recoveryPhone: input.payerPhone.trim(), notificationPreferences, paymentRequests: [savedRequest, ...paymentRequests] });
      } catch {
        // Keep the local pending review record when cloud sync is unavailable.
      }
      return {
        ...result,
        request: savedRequest,
        message: saved.ok
          ? "Payment submitted for review and synced to the admin panel."
          : "Payment saved on this device, but it did not reach the admin panel yet. Enable Firebase Anonymous Auth or tap Retry admin sync after fixing Firebase."
      };
    },
    approvePaymentRequest: async (id, note = "Approved") => {
      const request = paymentRequests.find((item) => item.id === id);
      if (!request) return "Payment request not found.";
      const reviewed: PaymentRequest = { ...request, status: "approved", reviewedAt: new Date().toISOString(), reviewNote: note };
      const nextSubscription = activateSubscriptionFromRequest(reviewed);
      await updatePaymentRequest(reviewed);
      await updateUserSubscriptionForPayment(reviewed, nextSubscription);
      // Audit: record admin approval action
      try {
        const currentAdminEmail = getCurrentAuthEmail();
        await addAdminAction({ actionType: "approve", requestId: reviewed.id, adminId: currentAdminEmail ?? null, payload: { note } });
      } catch {
        // non-blocking
      }
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
      // Audit: record admin rejection action
      try {
        const currentAdminEmail = getCurrentAuthEmail();
        await addAdminAction({ actionType: "reject", requestId: reviewed.id, adminId: currentAdminEmail ?? null, payload: { note } });
      } catch {
        // non-blocking
      }
      setPaymentRequests((current) => current.map((item) => item.id === id ? reviewed : item));
      if (reviewed.userId === "local-demo-user") setPaymentState("rejected");
      return "Payment request rejected.";
    },
    refreshPaymentRequests: async (status = "pending_review") => {
      const result = await listPaymentRequests(status === "all" ? undefined : status);
      if (result.ok) {
        setPaymentRequests(result.requests);
        return `Loaded ${result.requests.length} cloud payment request${result.requests.length === 1 ? "" : "s"}.`;
      }
      return `Could not load cloud payment requests: ${"error" in result ? result.error : "Firebase is unavailable."}`;
    },
    retryPendingPaymentSync: async () => {
      const pending = paymentRequests.find((item) => item.status === "pending_review" && item.cloudSyncStatus !== "synced");
      if (!pending) return "No local-only pending request to sync.";
      const saved = await savePaymentRequest(pending);
      if (!saved.ok || !saved.request) {
        const message = "error" in saved ? saved.error : "Firebase sync failed.";
        setPaymentRequests((current) => current.map((item) => item.id === pending.id ? { ...item, cloudSyncStatus: "local_only", cloudSyncError: message } : item));
        return `Still local-only: ${message}`;
      }
      const synced = { ...saved.request, cloudSyncStatus: "synced" as const, cloudSyncError: undefined };
      setPaymentRequests((current) => current.map((item) => item.id === pending.id ? synced : item));
      return "Payment request synced to the admin panel.";
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
        return;
      }
      if (remote && remote.tier === "premium" && !isSubscriptionActive(remote)) {
        setSubscription({ ...remote, status: "expired", tier: "free", paymentState: "expired" });
        setTierState("free");
        setPaymentState("expired");
        return;
      }

      for (const localRequest of paymentRequests.filter((item) => item.status === "pending_review" || item.status === "approved")) {
        const cloudRequest = await getPaymentRequestById(localRequest.id);
        if (cloudRequest.ok && cloudRequest.request?.status === "approved") {
          const nextSubscription = activateSubscriptionFromRequest(cloudRequest.request);
          setPaymentRequests((current) => current.map((item) => item.id === cloudRequest.request?.id ? { ...cloudRequest.request, cloudSyncStatus: "synced" } : item));
          setSubscription(nextSubscription);
          setTierState("premium");
          setPaymentState("active");
          return;
        }
        if (cloudRequest.ok && cloudRequest.request?.status === "rejected") {
          setPaymentRequests((current) => current.map((item) => item.id === cloudRequest.request?.id ? { ...cloudRequest.request, cloudSyncStatus: "synced" } : item));
          setPaymentState("rejected");
          return;
        }
      }

      if (subscription.expiresAt && new Date(subscription.expiresAt).getTime() <= Date.now()) {
        setSubscription((current) => ({ ...current, status: "expired", tier: "free", paymentState: "expired" }));
        setTierState("free");
        setPaymentState("expired");
      }
    },
    signInAnonymously: ensureAnonymousUser,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    authUser,
    authStatus,
    authReady,
    authRequired,
    recoveryPhone,
    signUpAndSync: async ({ email, password, phone }) => {
      setAuthStatus("Creating account...");
      const result = await linkAnonymousUserWithEmail(email, password, phone);
      setAuthStatus(result.message);
      if (!result.ok) return result;
      setRecoveryPhone(phone.trim());
      setAuthUser(getCurrentAuthUserSummary());
      await syncUserSnapshot({
        profile,
        profiles,
        activeProfileId,
        subscription,
        dailyCheckIns,
        profileDailyCheckIns,
        profileSavedProductIds,
        recoveryPhone: phone.trim(),
        notificationPreferences,
        paymentRequests
      });
      return result;
    },
    signInAndRestore: async ({ email, password, phone }) => {
      setAuthStatus("Signing in...");
      const result = await signInAndLoadSnapshot(email, password, phone);
      setAuthStatus(result.message);
      if (!result.ok) return { ok: false, mode: "email", message: result.message };
      setAuthUser(getCurrentAuthUserSummary());
      if (phone?.trim()) setRecoveryPhone(phone.trim());
      if (result.snapshot) {
        hydrateFromCloudSnapshot(result.snapshot);
      } else {
        await syncUserSnapshot({
          profile,
          profiles,
          activeProfileId,
          subscription,
          dailyCheckIns,
          profileDailyCheckIns,
          profileSavedProductIds,
          recoveryPhone: phone?.trim() || recoveryPhone,
          notificationPreferences,
          paymentRequests
        });
      }
      return { ok: true, uid: result.uid, email: result.email, mode: "email", message: result.message };
    },
    syncNow: async () => {
      if (!authUser?.email) return "Please sign in with email before syncing.";
      const result = await syncUserSnapshot({
        profile,
        profiles,
        activeProfileId,
        subscription,
        dailyCheckIns,
        profileDailyCheckIns,
        profileSavedProductIds,
        recoveryPhone,
        notificationPreferences,
        paymentRequests
      });
      return result.ok ? "Account data synced." : "Could not sync account data yet.";
    },
    refreshAccountData: async () => {
      const result = await loadUserSnapshot();
      if (!result.ok) return result.message;
      hydrateFromCloudSnapshot(result.snapshot);
      setAuthUser(getCurrentAuthUserSummary());
      setAuthStatus(result.message);
      return result.message;
    },
    hydrateFromCloudSnapshot,
    submitReview: async (input) => {
      const result = await submitAppReview({
        ...input,
        profileName: profile.name,
        profileLocation: profile.location
      });
      return result.message;
    },
    profile,
    profiles,
    activeProfileId,
    updateProfile: (patch) => {
      setProfile((current) => {
        const next = normalizeProfile({ ...current, ...patch }, current.profileId ?? activeProfileId, current.addOnStatus ?? "included");
        setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: next }));
        return next;
      });
    },
    updateQuiz: (section, key, optionValue) => setProfile((current) => {
      const next = normalizeProfile({
        ...current,
        quiz: {
          ...current.quiz,
          [section]: {
            ...current.quiz[section],
            [key]: optionValue
          }
        }
      }, current.profileId ?? activeProfileId, current.addOnStatus ?? "included");
      setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: next }));
      return next;
    }),
    toggleQuizArray: (key, optionValue) => setProfile((current) => {
      const values = current.quiz[key];
      const nextValues = values.includes(optionValue) ? values.filter((item) => item !== optionValue) : [...values, optionValue];
      const next = {
        ...current,
        symptoms: key === "symptoms" ? nextValues : current.symptoms,
        quiz: {
          ...current.quiz,
          [key]: nextValues
        }
      };
      setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: normalizeProfile(next, next.profileId ?? activeProfileId, next.addOnStatus ?? "included") }));
      return next;
    }),
    switchProfile: (profileId) => {
      const next = profiles[profileId];
      if (!next) return;
      setActiveProfileId(profileId);
      setProfile(next);
      setSavedProductIds(profileSavedProductIds[profileId] ?? []);
    },
    addProfile: () => {
      const profileId = `profile_${Date.now()}`;
      const next = normalizeProfile({
        ...defaultProfile,
        profileId,
        name: "",
        age: "",
        gender: "female",
        consentAccepted: false,
        addOnStatus: "locked",
        planStartedAt: undefined,
        quizReviews: []
      }, profileId, "locked");
      setProfiles((current) => ({ ...current, [profileId]: next }));
      setProfileDailyCheckIns((current) => ({ ...current, [profileId]: {} }));
      setProfileSavedProductIds((current) => ({ ...current, [profileId]: [] }));
      setActiveProfileId(profileId);
      setProfile(next);
      setSavedProductIds([]);
      return profileId;
    },
    activateProfileAddOn: (profileId) => {
      setProfiles((current) => {
        const existing = current[profileId];
        if (!existing) return current;
        const next = normalizeProfile({ ...existing, addOnStatus: "active" }, profileId, "active");
        if (profileId === activeProfileId) setProfile(next);
        return { ...current, [profileId]: next };
      });
    },
    dueQuizReviewDay,
    submitQuizReview: (review) => {
      setProfile((current) => {
        const submitted: QuizReview = { ...review, id: `review_${review.day}_${Date.now()}`, createdAt: new Date().toISOString() };
        const next = applyQuizReview(normalizeProfile(current, current.profileId ?? activeProfileId, current.addOnStatus ?? "included"), submitted);
        setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: next }));
        return next;
      });
    },
    completion,
    toggleCompletion: (id) => setProfileDailyCheckIns((current) => {
      const activeCheckIns = current[activeProfileId] ?? {};
      const checkIn = activeCheckIns[today] ?? createDefaultCheckIn(today, profile);
      const existing = checkIn.completedStepIds ?? [];
      const completedStepIds = existing.includes(id) ? existing.filter((item) => item !== id) : [...existing, id];
      return { ...current, [activeProfileId]: { ...activeCheckIns, [today]: { ...checkIn, completedStepIds, date: today } } };
    }),
    likedTipIds,
    savedTipIds,
    savedProductIds,
    dailyCheckIns,
    todayCheckIn,
    updateTodayCheckIn: (patch) => setProfileDailyCheckIns((current) => {
      const activeCheckIns = current[activeProfileId] ?? {};
      return {
        ...current,
        [activeProfileId]: {
          ...activeCheckIns,
          [today]: { ...(activeCheckIns[today] ?? createDefaultCheckIn(today, profile)), ...patch, date: today }
        }
      };
    }),
    notificationPreferences,
    updateNotificationPreferences: (patch) => setNotificationPreferences((current) => ({ ...current, ...patch })),
    toggleLikedTip: (id) => setLikedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    toggleSavedTip: (id) => setSavedTipIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id])),
    toggleSavedProduct: (id) => setSavedProductIds((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      setProfileSavedProductIds((profileMap) => ({ ...profileMap, [activeProfileId]: next }));
      return next;
    }),
    pickSelfie: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
      if (!result.canceled) setProfile((current) => {
        const next = { ...current, selfieUri: result.assets[0]?.uri };
        setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: normalizeProfile(next, next.profileId ?? activeProfileId, next.addOnStatus ?? "included") }));
        return next;
      });
    },
    pickSelfieFromLibrary: async () => {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
      if (!result.canceled) setProfile((current) => {
        const next = { ...current, selfieUri: result.assets[0]?.uri };
        setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: normalizeProfile(next, next.profileId ?? activeProfileId, next.addOnStatus ?? "included") }));
        return next;
      });
    },
    pickSelfieFromCamera: async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera permission needed", "Allow camera access to take a selfie, or choose one from your gallery.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75, allowsEditing: false });
      if (!result.canceled) setProfile((current) => {
        const next = { ...current, selfieUri: result.assets[0]?.uri };
        setProfiles((profileMap) => ({ ...profileMap, [next.profileId ?? activeProfileId]: normalizeProfile(next, next.profileId ?? activeProfileId, next.addOnStatus ?? "included") }));
        return next;
      });
    },
    exportData: () => JSON.stringify({ language, themeMode, tier, subscription, paymentState, paymentRequests, profile, profiles, activeProfileId, completion, likedTipIds, savedTipIds, savedProductIds, profileSavedProductIds, dailyCheckIns, profileDailyCheckIns, notificationPreferences }, null, 2),
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
      setRecoveryPhone("");
      setProfile(defaultProfile);
      setProfiles({ primary: defaultProfile });
      setActiveProfileId("primary");
      setCompletion({});
      setLikedTipIds([]);
      setSavedTipIds([]);
      setSavedProductIds([]);
      setProfileSavedProductIds({ primary: [] });
      setProfileDailyCheckIns({ primary: {} });
      setToday(getTodayKey());
      setNotificationPreferences(defaultNotificationPreferences);
    }
  }), [activeProfileId, authReady, authRequired, authStatus, authUser, completion, dueQuizReviewDay, language, profile, profiles, profileSavedProductIds, recoveryPhone, themeMode, tier, subscription, paymentState, paymentRequests, likedTipIds, savedTipIds, savedProductIds, dailyCheckIns, profileDailyCheckIns, notificationPreferences, today, todayCheckIn]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}

export const skinTypes: SkinType[] = ["oily", "dry", "combination", "sensitive"];
export const budgetTiers: BudgetTier[] = ["under200", "200to500", "500plus"];
export const genders: Gender[] = ["female", "male", "prefer_not_to_say"];

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

function migrateProfiles(savedProfiles?: Record<string, UserProfile>, legacyProfile?: UserProfile) {
  const source = savedProfiles && Object.keys(savedProfiles).length > 0
    ? savedProfiles
    : { primary: legacyProfile ?? defaultProfile };
  const entries = Object.entries(source).map(([id, item], index) => {
    const status: ProfileAddOnStatus = index === 0 ? "included" : item.addOnStatus ?? "locked";
    const profileId = item.profileId ?? id;
    return [profileId, normalizeProfile(item, profileId, status)] as const;
  });
  return Object.fromEntries(entries.length ? entries : [["primary", defaultProfile]]);
}

function normalizeProfile(profile: UserProfile, profileId: string, addOnStatus: ProfileAddOnStatus): UserProfile {
  const quiz = profile.quiz ?? getDefaultQuizProfile();
  const defaultQuiz = getDefaultQuizProfile();
  return {
    ...defaultProfile,
    ...profile,
    profileId,
    gender: normalizeGender(profile.gender),
    addOnStatus,
    quiz: {
      ...defaultQuiz,
      ...quiz,
      lifestyle: { ...defaultQuiz.lifestyle, ...quiz.lifestyle },
      environment: { ...defaultQuiz.environment, ...quiz.environment },
      currentRoutine: { ...defaultQuiz.currentRoutine, ...quiz.currentRoutine },
      cycle: { ...defaultQuiz.cycle, ...quiz.cycle }
    },
    quizReviews: profile.quizReviews ?? []
  };
}

function normalizeGender(value: Gender | "nonbinary" | "preferNot" | undefined): Gender {
  if (value === "male" || value === "female" || value === "prefer_not_to_say") return value;
  return "prefer_not_to_say";
}

function getDueQuizReviewDay(profile: UserProfile): 15 | 30 | null {
  if (!profile.planStartedAt || profile.addOnStatus === "locked") return null;
  const started = new Date(profile.planStartedAt).getTime();
  if (Number.isNaN(started)) return null;
  const elapsedDays = Math.floor((Date.now() - started) / (24 * 60 * 60 * 1000));
  const completed = new Set((profile.quizReviews ?? []).map((review) => review.day));
  if (elapsedDays >= 30 && !completed.has(30)) return 30;
  if (elapsedDays >= 15 && !completed.has(15)) return 15;
  return null;
}

function applyQuizReview(profile: UserProfile, review: QuizReview): UserProfile {
  const quiz = { ...profile.quiz, lifestyle: { ...profile.quiz.lifestyle }, currentRoutine: { ...profile.quiz.currentRoutine } };
  if (review.routineFollowed === "no") {
    quiz.currentRoutine.cleanses_twice = "no";
    quiz.currentRoutine.uses_sunscreen = quiz.currentRoutine.uses_sunscreen === "yes" ? "sometimes" : quiz.currentRoutine.uses_sunscreen;
  }
  if (review.dietFollowed === "no") {
    quiz.lifestyle.junk_food_frequency = quiz.lifestyle.junk_food_frequency === "high" ? "high" : "medium";
  }
  if (review.sideEffects === "dryness" || review.sideEffects === "burning") {
    quiz.primaryConcerns = Array.from(new Set([...quiz.primaryConcerns, "sensitivity", "dryness"]));
    quiz.symptoms = Array.from(new Set([...quiz.symptoms, review.sideEffects === "burning" ? "burning_sensation" : "dry_patches"]));
  }
  if (review.acneChange === "worse") {
    quiz.primaryConcerns = Array.from(new Set([...quiz.primaryConcerns, "acne"]));
    quiz.symptoms = Array.from(new Set([...quiz.symptoms, "cysts_painful"]));
  }
  return {
    ...profile,
    quiz,
    lastReviewPromptAt: review.createdAt,
    quizReviews: [...(profile.quizReviews ?? []).filter((item) => item.day !== review.day), review]
  };
}
