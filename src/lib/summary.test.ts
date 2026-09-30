import { describe, expect, it } from "vitest";

import { CARDS } from "@/content/cards";
import { Category } from "@/content/schema";

import { summarize } from "./summary";
import { emptyCardState, type CardState } from "./user-state";

const at = "2026-09-30T00:00:00.000Z";
const opinion = (phase: "final" | "revisit") => ({ axis: "opinion" as const, phase, value: 3 as const, cardVersion: 1, sessionId: `session-${phase}1`, reasonCodes: [], at });

describe("summarize", () => {
  it("따져본·저장한·다시 판단한 카드와 주제별 수를 센다", () => {
    const [a, b, c] = CARDS;
    const states = new Map<string, CardState>([
      [a.id, { ...emptyCardState(a.id), completedAt: at, saved: true, judgments: [opinion("final"), opinion("revisit")] }],
      [b.id, { ...emptyCardState(b.id), completedAt: at }],
      [c.id, { ...emptyCardState(c.id), saved: true }],
    ]);
    const summary = summarize(CARDS, states, Category.options);
    expect(summary).toMatchObject({ completed: 2, saved: 2, revisited: 1 });
    expect(summary.byTopic.reduce((s, t) => s + t.count, 0)).toBe(2);
    expect(summary.byTopic.every((t) => t.count > 0)).toBe(true);
  });

  it("상태 문서가 없는 카드는 세지 않는다", () => {
    expect(summarize(CARDS, new Map(), Category.options)).toEqual({ completed: 0, saved: 0, revisited: 0, byTopic: [] });
  });
});
