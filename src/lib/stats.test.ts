import { describe, expect, it } from "vitest";

import { aggregate, MIN_PUBLIC } from "./stats";
import { emptyCardState, type CardState, type StoredJudgment } from "./user-state";

const at = "2026-09-29T00:00:00.000Z";
const j = (axis: "trust" | "opinion", value: 1 | 2 | 3 | 4 | 5 | null, phase: "initial" | "final" | "revisit"): StoredJudgment =>
  ({ axis, phase, value, cardVersion: 1, sessionId: `s-${Math.random()}`, reasonCodes: [], at }) as StoredJudgment;

function users(n: number, make: (i: number) => StoredJudgment[], cardId = "c"): CardState[] {
  return Array.from({ length: n }, (_, i) => ({ ...emptyCardState(cardId), judgments: make(i) }));
}

describe("aggregate", () => {
  it("응답이 기준 미만인 축은 분포를 쓰지 않는다", () => {
    const [stat] = aggregate(["c"], users(MIN_PUBLIC - 1, () => [j("trust", 4, "initial")]));
    expect(stat.trust).toBeNull();
  });

  it("기준 이상이면 분포를 쓴다. 모르겠음은 따로 센다", () => {
    const [stat] = aggregate(["c"], users(MIN_PUBLIC, (i) => [j("trust", i % 2 ? 4 : null, "initial")]));
    expect(stat.trust).toEqual({ n: MIN_PUBLIC, distribution: { "1": 0, "2": 0, "3": 0, "4": 15, "5": 0, unknown: 15 } });
  });

  it("한 사람은 한 표 — 재평가하면 가장 최근 값으로 옮겨 간다", () => {
    const [stat] = aggregate(["c"], users(MIN_PUBLIC, () => [j("opinion", 2, "final"), j("opinion", 5, "revisit")]));
    expect(stat.opinion?.distribution["5"]).toBe(MIN_PUBLIC);
    expect(stat.opinion?.distribution["2"]).toBe(0);
  });

  it("응답이 없는 카드도 빈 문서를 만든다 — 지난 집계가 남지 않게", () => {
    expect(aggregate(["c", "empty"], [])).toEqual([
      { cardId: "c", trust: null, hookAccuracy: null, opinion: null },
      { cardId: "empty", trust: null, hookAccuracy: null, opinion: null },
    ]);
  });

  it("목록에 없는 카드(내려간 카드)의 상태는 무시한다", () => {
    expect(aggregate(["c"], users(MIN_PUBLIC, () => [j("trust", 3, "initial")], "gone"))[0].trust).toBeNull();
  });
});
