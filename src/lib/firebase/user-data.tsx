"use client";

import { collection, doc, onSnapshot } from "firebase/firestore";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/client";
import type { CardState, Profile } from "@/lib/user-state";

export type UserData = {
  ready: boolean;
  profile: Profile | null;
  states: Map<string, CardState>;
  error: Error | null;
};

const EMPTY: UserData = { ready: false, profile: null, states: new Map(), error: null };
const UserDataContext = createContext<UserData>(EMPTY);

/**
 * 내 프로필과 카드 상태를 실시간으로 읽는다 (설계 47장). 쓰기는 /api/*로만 한다.
 * cardStates 전량을 읽는다 — 사용자당 카드 수백 장 이하라 쿼리보다 싸다 (검토 문서 4.4).
 *
 * 앱 전체가 구독 하나를 나눠 쓴다. 화면마다 따로 구독하면 이동할 때마다 "불러오는 중"이 먼저 그려지고,
 * 피드 카드의 훅이 카드 화면으로 옮겨 가는 장면(ViewTransition)도 짝을 찾지 못한다.
 */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [data, setData] = useState<UserData>(EMPTY);

  useEffect(() => {
    if (!uid) return;
    let profileReady = false;
    let statesReady = false;
    const update = (patch: Partial<UserData>) => setData((prev) => ({ ...prev, ...patch, ready: profileReady && statesReady }));
    const fail = (error: Error) => setData((prev) => ({ ...prev, ready: true, error }));

    const stopProfile = onSnapshot(
      doc(firebaseDb, "users", uid),
      (snapshot) => {
        profileReady = true;
        update({ profile: snapshot.exists() ? (snapshot.data() as Profile) : null });
      },
      fail,
    );
    const stopStates = onSnapshot(
      collection(firebaseDb, "users", uid, "cardStates"),
      (snapshot) => {
        statesReady = true;
        update({ states: new Map(snapshot.docs.map((d) => [d.id, d.data() as CardState])) });
      },
      fail,
    );
    return () => {
      stopProfile();
      stopStates();
      // 계정이 바뀌면(로그아웃·Google 계정 전환) 앞 사람의 기록을 보여 주지 않는다.
      setData(EMPTY);
    };
  }, [uid]);

  return <UserDataContext.Provider value={data}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserData {
  return useContext(UserDataContext);
}
