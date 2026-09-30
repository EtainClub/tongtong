import { describe, expect, it } from "vitest";

import { ALL_CARDS } from "@/content/cards";

import { estimateSeconds, formatEstimate } from "./estimate";

describe("estimate", () => {
  it("30초 단위로 적고 1분 아래로 내려가지 않는다", () => {
    expect(formatEstimate(20)).toBe("약 1분");
    expect(formatEstimate(60)).toBe("약 1분");
    expect(formatEstimate(98)).toBe("약 1분 30초");
    expect(formatEstimate(115)).toBe("약 2분");
  });

  it("내용이 많을수록 길다", () => {
    const card = ALL_CARDS[0];
    const longer = { ...card, shorts: [...card.shorts, "한 줄을 더 읽는다. ".repeat(10)] };
    expect(estimateSeconds(longer)).toBeGreaterThan(estimateSeconds(card));
  });

  it("판단 단계를 끄면 짧아진다", () => {
    const card = ALL_CARDS[0];
    expect(estimateSeconds({ ...card, flow: { trust: false, opinion: false } })).toBeLessThan(estimateSeconds(card));
  });
});
