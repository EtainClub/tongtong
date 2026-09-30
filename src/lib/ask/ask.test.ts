import { beforeEach, describe, expect, it } from "vitest";

import { findCard } from "@/content/cards";
import { Refusal } from "@/lib/guard/refusal";

import { buildCardContext, buildTopicIndex, isOnTopic, sanitizeAnswer } from "./grounding";
import { resetLimits, takeDailyBudget, takeRate } from "./limits";

const rent = findCard("youth-monthly-rent")!;
const now = new Date("2026-09-29T12:00:00+09:00");

describe("isOnTopic", () => {
  const index = buildTopicIndex(rent);

  it("카드에 나오는 말이나 정책 질문은 통과시킨다", () => {
    expect(isOnTopic("보증금이 높으면 안 돼?", index)).toBe(true);
    expect(isOnTopic("월세가 15만원이면?", index)).toBe(true); // 조사가 붙어도
    expect(isOnTopic("나도 받을 수 있어?", index)).toBe(true);
  });

  it("카드와 무관한 말로만 된 질문은 막는다", () => {
    expect(isOnTopic("오늘 날씨 좋다", index)).toBe(false);
    expect(isOnTopic("주식 추천해줘", index)).toBe(false);
  });
});

describe("sanitizeAnswer", () => {
  it("목록에 없는 claim id를 버린다", () => {
    const result = sanitizeAnswer(rent, { grounded: true, answer: " 답 ", claimIds: ["amount", "made-up", "amount"] });
    expect(result).toEqual({ grounded: true, answer: "답", claimIds: ["amount"] });
  });

  it("근거를 하나도 대지 못하면 grounded를 거둔다", () => {
    expect(sanitizeAnswer(rent, { grounded: true, answer: "답", claimIds: ["made-up"] })).toMatchObject({ grounded: false, claimIds: [] });
  });
});

describe("buildCardContext", () => {
  const context = buildCardContext(rent, now);

  it("오늘 날짜와 날짜로 계산한 신청 상태를 넣는다", () => {
    expect(context).toContain("2026년 9월 29일");
    expect(context).toContain("신청 마감");
  });

  it("claim마다 id·검증 상태·해석 표식을 붙인다", () => {
    expect(context).toContain("- amount: ");
    expect(context).not.toContain("[검증 전]");
    const unverified = { ...rent, claims: rent.claims.map((c) => ({ ...c, verified: false })) };
    expect(buildCardContext(unverified, now)).toContain("[검증 전]");
    expect(context).toMatch(/max-total: .*\[통통 해석\]/);
  });

  it("카드에 자격 확인이 있는지 알려 준다 — 없는 화면을 권하지 않게", () => {
    expect(context).toContain('- 자격 확인: 있음 ("나도 받을 수 있을까?")');
    expect(buildCardContext(findCard("young-future-savings")!, now)).toContain("- 자격 확인: 없음");
  });

  it("비판 자료가 없으면 없다고 적는다 — 모델이 채우지 않게", () => {
    expect(buildCardContext({ ...rent, counterpoints: [] }, now)).toContain("(등록된 비판 자료 없음)");
  });

  it("비판 자료는 누구의 주장인지와 함께 넘긴다", () => {
    expect(context).toMatch(/cp-strict-income: /);
    const leap = buildCardContext(findCard("youth-job-leap")!, now);
    expect(leap).toMatch(/cp-retention: .*\[주장\] \(이헌승 국회의원\(국민의힘\)\)/);
  });
});

describe("limits", () => {
  beforeEach(() => resetLimits());

  it("uid나 IP 중 하나라도 한도를 넘으면 막는다", () => {
    const t = Date.now();
    for (let i = 0; i < 20; i++) takeRate([`uid:a${i}`, "ip:1.1.1.1"], t);
    expect(() => takeRate(["uid:new", "ip:1.1.1.1"], t)).toThrow(Refusal);
    expect(() => takeRate(["uid:new", "ip:2.2.2.2"], t)).not.toThrow();
  });

  it("한 시간이 지나면 풀린다", () => {
    const t = Date.now();
    for (let i = 0; i < 20; i++) takeRate(["uid:a"], t);
    expect(() => takeRate(["uid:a"], t + 61 * 60 * 1000)).not.toThrow();
  });

  it("엔드포인트마다 자기 한도와 거절 코드를 쓴다", () => {
    const t = Date.now();
    for (let i = 0; i < 5; i++) takeRate(["correction:uid:a"], t, { limit: 5, code: "correction-rate-limited" });
    expect(() => takeRate(["correction:uid:a"], t, { limit: 5, code: "correction-rate-limited" })).toThrow("correction-rate-limited");
    expect(() => takeRate(["uid:a"], t)).not.toThrow();
  });

  it("일일 총량을 넘으면 막고, 날이 바뀌면 풀린다", () => {
    const day = new Date("2026-09-29T00:00:00Z");
    for (let i = 0; i < 500; i++) takeDailyBudget(day);
    expect(() => takeDailyBudget(day)).toThrow(Refusal);
    expect(() => takeDailyBudget(new Date("2026-09-30T00:00:00Z"))).not.toThrow();
  });
});
