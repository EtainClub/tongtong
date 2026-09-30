import { describe, expect, it } from "vitest";

import { findCard } from "@/content/cards";
import type { Card } from "@/content/schema";

import { canRevisit, firstOpinion, latestOpinion, revisitReason, unseenRevisions } from "./revisit";
import { emptyCardState, type CardState, type StoredJudgment } from "./user-state";

const base = findCard("youth-monthly-rent")!;
const now = new Date("2026-12-29T12:00:00+09:00");

const opinion = (value: 1 | 2 | 3 | 4 | 5, at: string, phase: "final" | "revisit" = "final", cardVersion = 1): StoredJudgment => ({
  axis: "opinion",
  phase,
  value,
  cardVersion,
  sessionId: `session-${at}`,
  reasonCodes: [],
  at,
});

function state(patch: Partial<CardState>): CardState {
  return { ...emptyCardState(base.id), saved: true, lastSeenVersion: 1, ...patch };
}

/** 카드에 개정을 하나 더 붙인다. */
function revised(material: boolean): Card {
  return {
    ...base,
    revisions: [...base.revisions, { version: 2, date: "2026-11-01", material, summary: "신청 기간 발표", claimIds: [] }],
  };
}

describe("revisitReason", () => {
  const judged = state({ judgments: [opinion(4, "2026-12-01T00:00:00.000Z")] });

  it("저장한 카드에 material 개정이 생기면 새 정보로 다시 묻는다", () => {
    expect(revisitReason(revised(true), judged, now)).toMatchObject({ kind: "updated", revisions: [{ version: 2 }] });
  });

  it("오탈자 수정(material: false)은 세지 않는다", () => {
    expect(revisitReason(revised(false), judged, now)).toBeNull();
  });

  it("이미 본 버전의 개정은 세지 않는다", () => {
    expect(revisitReason(revised(true), { ...judged, lastSeenVersion: 2 }, now)).toBeNull();
  });

  it("마지막 평가 뒤 90일이 지나면 다시 묻는다", () => {
    const old = state({ judgments: [opinion(4, "2026-09-29T00:00:00.000Z")] });
    expect(revisitReason(base, old, now)).toEqual({ kind: "time", days: 91 });
    const recent = state({ judgments: [opinion(4, "2026-10-15T00:00:00.000Z")] });
    expect(revisitReason(base, recent, now)).toBeNull();
  });

  it("90일은 마지막 재평가부터 다시 센다", () => {
    const again = state({ judgments: [opinion(4, "2026-06-01T00:00:00.000Z"), opinion(3, "2026-12-01T00:00:00.000Z", "revisit")] });
    expect(revisitReason(base, again, now)).toBeNull();
  });

  it("저장하지 않은 카드, 평가가 없는 카드는 조르지 않는다", () => {
    expect(revisitReason(revised(true), { ...judged, saved: false }, now)).toBeNull();
    expect(revisitReason(revised(true), state({ judgments: [] }), now)).toBeNull();
    expect(revisitReason({ ...revised(true), flow: { trust: true, opinion: false } }, judged, now)).toBeNull();
  });
});

describe("opinions", () => {
  const history = state({
    judgments: [opinion(2, "2026-06-01T00:00:00.000Z"), opinion(4, "2026-12-01T00:00:00.000Z", "revisit", 2)],
  });

  it("처음은 최종 평가, 지금은 가장 최근 평가", () => {
    expect(firstOpinion(history)?.value).toBe(2);
    expect(latestOpinion(history)?.value).toBe(4);
  });

  it("비교할 첫 평가가 있어야 다시 판단할 수 있다", () => {
    expect(canRevisit(base, history)).toBe(true);
    expect(canRevisit(base, state({ judgments: [] }))).toBe(false);
  });

  it("unseenRevisions는 사용자가 본 버전 뒤의 material 개정만", () => {
    expect(unseenRevisions(revised(true), { ...history, lastSeenVersion: 0 }).map((r) => r.version)).toEqual([1, 2]);
  });
});
