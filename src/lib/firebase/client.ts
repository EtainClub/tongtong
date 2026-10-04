"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 설정이 빠진 채 빌드되면 조용히 망가지지 않고 바로 알린다 (잼통이 배포본에서 한 번 겪었다).
const required = ["apiKey", "authDomain", "projectId", "appId"] as const;
for (const key of required) {
  if (!config[key]) throw new Error(`missing Firebase client configuration: NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, (l) => `_${l}`).toUpperCase()}`);
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(config);
export const firebaseAuth = getAuth(firebaseApp);

/**
 * 브라우저에서는 내 문서(프로필·카드 상태·청사진)를 기기(IndexedDB)에 캐시한다 — 오프라인에서도 저장한 카드와
 * 내 기록을 읽는다 (로드맵 M7). 쓰기는 늘 /api라 오프라인에서는 하지 않는다.
 * 서버 렌더에는 IndexedDB가 없어 기본값을 쓴다. 개발 중 모듈이 다시 읽히면 이미 초기화돼 있다 — 그때는 있는 것을 쓴다.
 */
function createDb(): Firestore {
  if (typeof window === "undefined") return getFirestore(firebaseApp);
  try {
    return initializeFirestore(firebaseApp, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    return getFirestore(firebaseApp);
  }
}
export const firebaseDb = createDb();

export const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let emulatorConnected = false;
export function connectFirebaseEmulators() {
  if (emulatorConnected || !useEmulators) return;
  connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(firebaseDb, "127.0.0.1", 8080);
  emulatorConnected = true;
}

/** 사이트 키가 있을 때만 켠다. 서버 쪽 강제는 APPCHECK_ENFORCE (lib/guard/identity). */
let appCheck: AppCheck | null | undefined;
export function firebaseAppCheck(): AppCheck | null {
  if (appCheck !== undefined) return appCheck;
  const siteKey = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY;
  appCheck =
    siteKey && !useEmulators
      ? initializeAppCheck(firebaseApp, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true })
      : null;
  return appCheck;
}
