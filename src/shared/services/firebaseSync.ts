import { DailyCheckIn, PaymentRequest, SubscriptionInfo, UserProfile } from "../types";
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

export async function ensureAnonymousUser(): Promise<AuthResult> {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo", message: "Firebase is not configured; using local demo mode." };
  const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
  return { ok: true, uid: user.uid, email: user.email, mode: "anonymous", message: "Anonymous account ready." };
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
  const firebase = getFirebase();
  if (!firebase) {
    return { ok: false, mode: "local-demo" as const };
  }

  const credential = firebase.auth.currentUser ? { user: firebase.auth.currentUser } : await firebaseSignInAnonymously(firebase.auth);
  const uid = credential.user.uid;
  await setDoc(
    doc(firebase.db, "users", uid),
    {
      profile: payload.profile,
      subscription: payload.subscription,
      dailyCheckIns: payload.dailyCheckIns,
      paymentRequests: payload.paymentRequests ?? [],
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  return {
    ok: true,
    mode: "firebase-synced" as const,
    uid,
    profileName: payload.profile.name,
    checkInCount: Object.keys(payload.dailyCheckIns).length
  };
}

export async function uploadPaymentScreenshot(uri: string, requestId: string) {
  const firebase = getFirebase();
  if (!firebase || !uri) return undefined;
  const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(firebase.storage, `payment-screenshots/${user.uid}/${requestId}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

export async function savePaymentRequest(request: PaymentRequest) {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const };
  const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
  const next = { ...request, userId: user.uid, userEmail: user.email ?? request.userEmail ?? null };
  await setDoc(doc(firebase.db, "paymentRequests", request.id), { ...next, updatedAt: serverTimestamp() }, { merge: true });
  return { ok: true, mode: "firebase-synced" as const, request: next };
}

export async function listPaymentRequests(status?: PaymentRequest["status"]) {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const, requests: [] as PaymentRequest[] };
  const requestQuery = status
    ? query(collection(firebase.db, "paymentRequests"), where("status", "==", status), orderBy("createdAt", "desc"))
    : query(collection(firebase.db, "paymentRequests"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(requestQuery);
  return { ok: true, mode: "firebase-synced" as const, requests: snapshot.docs.map((item) => item.data() as PaymentRequest) };
}

export async function updatePaymentRequest(request: PaymentRequest) {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const };
  await updateDoc(doc(firebase.db, "paymentRequests", request.id), { ...request, updatedAt: serverTimestamp() });
  return { ok: true, mode: "firebase-synced" as const };
}

export async function updateUserSubscriptionForPayment(request: PaymentRequest, subscription: SubscriptionInfo) {
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
}

export function getCurrentAuthEmail() {
  const firebase = getFirebase();
  return firebase?.auth.currentUser?.email ?? null;
}

export async function submitExpertQuestion(question: string, profileName: string) {
  const clean = question.trim();
  if (!clean) return { ok: false, mode: "validation" as const, message: "Question is required." };
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const, message: "Firebase is not configured; question saved locally later." };
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
}

export async function loadRemoteSubscription() {
  const firebase = getFirebase();
  if (!firebase) return undefined;
  const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
  const snapshot = await getDoc(doc(firebase.db, "users", user.uid));
  return snapshot.exists() ? (snapshot.data().subscription as SubscriptionInfo | undefined) : undefined;
}

export async function deleteCloudSnapshot() {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const };
  const user = firebase.auth.currentUser ?? (await firebaseSignInAnonymously(firebase.auth)).user;
  await deleteDoc(doc(firebase.db, "users", user.uid));
  return { ok: true, mode: "firebase-deleted" as const, uid: user.uid };
}
