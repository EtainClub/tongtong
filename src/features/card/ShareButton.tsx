"use client";

import { useState } from "react";

import type { Card } from "@/content/schema";

/**
 * 카드 링크 공유. 판단 값은 싣지 않는다 — 받은 사람도 먼저 판단해 보게 훅과 링크만 보낸다
 * (검토 문서 9장). 공유 시트가 없는 브라우저에서는 링크를 복사한다.
 */
export function ShareButton({ card }: { card: Card }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/card/${card.id}`;
    if (navigator.share) {
      // 공유 시트를 닫은 것(AbortError)은 실패가 아니다.
      await navigator.share({ title: card.shortTitle, text: card.hook, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <button type="button" onClick={() => void share()} className="w-full rounded-pill border border-stone px-6 py-4 hover:border-graphite">
      <span aria-live="polite">{copied ? "링크를 복사했어요" : "친구에게 보내기"}</span>
    </button>
  );
}
