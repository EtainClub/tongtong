import { describe, expect, it } from "vitest";

import { CARDS } from "@/content/cards";

import { orderSaved } from "./saved";
import { emptyCardState, type CardState } from "./user-state";

const now = new Date("2026-09-30T12:00:00+09:00");
const base = CARDS[0];
const card = (id: string, applications: { startAt: string; endAt: string }[] = []) => ({
  ...base,
  id,
  flow: { trust: true, opinion: true },
  policy: { ...base.policy, applications: applications.map((a) => ({ ...a, label: "회차", sourceIds: [] })) },
  revisions: [
    { version: 1, date: "2026-01-01", material: true, summary: "첫 작성", claimIds: [] },
    { version: 2, date: "2026-09-01", material: true, summary: "개정", claimIds: [] },
  ],
});
const saved = (id: string, patch: Partial<CardState> = {}): [string, CardState] => [id, { ...emptyCardState(id), saved: true, ...patch }];
const opinionAt = (at: string, cardVersion: number) => ({
  judgments: [{ axis: "opinion" as const, phase: "final" as const, value: 4 as const, cardVersion, sessionId: "session-0001", reasonCodes: [], at }],
  lastSeenVersion: cardVersion,
});

describe("orderSaved", () => {
  it("새 정보 → 신청 중 → 다시 볼 때 → 나머지, 저장하지 않은 카드는 빠진다", () => {
    const open = { startAt: "2026-09-01T09:00:00+09:00", endAt: "2026-10-31T18:00:00+09:00" };
    const cards = [card("plain"), card("due"), card("open", [open]), card("updated"), card("not-saved")];
    const states = new Map([
      saved("plain", opinionAt("2026-09-20T00:00:00Z", 2)),
      saved("due", opinionAt("2026-05-01T00:00:00Z", 2)),
      saved("open", opinionAt("2026-09-20T00:00:00Z", 2)),
      saved("updated", opinionAt("2026-08-01T00:00:00Z", 1)),
      ["not-saved", emptyCardState("not-saved")] as [string, CardState],
    ]);
    expect(orderSaved(cards, states, now).map((e) => e.card.id)).toEqual(["updated", "open", "due", "plain"]);
  });
});
