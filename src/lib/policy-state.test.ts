import { describe, expect, it } from "vitest";

import { applicationState, claimState, currentApplication, reviewOverdue } from "./policy-state";

const kst = (s: string) => new Date(`${s}+09:00`);

describe("applicationState", () => {
  const app = { startAt: "2026-10-07", endAt: "2026-10-16" };

  it("날짜만 있으면 KST 하루 전체를 포함한다", () => {
    expect(applicationState(app, kst("2026-10-06T23:59:59"))).toBe("upcoming");
    expect(applicationState(app, kst("2026-10-07T00:00:00"))).toBe("open");
    expect(applicationState(app, kst("2026-10-16T23:59:59"))).toBe("open");
    expect(applicationState(app, kst("2026-10-17T00:00:00"))).toBe("closed");
  });

  it("시각이 있으면 그 시각을 쓴다", () => {
    const rent = { startAt: "2026-03-30T09:00:00+09:00", endAt: "2026-05-29T16:00:00+09:00" };
    expect(applicationState(rent, kst("2026-03-30T08:59:00"))).toBe("upcoming");
    expect(applicationState(rent, kst("2026-05-29T15:59:00"))).toBe("open");
    expect(applicationState(rent, kst("2026-05-29T16:01:00"))).toBe("closed");
  });

  it("UTC 자정 근처에서도 KST로 판단한다", () => {
    // 2026-10-16T15:30Z = 10/17 00:30 KST — 이미 마감
    expect(applicationState(app, new Date("2026-10-16T15:30:00Z"))).toBe("closed");
  });
});

describe("currentApplication", () => {
  const rounds = [
    { label: "1차", startAt: "2026-06-01", endAt: "2026-06-10" },
    { label: "2차", startAt: "2026-10-07", endAt: "2026-10-16" },
  ];

  it("열린 회차 → 다음 회차 → 마지막 회차 순으로 고른다", () => {
    expect(currentApplication(rounds, kst("2026-06-05T12:00:00"))?.app.label).toBe("1차");
    expect(currentApplication(rounds, kst("2026-09-29T12:00:00"))).toMatchObject({ app: { label: "2차" }, state: "upcoming" });
    expect(currentApplication(rounds, kst("2026-12-01T12:00:00"))).toMatchObject({ app: { label: "2차" }, state: "closed" });
  });

  it("회차가 없으면 null", () => {
    expect(currentApplication([], new Date())).toBeNull();
  });
});

describe("claimState", () => {
  it("validUntil 당일까지는 유효하다", () => {
    const claim = { validUntil: "2026-09-30" };
    expect(claimState(claim, kst("2026-09-30T23:00:00"))).toBe("current");
    expect(claimState(claim, kst("2026-10-01T00:00:01"))).toBe("expired");
    expect(claimState({}, kst("2099-01-01T00:00:00"))).toBe("current");
  });
});

describe("reviewOverdue", () => {
  it("90일이 지나면 재대조 대상", () => {
    expect(reviewOverdue("2026-09-29", kst("2026-12-27T00:00:00"))).toBe(false);
    expect(reviewOverdue("2026-09-29", kst("2026-12-29T00:00:00"))).toBe(true);
  });
});
