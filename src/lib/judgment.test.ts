import { describe, expect, it } from "vitest";

import { compare, judgmentInput } from "./judgment";

const base = { cardId: "youth-monthly-rent", cardVersion: 1, sessionId: "session-0001" };

describe("judgmentInput", () => {
  it("축과 단계의 올바른 조합을 받는다", () => {
    expect(judgmentInput.safeParse({ ...base, axis: "trust", phase: "initial", value: 4 }).success).toBe(true);
    expect(judgmentInput.safeParse({ ...base, axis: "trust", phase: "initial", value: null }).success).toBe(true);
    expect(judgmentInput.safeParse({ ...base, axis: "hookAccuracy", phase: "final", value: "exaggerated" }).success).toBe(true);
    expect(judgmentInput.safeParse({ ...base, axis: "opinion", phase: "revisit", value: 2 }).success).toBe(true);
  });

  it("잘못된 조합과 범위 밖 값을 막는다", () => {
    // 첫 판단에서 정책 평가를 묻지 않는다 — 아무것도 모르는 상태의 찬반은 소음이다
    expect(judgmentInput.safeParse({ ...base, axis: "opinion", phase: "initial", value: 3 }).success).toBe(false);
    expect(judgmentInput.safeParse({ ...base, axis: "trust", phase: "final", value: 3 }).success).toBe(false);
    expect(judgmentInput.safeParse({ ...base, axis: "trust", phase: "initial", value: 6 }).success).toBe(false);
    expect(judgmentInput.safeParse({ ...base, axis: "trust", phase: "initial", value: 0 }).success).toBe(false);
    expect(judgmentInput.safeParse({ ...base, axis: "hookAccuracy", phase: "final", value: 3 }).success).toBe(false);
  });

  it("카드 버전 없이는 기록하지 않는다", () => {
    const { cardVersion: _omit, ...noVersion } = base;
    void _omit;
    expect(judgmentInput.safeParse({ ...noVersion, axis: "trust", phase: "initial", value: 4 }).success).toBe(false);
  });
});

describe("compare", () => {
  it("모르겠음이 끼면 비교하지 않는다", () => {
    expect(compare(null, 4).kind).toBe("incomparable");
    expect(compare(3, null).kind).toBe("incomparable");
  });

  it("같으면 same, 다르면 moved — 부호나 점수를 만들지 않는다", () => {
    expect(compare(3, 3)).toEqual({ kind: "same", value: 3 });
    expect(compare(2, 4)).toEqual({ kind: "moved", before: 2, after: 4 });
  });
});
