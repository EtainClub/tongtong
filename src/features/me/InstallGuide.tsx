"use client";

import { useState, useSyncExternalStore } from "react";

import { getInstallPrompt, isIos, isStandalone, promptInstall, subscribeInstall } from "@/lib/pwa";

/*
 * 홈 화면에 추가 (로드맵 M7, 4.9). 내 기록의 설정 묶음 안에 둔다 — 첫 화면에 설치를 조르지 않는다.
 * 안드로이드 크롬은 브라우저가 준 설치 제안을 버튼으로, iOS는 Safari 공유 메뉴를 글로 안내한다.
 */

type Mode = "installed" | "prompt" | "ios" | "other";

const subscribeNever = () => () => {};

export function InstallGuide() {
  const prompt = useSyncExternalStore(subscribeInstall, getInstallPrompt, () => null);
  // 브라우저 종류·설치 여부는 서버가 모른다 — 서버 렌더에서는 일반 안내.
  const platform = useSyncExternalStore(
    subscribeNever,
    (): Mode => (isStandalone() ? "installed" : isIos() ? "ios" : "other"),
    (): Mode => "other",
  );
  const [result, setResult] = useState<string | null>(null);
  const mode: Mode = platform === "installed" ? "installed" : prompt ? "prompt" : platform;

  return (
    <details className="mt-2 rounded-card border border-stone p-5">
      <summary className="disclosure text-[16px] font-semibold">홈 화면에 추가</summary>
      <p className="mt-2 text-[15px] text-graphite">
        {mode === "installed"
          ? "홈 화면에서 앱으로 쓰고 있어요."
          : mode === "ios"
            ? "Safari 아래쪽의 공유 버튼(□↑)을 누르고 '홈 화면에 추가'를 고르세요."
            : mode === "prompt"
              ? "앱처럼 홈 화면에서 바로 열 수 있어요. 저장한 카드는 인터넷 없이도 볼 수 있어요."
              : "브라우저 메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 고르세요."}
      </p>
      {mode === "prompt" && (
        <button
          type="button"
          onClick={() => void promptInstall().then((accepted) => setResult(accepted ? "홈 화면에 추가했어요." : "나중에 언제든 다시 할 수 있어요."))}
          className="mt-4 rounded-pill border border-ink px-5 py-2.5"
        >
          홈 화면에 추가
        </button>
      )}
      {result && <p className="mt-2 text-[13px] text-smoke">{result}</p>}
    </details>
  );
}
