import { describe, expect, it } from "vitest";

import { nextProfile, ProfileRejection, type Profile } from "./user-state";

const now = new Date("2026-10-01T00:00:00Z");
const adult: Profile = { audienceType: "young_adult", lifeStages: ["college"], interests: ["housing"], consent: { opinion: "2026-09-30T00:00:00.000Z" } };
const rejects = (fn: () => unknown, code: ProfileRejection["code"]) => expect(fn).toThrow(expect.objectContaining({ code }));

describe("nextProfile", () => {
  it("청소년은 만 14세 이상 확인이 있어야 하고, 한 번 확인하면 다시 묻지 않는다", () => {
    rejects(() => nextProfile(null, { audienceType: "youth", lifeStages: [] }, now), "over14-required");
    const teen = nextProfile(null, { audienceType: "youth", lifeStages: ["college"], over14: true }, now);
    expect(teen).toMatchObject({ audienceType: "youth", lifeStages: [], over14ConfirmedAt: now.toISOString(), consent: { opinion: null } });
    expect(nextProfile(teen, { audienceType: "youth", lifeStages: [], interests: ["culture"] }, now).interests).toEqual(["culture"]);
  });

  it("청소년은 정책 평가 저장 동의를 받지 않는다", () => {
    rejects(() => nextProfile(null, { audienceType: "youth", lifeStages: [], over14: true, consentOpinion: true }, now), "youth-opinion-local");
  });

  it("청소년에서 청년으로는 가고, 거꾸로는 못 간다", () => {
    const teen = nextProfile(null, { audienceType: "youth", lifeStages: [], over14: true }, now);
    expect(nextProfile(teen, { audienceType: "young_adult", lifeStages: ["college"], consentOpinion: true }, now)).toMatchObject({
      audienceType: "young_adult",
      lifeStages: ["college"],
      consent: { opinion: now.toISOString() },
    });
    rejects(() => nextProfile(adult, { audienceType: "youth", lifeStages: [], over14: true }, now), "audience-downgrade");
  });

  it("생략한 동의·관심 주제는 앞의 값을 지킨다", () => {
    expect(nextProfile(adult, { audienceType: "young_adult", lifeStages: [] }, now)).toMatchObject({ interests: ["housing"], consent: adult.consent });
    expect(nextProfile(adult, { audienceType: "young_adult", lifeStages: [], consentOpinion: false }, now).consent.opinion).toBeNull();
  });
});
