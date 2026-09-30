import { describe, expect, it } from "vitest";

import { CARDS } from "@/content/cards";

import { askCacheKey, normalizeQuestion } from "./cache-key";

const card = CARDS.find((c) => c.suggestedQuestions.length > 0)!;
const suggested = card.suggestedQuestions[0];

describe("askCacheKey", () => {
  it("추천 질문만 캐시한다 — 띄어쓰기·물음표 차이는 같은 질문", () => {
    expect(askCacheKey(card, suggested)).toMatch(/^[0-9a-f]{32}$/);
    expect(askCacheKey(card, `  ${suggested.replace(/[?？]$/, "")}  ?`)).toBe(askCacheKey(card, suggested));
    expect(askCacheKey(card, "저는 35살인데 받을 수 있나요?")).toBeNull();
  });

  it("카드 버전이 바뀌면 열쇠도 바뀐다", () => {
    const next = { ...card, revisions: [...card.revisions, { ...card.revisions[0], version: card.revisions.length + 1 }] };
    expect(askCacheKey(next, suggested)).not.toBe(askCacheKey(card, suggested));
  });

  it("normalizeQuestion", () => {
    expect(normalizeQuestion("  나도   받을 수 있어?? ")).toBe("나도 받을 수 있어");
  });
});
