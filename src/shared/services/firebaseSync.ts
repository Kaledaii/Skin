import { AppReview, DailyCheckIn, PaymentRequest, SubscriptionInfo, UserProfile } from "../types";
import { getFirebase } from "./firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInAnonymously as firebaseSignInAnonymously, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export type SyncPayload = {
  profile: UserProfile;
  subscription: SubscriptionInfo;
  dailyCheckIns: Record<string, DailyCheckIn>;
  paymentRequests?: PaymentRequest[];
};

export type AuthResult = { ok: boolean; uid?: string; email?: string | null; mode: "local-demo" | "anonymous" | "email"; message: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Firebase request failed.";
}

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Firebase request timed out.")), ms))
  ]);
}

export async function ensureAnonymousUser(): Promise<AuthResult> {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo", message: "Firebase is not configured; using local demo mode." };
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    return { ok: true, uid: user.uid, email: user.email, mode: "anonymous", message: "Anonymous account ready." };
  } catch {
    return { ok: false, mode: "local-demo", message: "Could not connect to Firebase; using local mode." };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo", message: "Firebase is not configured." };
  const credential = await createUserWithEmailAndPassword(firebase.auth, email.trim(), password);
  return { ok: true, uid: credential.user.uid, email: credential.user.email, mode: "email", message: "Email account created." };
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo", message: "Firebase is not configured." };
  const credential = await signInWithEmailAndPassword(firebase.auth, email.trim(), password);
  return { ok: true, uid: credential.user.uid, email: credential.user.email, mode: "email", message: "Signed in." };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo", message: "Firebase is not configured." };
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(firebase.auth, provider);
  return { ok: true, uid: credential.user.uid, email: credential.user.email, mode: "email", message: "Signed in with Google." };
}

export async function syncUserSnapshot(payload: SyncPayload) {
  try {
    const firebase = getFirebase();
    if (!firebase) {
      return { ok: false, mode: "local-demo" as const };
    }

    const credential = firebase.auth.currentUser ? { user: firebase.auth.currentUser } : await firebaseSignInAnonymously(firebase.auth);
    const uid = credential.user.uid;
    const userRef = doc(firebase.db, "users", uid);
    const existingSnapshot = await getDoc(userRef).catch(() => undefined);
    const existingSubscription = existingSnapshot?.exists() ? existingSnapshot.data().subscription as SubscriptionInfo | undefined : undefined;
    const existingPremiumActive =
      existingSubscription?.tier === "premium" &&
      (!existingSubscription.expiresAt || new Date(existingSubscription.expiresAt).getTime() > Date.now());
    const localIsPremium = payload.subscription.tier === "premium";
    const subscriptionToSave = existingPremiumActive && !localIsPremium ? existingSubscription : payload.subscription;
    const basePayload = {
      profile: payload.profile,
      dailyCheckIns: payload.dailyCheckIns,
      paymentRequests: payload.paymentRequests ?? [],
      updatedAt: serverTimestamp()
    };
    const subscriptionPayload = existingSnapshot?.exists()
      ? {}
      : {
          subscription: subscriptionToSave,
          paymentState: subscriptionToSave.paymentState,
          lastPaymentRequestId: subscriptionToSave.paymentRequestId
        };
    await setDoc(userRef, { ...basePayload, ...subscriptionPayload }, { merge: true });
    return {
      ok: true,
      mode: "firebase-synced" as const,
      uid,
      profileName: payload.profile.name,
      checkInCount: Object.keys(payload.dailyCheckIns).length
    };
  } catch {
    return { ok: false, mode: "local-demo" as const };
  }
}

export async function uploadPaymentScreenshot(uri: string, requestId: string) {
  try {
    const cloudinaryUrl = await uploadPaymentScreenshotToCloudinary(uri, requestId);
    if (cloudinaryUrl) return cloudinaryUrl;

    const firebase = getFirebase();
    if (!firebase || !uri) return undefined;
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(firebase.storage, `payment-screenshots/${user.uid}/${requestId}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  } catch {
    return undefined;
  }
}

async function uploadPaymentScreenshotToCloudinary(uri: string, requestId: string) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!uri || !cloudName || !uploadPreset) return undefined;

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: `${requestId}.jpg`,
    type: "image/jpeg"
  } as unknown as Blob);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "prabha-payment-screenshots");
  formData.append("public_id", requestId);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) return undefined;
    const payload = await response.json() as { secure_url?: string };
    return payload.secure_url;
  } catch {
    return undefined;
  }
}

export async function savePaymentRequest(request: PaymentRequest) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, request };
    let next = { ...request };
    try {
      const user = firebase.auth.currentUser ?? (await withTimeout(firebaseSignInAnonymously(firebase.auth), 8000)).user;
      next = { ...next, userId: user.uid, userEmail: user.email ?? request.userEmail ?? null };
    } catch {
      next = { ...next, userId: request.userId || "local-demo-user", userEmail: request.userEmail ?? null };
    }
    // Basic server-side rate limiting: prevent abuse
    try {
      const MAX_PER_HOUR = 5;
      const MAX_PER_DAY = 20;
      const cutoffHour = new Date(Date.now() - 60 * 60 * 1000);
      const cutoffDay = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const qHour = query(collection(firebase.db, "paymentRequests"), where("userId", "==", next.userId), where("createdAt", ">", cutoffHour));
      const qDay = query(collection(firebase.db, "paymentRequests"), where("userId", "==", next.userId), where("createdAt", ">", cutoffDay));
      const [snapHour, snapDay] = await Promise.all([withTimeout(getDocs(qHour), 5000), withTimeout(getDocs(qDay), 5000)]);
      if (snapHour.size >= MAX_PER_HOUR) return { ok: false, mode: "rate-limited" as const, request, error: "Too many submissions in the last hour." };
      if (snapDay.size >= MAX_PER_DAY) return { ok: false, mode: "rate-limited" as const, request, error: "Too many submissions in the last 24 hours." };
    } catch (e) {
      // if rate-limit check fails (e.g., offline), continue to allow save but log
      console.warn("rate-limit check failed", e);
    }

    // Basic sanitization: trim strings and cap lengths
    next = {
      ...next,
      transactionId: String(next.transactionId ?? "").trim().slice(0, 128),
      payerName: String(next.payerName ?? "").trim().slice(0, 128),
      payerPhone: String(next.payerPhone ?? "").trim().slice(0, 32),
      screenshotDownloadUrl: next.screenshotDownloadUrl ? String(next.screenshotDownloadUrl).trim().slice(0, 1024) : next.screenshotDownloadUrl
    };
    await withTimeout(setDoc(doc(firebase.db, "paymentRequests", request.id), { ...next, cloudSyncStatus: "synced", cloudSyncError: null, updatedAt: serverTimestamp() }, { merge: true }));
    return { ok: true, mode: "firebase-synced" as const, request: next };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, request, error: errorMessage(error) };
  }
}

export async function listPaymentRequests(status?: PaymentRequest["status"]) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, requests: [] as PaymentRequest[] };
    const requestQuery = status
      ? query(collection(firebase.db, "paymentRequests"), where("status", "==", status), orderBy("createdAt", "desc"))
      : query(collection(firebase.db, "paymentRequests"), orderBy("createdAt", "desc"));
    const snapshot = await withTimeout(getDocs(requestQuery));
    return { ok: true, mode: "firebase-synced" as const, requests: snapshot.docs.map((item) => item.data() as PaymentRequest) };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, requests: [] as PaymentRequest[], error: errorMessage(error) };
  }
}

export async function getPaymentRequestById(id: string) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, request: undefined as PaymentRequest | undefined };
    const snapshot = await withTimeout(getDoc(doc(firebase.db, "paymentRequests", id)));
    return {
      ok: true,
      mode: "firebase-synced" as const,
      request: snapshot.exists() ? snapshot.data() as PaymentRequest : undefined
    };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, request: undefined as PaymentRequest | undefined, error: errorMessage(error) };
  }
}

export async function updatePaymentRequest(request: PaymentRequest) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const };
    await updateDoc(doc(firebase.db, "paymentRequests", request.id), { ...request, updatedAt: serverTimestamp() });
    return { ok: true, mode: "firebase-synced" as const };
  } catch {
    return { ok: false, mode: "local-demo" as const };
  }
}

export async function addAdminAction(action: { actionType: string; requestId: string; adminId?: string | null; payload?: any }) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const };
    const id = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const docRef = doc(firebase.db, "adminActions", id);
    await setDoc(docRef, { id, createdAt: serverTimestamp(), ...action });
    return { ok: true, mode: "firebase-synced" as const, id };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, error: errorMessage(error) };
  }
}

export async function listAdminActions(requestId: string) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, actions: [] as any[] };
    const q = query(collection(firebase.db, "adminActions"), where("requestId", "==", requestId), orderBy("createdAt", "desc"));
    const snapshot = await withTimeout(getDocs(q));
    return { ok: true, mode: "firebase-synced" as const, actions: snapshot.docs.map((d) => d.data()) };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, actions: [] as any[], error: errorMessage(error) };
  }
}

export async function updateUserSubscriptionForPayment(request: PaymentRequest, subscription: SubscriptionInfo) {
  try {
    const firebase = getFirebase();
    if (!firebase || !request.userId || request.userId === "local-demo-user") return { ok: false, mode: "local-demo" as const };
    await setDoc(
      doc(firebase.db, "users", request.userId),
      {
        subscription,
        paymentState: subscription.paymentState ?? "active",
        lastPaymentRequestId: request.id,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return { ok: true, mode: "firebase-synced" as const };
  } catch {
    return { ok: false, mode: "local-demo" as const };
  }
}

export function getCurrentAuthEmail() {
  const firebase = getFirebase();
  return firebase?.auth.currentUser?.email ?? null;
}

export async function submitExpertQuestion(question: string, profileName: string) {
  const clean = question.trim();
  if (!clean) return { ok: false, mode: "validation" as const, message: "Question is required." };
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, message: "Question saved locally for now." };
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const id = `expert_${Date.now()}`;
    await setDoc(doc(firebase.db, "expertQuestions", id), {
      id,
      userId: user.uid,
      profileName,
      question: clean,
      status: "new",
      createdAt: serverTimestamp()
    });
    return { ok: true, mode: "firebase-synced" as const, message: "Question submitted. Expert review can be added from admin workflow." };
  } catch {
    return { ok: false, mode: "local-demo" as const, message: "Question saved locally for now." };
  }
}

export async function submitAppReview(input: { rating: AppReview["rating"]; experience: string; profileName?: string; profileLocation?: string }) {
  const clean = input.experience.trim().slice(0, 1200);
  if (!input.rating || input.rating < 1 || input.rating > 5) {
    return { ok: false, mode: "validation" as const, message: "Please choose a star rating." };
  }
  if (clean.length < 8) {
    return { ok: false, mode: "validation" as const, message: "Please write a short experience before submitting." };
  }
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, message: "Review saved on this device only. Firebase is not connected in this build." };
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const id = `review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const review: AppReview = {
      id,
      userId: user.uid,
      userEmail: user.email ?? null,
      profileName: input.profileName?.trim().slice(0, 120),
      profileLocation: input.profileLocation?.trim().slice(0, 120),
      rating: input.rating,
      experience: clean,
      appVersion: "1.0.0",
      platform: "app",
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(firebase.db, "appReviews", id), { ...review, createdAtServer: serverTimestamp() });
    return { ok: true, mode: "firebase-synced" as const, message: "Thank you. Your review has been submitted.", review };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, message: `Review could not sync yet: ${errorMessage(error)}` };
  }
}

export async function listAppReviews(limitCount = 25) {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const, reviews: [] as AppReview[] };
    const snapshot = await withTimeout(getDocs(query(collection(firebase.db, "appReviews"), orderBy("createdAt", "desc"))));
    return { ok: true, mode: "firebase-synced" as const, reviews: snapshot.docs.slice(0, limitCount).map((item) => item.data() as AppReview) };
  } catch (error) {
    return { ok: false, mode: "local-demo" as const, reviews: [] as AppReview[], error: errorMessage(error) };
  }
}

export async function loadRemoteSubscription() {
  const firebase = getFirebase();
  if (!firebase) return undefined;
  try {
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const snapshot = await getDoc(doc(firebase.db, "users", user.uid));
    return snapshot.exists() ? (snapshot.data().subscription as SubscriptionInfo | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export async function loadRemoteProfile() {
  const firebase = getFirebase();
  if (!firebase) return undefined;
  try {
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const snapshot = await getDoc(doc(firebase.db, "users", user.uid));
    return snapshot.exists() ? (snapshot.data().profile as UserProfile | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export async function loadRemoteCheckIns() {
  const firebase = getFirebase();
  if (!firebase) return undefined;
  try {
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    const snapshot = await getDoc(doc(firebase.db, "users", user.uid));
    return snapshot.exists() ? (snapshot.data().dailyCheckIns as Record<string, DailyCheckIn> | undefined) : undefined;
  } catch {
    return undefined;
  }
}

export async function deleteCloudSnapshot() {
  try {
    const firebase = getFirebase();
    if (!firebase) return { ok: false, mode: "local-demo" as const };
    const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
    await deleteDoc(doc(firebase.db, "users", user.uid));
    return { ok: true, mode: "firebase-deleted" as const, uid: user.uid };
  } catch {
    return { ok: false, mode: "local-demo" as const };
  }
}
