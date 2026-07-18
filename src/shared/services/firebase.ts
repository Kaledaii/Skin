import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import type { FirebaseApp } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getRemoteConfig } from "firebase/remote-config";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

declare const require: (moduleName: string) => any;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export function getFirebase() {
  if (!firebaseReady) return null;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return {
    app,
    auth: getFirebaseAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    remoteConfig: getRemoteConfig(app)
  };
}

function getFirebaseAuth(app: FirebaseApp): Auth {
  if (Platform.OS === "web") return FirebaseAuth.getAuth(app);
  try {
    const rnAuth = require("@firebase/auth") as {
      initializeAuth?: typeof FirebaseAuth.initializeAuth;
      getReactNativePersistence?: (storage: typeof ReactNativeAsyncStorage) => unknown;
    };
    const initializeAuth = rnAuth.initializeAuth ?? FirebaseAuth.initializeAuth;
    const getReactNativePersistence = rnAuth.getReactNativePersistence;
    if (!getReactNativePersistence) return FirebaseAuth.getAuth(app);
    return initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) as never });
  } catch {
    return FirebaseAuth.getAuth(app);
  }
}
