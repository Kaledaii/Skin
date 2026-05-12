import { DailyCheckIn, SubscriptionInfo, UserProfile } from "../types";
import { getFirebase } from "./firebase";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

export type SyncPayload = {
  profile: UserProfile;
  subscription: SubscriptionInfo;
  dailyCheckIns: Record<string, DailyCheckIn>;
};

export async function syncUserSnapshot(payload: SyncPayload) {
  const firebase = getFirebase();
  if (!firebase) {
    return { ok: false, mode: "local-demo" as const };
  }

  const credential = firebase.auth.currentUser ? { user: firebase.auth.currentUser } : await signInAnonymously(firebase.auth);
  const uid = credential.user.uid;
  await setDoc(
    doc(firebase.db, "users", uid),
    {
      profile: payload.profile,
      subscription: payload.subscription,
      dailyCheckIns: payload.dailyCheckIns,
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

export async function deleteCloudSnapshot() {
  const firebase = getFirebase();
  if (!firebase) return { ok: false, mode: "local-demo" as const };
  const user = firebase.auth.currentUser ?? (await signInAnonymously(firebase.auth)).user;
  await deleteDoc(doc(firebase.db, "users", user.uid));
  return { ok: true, mode: "firebase-deleted" as const, uid: user.uid };
}
