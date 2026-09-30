import { describe, expect, it } from "vitest";

import type { JudgmentInput } from "./judgment";
import { applyCardAction, applyJudgment, JudgmentRejection, MAX_JUDGMENTS_PER_CARD, withoutOpinions, type CardState } from "./user-state";

const now = new Date("2026-09-29T12:00:00+09:00");
const ctx = { currentVersion: 1, flow: { trust: true, opinion: true }, consented: true, reasonIds: ["too-narrow", "helps"], now };
const base = { cardId: "c", cardVersion: 1, sessionId: "session-0001" } as const;

const trust: JudgmentInput = { ...base, axis: "trust", phase: "initial", value: 2 };
const accuracy: JudgmentInput = { ...base, axis: "hookAccuracy", phase: "final", value: "exaggerated" };
const opinion: JudgmentInput = { ...base, axis: "opinion", phase: "final", value: 4, reasonCodes: [] };

function rejects(fn: () => unknown, code: JudgmentRejection["code"]) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(JudgmentRejection);
    expect((error as JudgmentRejection).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
}

describe("applyJudgment", () => {
  it("판단을 덮어쓰지 않고 쌓는다", () => {
    const a = applyJudgment(null, trust, ctx).state;
    const b = applyJudgment(a, accuracy, ctx).state;
    const c = applyJudgment(b, opinion, ctx).state;
    expect(c.judgments.map((j) => j.axis)).toEqual(["trust", "hookAccuracy", "opinion"]);
    expect(c.judgments[0]).toMatchObject({ value: 2, cardVersion: 1, at: now.toISOString() });
    expect(c.judgments[0]).not.toHaveProperty("cardId");
  });

  it("같은 세션·단계·축은 한 번만 기록한다 (재시도 멱등)", () => {
    const first = applyJudgment(null, trust, ctx);
    const retry = applyJudgment(first.state, { ...trust, value: 5 }, ctx);
    expect(retry.duplicate).toBe(true);
    expect(retry.state.judgments).toHaveLength(1);
    expect(retry.state.judgments[0].value).toBe(2);
  });

  it("다른 세션이면 같은 축도 새로 쌓인다", () => {
    const first = applyJudgment(null, trust, ctx).state;
    const second = applyJudgment(first, { ...trust, sessionId: "session-0002", value: 4 }, ctx).state;
    expect(second.judgments.map((j) => j.value)).toEqual([2, 4]);
  });

  it("옛 카드 버전의 판단은 받지 않는다", () => {
    rejects(() => applyJudgment(null, { ...trust, cardVersion: 1 }, { ...ctx, currentVersion: 2 }), "stale-version");
  });

  it("카드가 묻지 않는 축은 받지 않는다", () => {
    rejects(() => applyJudgment(null, trust, { ...ctx, flow: { trust: false, opinion: true } }), "axis-disabled");
    rejects(() => applyJudgment(null, opinion, { ...ctx, flow: { trust: true, opinion: false } }), "axis-disabled");
  });

  it("이유는 카드의 목록에 있는 것만, 한 번씩만 받는다", () => {
    expect(applyJudgment(null, { ...opinion, reasonCodes: ["too-narrow", "helps"] }, ctx).state.judgments[0]).toMatchObject({ reasonCodes: ["too-narrow", "helps"] });
    rejects(() => applyJudgment(null, { ...opinion, reasonCodes: ["made-up"] }, ctx), "unknown-reason");
    rejects(() => applyJudgment(null, { ...opinion, reasonCodes: ["helps", "helps"] }, ctx), "unknown-reason");
  });

  it("정책 평가는 동의 없이 저장하지 않는다", () => {
    rejects(() => applyJudgment(null, opinion, { ...ctx, consented: false }), "consent-required");
    // 사실 신뢰는 동의와 무관하다
    expect(applyJudgment(null, trust, { ...ctx, consented: false }).state.judgments).toHaveLength(1);
  });

  it("최종 평가 없이 재평가할 수 없다", () => {
    const revisit: JudgmentInput = { ...base, sessionId: "session-0002", axis: "opinion", phase: "revisit", value: 3, reasonCodes: [] };
    rejects(() => applyJudgment(null, revisit, ctx), "no-final-yet");
    const done = applyJudgment(null, opinion, ctx).state;
    expect(applyJudgment(done, revisit, ctx).state.judgments).toHaveLength(2);
  });

  it("카드의 마지막 판단이 들어오면 완료로 표시한다", () => {
    const afterTrust = applyJudgment(null, trust, ctx).state;
    expect(afterTrust.completedAt).toBeNull();
    expect(applyJudgment(afterTrust, opinion, ctx).state.completedAt).toBe(now.toISOString());
    // 정책 평가가 없는 카드는 훅 정확도가 마지막이다
    const noOpinion = { ...ctx, flow: { trust: true, opinion: false } };
    expect(applyJudgment(afterTrust, accuracy, noOpinion).state.completedAt).toBe(now.toISOString());
  });

  it("상한을 넘기지 않는다", () => {
    const full: CardState = {
      ...applyJudgment(null, trust, ctx).state,
      judgments: Array.from({ length: MAX_JUDGMENTS_PER_CARD }, (_, i) => ({ ...trust, sessionId: `s-${i}-padding`, at: now.toISOString() })),
    };
    rejects(() => applyJudgment(full, { ...trust, sessionId: "session-new" }, ctx), "too-many");
  });
});

describe("applyCardAction", () => {
  it("저장·취소·넘기기·완료", () => {
    const saved = applyCardAction(null, "c", "save", 3, now);
    expect(saved).toMatchObject({ saved: true, lastSeenVersion: 3 });
    expect(applyCardAction(saved, "c", "unsave", 3, now).saved).toBe(false);
    expect(applyCardAction(saved, "c", "pass", 3, now).passedAt).toBe(now.toISOString());
    const done = applyCardAction(saved, "c", "complete", 3, now);
    const later = applyCardAction(done, "c", "complete", 3, new Date("2027-01-01T00:00:00Z"));
    expect(later.completedAt).toBe(now.toISOString()); // 처음 완료 시각을 지킨다
  });
});

describe("withoutOpinions", () => {
  it("정책 평가만 지우고 사실 신뢰는 남긴다", () => {
    const state = applyJudgment(applyJudgment(null, trust, ctx).state, opinion, ctx).state;
    expect(withoutOpinions(state).judgments.map((j) => j.axis)).toEqual(["trust"]);
  });
});
