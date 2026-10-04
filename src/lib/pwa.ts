"use client";

/*
 * 설치·오프라인 상태 (로드맵 M7). 화면이 구독하는 작은 저장소 — 서비스 워커 등록과 설치 안내가 같이 쓴다.
 */

/** 안드로이드 크롬이 주는 설치 제안. 표준 타입이 아직 없어 필요한 만큼만 적는다. */
export type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

let capturing = false;

/** 앱이 뜰 때 한 번 — 브라우저가 설치 제안을 일찍 보내므로 놓치지 않게 잡아 둔다. */
export function captureInstallPrompt() {
  if (capturing) return;
  capturing = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPrompt;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getInstallPrompt = () => deferred;

/** 설치 제안을 띄운다. 한 번 쓰면 브라우저가 다시 주기 전까지 없다. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const prompt = deferred;
  deferred = null;
  notify();
  await prompt.prompt();
  return (await prompt.userChoice).outcome === "accepted";
}

/** 홈 화면에서 앱으로 열었는가 (설치됨). */
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** iOS — 설치 제안이 없고 Safari의 공유 → 홈 화면에 추가로만 설치한다. */
export const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
