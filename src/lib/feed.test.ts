import { describe, expect, it } from "vitest";

import { CARDS } from "@/content/cards";

import { orderFeed } from "./feed";
import { emptyCardState, type CardState } from "./user-state";

const now = new Date("2026-09-29T12:00:00+09:00");
const ids = (cards: { id: string }[]) => cards.map((c) => c.id);
const ADULT_CARDS = CARDS.filter((card) => card.audience.includes("young_adult"));
const states = (entries: [string, Partial<CardState>][]) =>
  new Map(entries.map(([id, patch]) => [id, { ...emptyCardState(id), ...patch }]));

describe("orderFeed", () => {
  it("생활 상황이 많이 겹치는 카드가 앞에 온다", () => {
    const housing = orderFeed(CARDS, { audienceType: "young_adult", lifeStages: ["living_alone", "housing"] }, new Map(), now);
    expect(housing[0].id).toBe("youth-monthly-rent");
    expect(housing).toHaveLength(ADULT_CARDS.length);
  });

  // 카드 데이터가 바뀌어도 규칙을 시험하도록 조건을 직접 만든다.
  const base = CARDS[0];
  const card = (id: string, applications: { startAt: string; endAt: string }[]) => ({
    ...base,
    id,
    lifeStages: ["living_alone" as const],
    policy: { ...base.policy, applications: applications.map((a) => ({ ...a, label: "회차", sourceIds: [] })) },
  });
  const closed = { startAt: "2026-03-01T09:00:00+09:00", endAt: "2026-05-01T18:00:00+09:00" };
  const open = { startAt: "2026-09-01T09:00:00+09:00", endAt: "2026-10-31T18:00:00+09:00" };
  const profile = { audienceType: "young_adult" as const, lifeStages: ["living_alone" as const] };

  it("겹침이 같으면 신청이 마감된 카드가 뒤로 간다", () => {
    const result = orderFeed([card("a-closed", [closed]), card("b-open", [open]), card("c-always", [])], profile, new Map(), now);
    expect(ids(result)).toEqual(["b-open", "c-always", "a-closed"]);
  });

  it("관련도가 신청 상태보다 먼저다", () => {
    const unrelated = { ...card("b-open", [open]), lifeStages: [] };
    expect(ids(orderFeed([unrelated, card("a-closed", [closed])], profile, new Map(), now))).toEqual(["a-closed", "b-open"]);
  });

  it("겹침과 신청 상태가 같으면 편집 순서를 지킨다", () => {
    const result = orderFeed([card("z", []), card("y", []), card("x", [])], profile, new Map(), now);
    expect(ids(result)).toEqual(["z", "y", "x"]);
  });

  it("관심 주제도 관련도에 더한다", () => {
    const culture = { ...card("b-culture", []), category: "culture" as const, lifeStages: [] };
    const housing = { ...card("a-housing", []), category: "housing" as const, lifeStages: [] };
    const result = orderFeed([housing, culture], { audienceType: "young_adult", lifeStages: [], interests: ["culture"] }, new Map(), now);
    expect(ids(result)).toEqual(["b-culture", "a-housing"]);
  });

  it("완료한 카드와 30일 안에 넘긴 카드는 빠진다", () => {
    const result = orderFeed(
      CARDS,
      { audienceType: "young_adult", lifeStages: [] },
      states([
        ["young-future-savings", { completedAt: now.toISOString() }],
        ["youth-monthly-rent", { passedAt: new Date(now.getTime() - 29 * 86_400_000).toISOString() }],
      ]),
      now,
    );
    expect(ids(result)).not.toContain("young-future-savings");
    expect(ids(result)).not.toContain("youth-monthly-rent");
    expect(result).toHaveLength(ADULT_CARDS.length - 2);
  });

  it("넘긴 지 30일이 지나면 다시 보인다", () => {
    const result = orderFeed(
      CARDS,
      { audienceType: "young_adult", lifeStages: [] },
      states([["youth-monthly-rent", { passedAt: new Date(now.getTime() - 31 * 86_400_000).toISOString() }]]),
      now,
    );
    expect(ids(result)).toContain("youth-monthly-rent");
  });

  it("다른 트랙의 카드는 보이지 않는다", () => {
    const teen = orderFeed(CARDS, { audienceType: "youth", lifeStages: [] }, new Map(), now);
    expect(teen.length).toBeGreaterThan(0);
    expect(teen.every((card) => card.audience.includes("youth"))).toBe(true);
    expect(ADULT_CARDS.some((card) => teen.includes(card))).toBe(false);
  });

  it("판단 값은 순서에 영향을 주지 않는다", () => {
    const profile = { audienceType: "young_adult" as const, lifeStages: [] };
    const judged = states([
      ["youth-job-leap", { judgments: [{ axis: "opinion", phase: "final", value: 5, cardVersion: 1, sessionId: "session-0001", reasonCodes: [], at: now.toISOString() }] }],
    ]);
    expect(ids(orderFeed(CARDS, profile, judged, now))).toEqual(ids(orderFeed(CARDS, profile, new Map(), now)));
  });
});
