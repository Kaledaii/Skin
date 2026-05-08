import { DailyCheckIn, SubscriptionInfo, UserProfile } from "../types";
import { getFirebase } from "./firebase";

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

  // Production wiring point: write profile/check-ins/subscription under the authenticated user.
  // Kept as a no-op until Auth and Firestore security rules are configured.
  return {
    ok: true,
    mode: "firebase-ready" as const,
    profileName: payload.profile.name,
    checkInCount: Object.keys(payload.dailyCheckIns).length
  };
}
