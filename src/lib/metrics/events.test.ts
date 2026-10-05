import { describe, expect, it } from "vitest";

import { metricEventSchema } from "./events";

describe("metricEventSchema", () => {
  it("정해진 모양만 받는다", () => {
    expect(metricEventSchema.safeParse({ event: "visit", first: true }).success).toBe(true);
    expect(metricEventSchema.safeParse({ event: "card_open", cardId: "youth-job-leap" }).success).toBe(true);
    expect(metricEventSchema.safeParse({ event: "game_done", cardId: "youth-job-leap", correct: null }).success).toBe(true);
    expect(metricEventSchema.safeParse({ event: "returned", cohort: "2026-09-30" }).success).toBe(true);
    expect(metricEventSchema.safeParse({ event: "made_up", cardId: "x" }).success).toBe(false);
  });

  it("빈칸 요청은 정해진 역할 하나만 — 글·사용자 id는 실을 수 없다", () => {
    expect(metricEventSchema.safeParse({ event: "gap_request", role: "housing" }).success).toBe(true);
    expect(metricEventSchema.safeParse({ event: "gap_request", role: "made-up" }).success).toBe(false);
    expect(metricEventSchema.safeParse({ event: "gap_request", role: "housing", text: "전세 대출" }).success).toBe(false);
    expect(metricEventSchema.safeParse({ event: "gap_request", role: "housing", uid: "abc" }).success).toBe(false);
  });

  it("판단 값·이유·생활 상황·사용자 id는 실을 수 없다", () => {
    for (const extra of [{ value: 4 }, { reasonCodes: ["helps"] }, { lifeStages: ["college"] }, { uid: "abc" }]) {
      expect(metricEventSchema.safeParse({ event: "final_done", cardId: "youth-job-leap", ...extra }).success).toBe(false);
      expect(metricEventSchema.safeParse({ event: "visit", first: false, ...extra }).success).toBe(false);
    }
  });
});
