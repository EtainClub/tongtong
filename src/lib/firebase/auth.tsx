"use client";

import type { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, onIdTokenChanged, signInAnonymously, signInWithCredential, signOut, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { connectFirebaseEmulators, firebaseAuth } from "@/lib/firebase/client";

type AuthState = { user: User | null; ready: boolean; error: Error | null };
const AuthContext = createContext<AuthState>({ user: null, ready: false, error: null });

/**
 * 모든 방문자는 익명 계정을 받는다 — 로그인 없이 판단을 기록할 수 있어야 한다 (설계 4.1).
 * Google을 연결하면 uid가 유지되어 기록이 그대로 이어진다 (linkGoogle).
 * 토큰 변화까지 지켜본다 — 익명 계정이 Google에 연결되는 것도 화면이 따라가야 한다.
 */
export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false, error: null });
  useEffect(() => {
    connectFirebaseEmulators();
    return onIdTokenChanged(firebaseAuth, async (user) => {
      try {
        const resolved = user ?? (await signInAnonymously(firebaseAuth)).user;
        setState({ user: resolved, ready: true, error: null });
      } catch (error) {
        setState({ user: null, ready: true, error: error instanceof Error ? error : new Error("anonymous-auth-failed") });
      }
    });
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * 익명 계정을 Google에 연결한다 (임통 signInWithGoogle과 같은 방식).
 *
 * 그 Google 계정이 이미 통통 계정이면 연결할 수 없다 — 두 기록을 합치지 않는다.
 * 그때는 confirmSwitch에 물어 그 계정으로 옮기거나 그만둔다. 옮기면 지금 익명 계정의 기록은 남겨 두고 간다.
 */
export async function linkGoogle(confirmSwitch: () => boolean): Promise<"linked" | "switched" | "cancelled"> {
  const current = firebaseAuth.currentUser;
  if (!current) throw new Error("not-signed-in");
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(current, provider);
    await current.getIdToken(true);
    return "linked";
  } catch (error) {
    if ((error as FirebaseError).code !== "auth/credential-already-in-use") throw error;
    const credential = GoogleAuthProvider.credentialFromError(error as FirebaseError);
    if (!credential || !confirmSwitch()) return "cancelled";
    await signInWithCredential(firebaseAuth, credential);
    return "switched";
  }
}

/** 로그아웃하면 곧바로 새 익명 계정을 받는다 (AuthProvider). Google 계정의 기록은 그대로 남는다. */
export async function signOutToAnonymous() {
  await signOut(firebaseAuth);
}
