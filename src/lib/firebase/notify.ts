"use client";

import { doc, onSnapshot } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { useEffect, useState } from "react";

import { firebaseApp, firebaseDb } from "@/lib/firebase/client";
import { OFF, readSettings, type NotifySettings } from "@/lib/notify";

/*
 * 알림 — 브라우저 쪽 (로드맵 M7-B). 설정은 내 문서를 구독해 읽고, 켤 때 이 기기의 푸시 토큰을 받는다.
 * 쓰기는 /api/notifications.
 */

export type NotifyState = { ready: boolean; settings: NotifySettings; error: Error | null };

export function useNotifySettings(uid: string | undefined): NotifyState {
  const [state, setState] = useState<NotifyState>({ ready: false, settings: OFF, error: null });
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(firebaseDb, "users", uid, "notify", "settings"),
      (snapshot) => {
        setState({ ready: true, settings: readSettings(snapshot.data()), error: null });
      },
      (error) => setState({ ready: true, settings: OFF, error }),
    );
  }, [uid]);
  return state;
}

/** 이 기기에서 알림을 켤 수 없는 까닭. 화면이 그대로 글로 보여 준다. */
export type PushUnavailable = "unsupported" | "ios-browser" | "no-service-worker" | "denied";

export const PUSH_UNAVAILABLE_TEXT: Record<PushUnavailable, string> = {
  unsupported: "이 브라우저에서는 알림을 받을 수 없어요.",
  "ios-browser": "iPhone·iPad는 Safari에서 홈 화면에 추가한 뒤, 홈 화면의 통통에서 알림을 켤 수 있어요.",
  "no-service-worker": "알림은 운영 사이트(tt.jamtong.kr)에서만 켤 수 있어요.",
  denied: "브라우저에서 이 사이트의 알림을 막아 두었어요. 브라우저 설정에서 허용한 뒤 다시 켜 주세요.",
};

/**
 * 권한을 묻고 이 기기의 푸시 토큰을 받는다. 서비스 워커는 이미 등록된 /sw.js를 쓴다 — Firebase의 별도 워커를 두지 않는다.
 * 켤 수 없으면 까닭을 돌려준다.
 */
export async function requestPushToken(): Promise<{ token: string } | { unavailable: PushUnavailable }> {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (!(await isSupported()) || !("Notification" in window)) return { unavailable: ios ? "ios-browser" : "unsupported" };
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return { unavailable: "no-service-worker" };
  const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { unavailable: "denied" };
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
  const token = await getToken(getMessaging(firebaseApp), { vapidKey, serviceWorkerRegistration: await navigator.serviceWorker.ready });
  return { token };
}
