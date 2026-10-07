import { describe, expect, it } from "vitest";

import { buildReport, reportDates, topRegionalPolicies, type DailyDoc } from "./report";

describe("buildReport", () => {
  it("여섯 지표를 합계에서 계산한다", () => {
    const docs: DailyDoc[] = [
      { date: "2026-10-01", visits: { first: 3, return: 1 }, cards: { a: { card_open: 4, trust_done: 3, reveal_reached: 2, source_open: 1, final_done: 2, game_correct: 1, game_wrong: 1, game_open: 5 } } },
      { date: "2026-10-02", cards: { b: { card_open: 2, final_done: 1, revisit_open: 2, revisit_done: 1 } } },
    ];
    const report = buildReport(docs, [{ date: "2026-08-20", visits: { first: 10 }, returned30: 4 }], "2026-10-02");
    expect(report.firstJudgment).toEqual({ numerator: 3, denominator: 6, rate: 0.5 });
    expect(report.gameCorrect.rate).toBe(0.5); // 정답이 없는 게임(game_open)은 빼고
    expect(report.sourceClick.rate).toBe(0.5);
    expect(report.finalJudgment.rate).toBe(0.5);
    expect(report.return30.rate).toBe(0.4);
    expect(report.revisitResponse.rate).toBe(0.5);
    expect(report.perCard.a.open).toBe(4);
    expect(report.visits).toEqual({ first: 3, return: 1 });
  });

  it("사실을 먼저 보고 연 카드는 첫 판단 분모에서 뺀다", () => {
    const docs: DailyDoc[] = [{ date: "2026-10-01", cards: { a: { card_open: 5, card_open_informed: 1, trust_done: 2, final_done: 4 } } }];
    const report = buildReport(docs, [], "2026-10-01");
    expect(report.firstJudgment).toEqual({ numerator: 2, denominator: 4, rate: 0.5 });
    expect(report.perCard.a.firstJudgment.denominator).toBe(4);
    expect(report.finalJudgment.denominator).toBe(5); // 최종 판단은 그대로 묻는다
  });

  it("빈칸 요청은 역할별로 기간 합계", () => {
    const docs: DailyDoc[] = [
      { date: "2026-10-01", gaps: { housing: 2, funding: 1 } },
      { date: "2026-10-02", gaps: { housing: 1 } },
    ];
    expect(buildReport(docs, [], "2026-10-02").gaps).toEqual({ housing: 3, funding: 1 });
    expect(buildReport([], [], "2026-10-02").gaps).toEqual({});
  });

  it("지역 목록 열람과 정책별 원문 열기는 기간 합계", () => {
    expect(buildReport([{ date: "2026-10-01", regionalOpen: 3 }, { date: "2026-10-02" }], [], "2026-10-02").regionalOpen).toBe(3);
    const top = topRegionalPolicies([{ policies: { a: 1, b: 2 } }, { policies: { a: 3, c: 1 } }, {}], 2);
    expect(top).toEqual([["a", 4], ["b", 2]]);
  });

  it("분모가 0이면 비율을 만들지 않는다", () => {
    expect(buildReport([], [], "2026-10-01").firstJudgment.rate).toBeNull();
  });

  it("코호트는 30일을 다 채운 날만", () => {
    const { cohorts } = reportDates("2026-10-01", 7);
    expect(cohorts[0]).toBe("2026-08-31");
    expect(cohorts).toHaveLength(30);
  });
});
