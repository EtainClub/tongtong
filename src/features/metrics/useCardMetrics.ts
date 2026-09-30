"use client";

import { useMemo, useRef } from "react";

import type { CardEvent } from "@/lib/metrics/events";
import { track } from "@/lib/metrics/track";

/**
 * 카드 한 번 보기 안에서 같은 이벤트는 한 번만 보낸다 (원자료를 두 번 열어도 클릭률 분자는 1).
 * 판단 값은 받지 않는다 — 이벤트 이름과 카드 id뿐이다.
 */
export function useCardMetrics(cardId: string) {
  const sent = useRef(new Set<string>());
  return useMemo(() => {
    const once = (key: string, send: () => void) => {
      if (sent.current.has(key)) return;
      sent.current.add(key);
      send();
    };
    return {
      event: (event: CardEvent) => once(event, () => track({ event, cardId })),
      game: (correct: boolean | null) => once("game_done", () => track({ event: "game_done", cardId, correct })),
    };
  }, [cardId]);
}
