"use client";

import { useEffect, useSyncExternalStore } from "react";

import { useUserData } from "@/lib/firebase/user-data";
import { captureInstallPrompt } from "@/lib/pwa";

/*
 * 서비스 워커와 오프라인 띠 (로드맵 M7).
 *
 * 서비스 워커는 운영 빌드에서만 등록한다 — 개발 서버는 파일이 수시로 바뀌어 캐시가 방해가 된다.
 * 저장한 카드가 바뀔 때마다 그 카드 화면과 저장·내 기록 화면을 미리 담게 한다 — 비행기 모드에서도 연다.
 */
export function Pwa() {
  const data = useUserData();
  const offline = useOffline();

  useEffect(() => {
    captureInstallPrompt();
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => console.error("서비스 워커 등록 실패", error));
  }, []);

  const saved = [...data.states.values()]
    .filter((state) => state.saved)
    .map((state) => state.cardId)
    .sort()
    .join(",");
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !data.ready || !data.profile || !("serviceWorker" in navigator)) return;
    const paths = ["/", "/saved", "/me", ...saved.split(",").filter(Boolean).map((id) => `/card/${id}`)];
    void navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: "precache", paths }));
  }, [data.ready, data.profile, saved]);

  if (!offline) return null;
  return (
    <p role="status" className="fixed inset-x-0 top-0 z-50 bg-ink px-5 py-2 text-center text-[13px] text-eggshell">
      오프라인이에요 — 저장한 카드와 내 기록은 볼 수 있고, 판단은 연결되면 남길 수 있어요.
    </p>
  );
}

function subscribeConnection(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** 브라우저가 알려 주는 연결 상태. 서버 렌더에서는 "연결됨". */
function useOffline() {
  return useSyncExternalStore(
    subscribeConnection,
    () => !navigator.onLine,
    () => false,
  );
}
