import { describe, expect, it } from "vitest";

import { timeline } from "./timeline";
import type { StoredJudgment } from "./user-state";

const base = { sessionId: "session-0001", at: "2026-09-30T00:00:00Z" };
const trust = (value: 1 | 2 | 3 | 4 | 5 | null): StoredJudgment => ({ ...base, axis: "trust", phase: "initial", value, cardVersion: 1 });
const opinion = (phase: "final" | "revisit", value: 1 | 2 | 3 | 4 | 5 | null, cardVersion = 1): StoredJudgment => ({ ...base, axis: "opinion", phase, value, cardVersion, reasonCodes: [] });

describe("timeline", () => {
  it("같은 축 안에서만 처음과 가장 최근을 가른다", () => {
    const result = timeline([trust(2), opinion("final", 4), opinion("revisit", 3), opinion("revisit", 5)]);
    expect(result.map((e) => e.role)).toEqual(["latest", "first", "middle", "latest"]);
  });

  it("모르겠음과 훅 정확도에는 점을 찍지 않는다", () => {
    const hook: StoredJudgment = { ...base, axis: "hookAccuracy", phase: "final", value: "accurate", cardVersion: 1 };
    expect(timeline([trust(null), hook]).map((e) => e.role)).toEqual([null, null]);
  });

  it("카드 버전이 오른 뒤의 재평가는 정책 변경이 계기다", () => {
    const result = timeline([opinion("final", 4, 1), opinion("revisit", 3, 2), opinion("revisit", 3, 2)]);
    expect(result.map((e) => e.trigger)).toEqual([null, "updated", "revisit"]);
  });
});
