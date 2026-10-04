import { describe, expect, it } from "vitest";

import { findCard } from "@/content/cards";
import type { Card } from "@/content/schema";
import type { Check } from "@/lib/blueprint/check";

import { composeMessage, mergeNotifications, OFF, pickBlueprintNotifications, pickCardNotifications, readSettings, type NotifyItem, type NotifySettings } from "./notify";
import { emptyCardState, type CardState, type StoredJudgment } from "./user-state";

// 청년월세 지원 — 2026년 신청 2026-03-30 09:00 ~ 05-29 16:00 (KST)
const rent = findCard("youth-monthly-rent")!;
const ALL: NotifySettings = { updates: true, revisit: true, deadlines: true, blueprint: true };

const opinion = (at: string): StoredJudgment => ({ axis: "opinion", phase: "final", value: 4, cardVersion: 1, sessionId: `s-${at}`, reasonCodes: [], at });
const saved = (patch: Partial<CardState> = {}): CardState => ({ ...emptyCardState(rent.id), saved: true, lastSeenVersion: 1, ...patch });
const states = (state: CardState) => new Map([[rent.id, state]]);
const revised: Card = { ...rent, revisions: [...rent.revisions, { version: 2, date: "2026-06-01", material: true, summary: "개정", claimIds: [] }] };

/** 카드 알림만으로 오늘 보낼 것. */
const pick = (cards: Card[], st: Map<string, CardState>, settings: NotifySettings, sent: Set<string>, now: Date) =>
  mergeNotifications(pickCardNotifications(cards, st, settings, now), sent).items;

describe("카드 알림", () => {
  it("아무것도 켜지 않은 사람에게는 아무것도 보내지 않는다", () => {
    const now = new Date("2026-05-28T10:00:00+09:00");
    expect(pick([revised], states(saved({ judgments: [opinion("2026-01-01T00:00:00.000Z")] })), OFF, new Set(), now)).toEqual([]);
  });

  it("저장하지 않은 카드는 보지 않는다", () => {
    const now = new Date("2026-05-28T10:00:00+09:00");
    expect(pick([rent], states(saved({ saved: false })), ALL, new Set(), now)).toEqual([]);
  });

  it("신청 마감이 3일 안이면 마감 알림 — 그 전에는 없다", () => {
    const soon = pick([rent], states(saved()), ALL, new Set(), new Date("2026-05-27T10:00:00+09:00"));
    expect(soon).toEqual([{ key: "deadline:youth-monthly-rent:2026년", kind: "deadlines", path: "/card/youth-monthly-rent", text: "청년월세 지원 신청이 5월 29일에 마감돼요" }]);
    expect(pick([rent], states(saved()), ALL, new Set(), new Date("2026-05-20T10:00:00+09:00"))).toEqual([]);
    expect(pick([rent], states(saved()), { ...ALL, deadlines: false }, new Set(), new Date("2026-05-27T10:00:00+09:00"))).toEqual([]);
  });

  it("새 정보와 다시 판단 — 켠 것만", () => {
    const now = new Date("2026-07-01T10:00:00+09:00");
    const judged = saved({ judgments: [opinion("2026-06-10T00:00:00.000Z")] });
    expect(pick([revised], states(judged), ALL, new Set(), now).map((i) => i.key)).toEqual(["updated:youth-monthly-rent:v2"]);
    expect(pick([revised], states(judged), { ...ALL, updates: false }, new Set(), now)).toEqual([]);

    const old = saved({ judgments: [opinion("2026-01-01T00:00:00.000Z")] });
    expect(pick([rent], states(old), ALL, new Set(), now).map((i) => i.key)).toEqual(["revisit:youth-monthly-rent:2026-01-01"]);
  });

  it("한 번 보낸 것은 다시 보내지 않는다", () => {
    const now = new Date("2026-05-27T10:00:00+09:00");
    expect(pick([rent], states(saved()), ALL, new Set(["deadline:youth-monthly-rent:2026년"]), now)).toEqual([]);
  });

  it("문구에는 정책 이름과 날짜만 — 판단 값을 싣지 않는다", () => {
    const now = new Date("2026-07-01T10:00:00+09:00");
    const items = pick([revised], states(saved({ judgments: [opinion("2026-06-10T00:00:00.000Z")] })), ALL, new Set(), now);
    for (const item of items) expect(item.text).not.toMatch(/평가|찬성|반대|[1-5]점/);
  });

  it("예전에 저장한 설정(청사진 칸 없음)은 청사진 알림이 꺼진 것으로 읽는다", () => {
    expect(readSettings({ updates: true, revisit: false, deadlines: true })).toEqual({ updates: true, revisit: false, deadlines: true, blueprint: false });
    expect(readSettings(undefined)).toEqual(OFF);
  });
});

describe("청사진 알림 (B5)", () => {
  const check = (patch: Partial<Check>): Check => ({ key: "k", kind: "window-open", placementId: "p1", policyId: "youth-monthly-rent", data: {}, fixes: [], dismissible: true, ...patch });
  const name = (id: string) => (id === "youth-monthly-rent" ? "청년월세 지원" : id);

  it("신청 마감 임박·지난 신청·내용 변경만 보낸다 — 열림·카드 안내 같은 나머지는 화면에서만", () => {
    const items = pickBlueprintNotifications(
      [
        check({ key: "window-closing:p1:2026년", kind: "window-closing", data: { label: "2026년", endAt: "2026-05-29T16:00:00+09:00" } }),
        check({ key: "window-missed:p2:2025년", kind: "window-missed", data: { label: "2025년" } }),
        check({ key: "policy-updated:p3:v2", kind: "policy-updated", data: { from: 1, to: 2 } }),
        check({ key: "window-open:p4:2026년", kind: "window-open" }),
        check({ key: "card-available:youth-monthly-rent", kind: "card-available" }),
      ],
      name,
    );
    expect(items).toEqual([
      { key: "bp:window-closing:p1:2026년", kind: "blueprint", path: "/plan", text: "청년월세 지원 신청이 5월 29일에 마감돼요" },
      { key: "bp:window-missed:p2:2025년", kind: "blueprint", path: "/plan", text: "청년월세 지원 2025년 신청 기간이 지났어요" },
      { key: "bp:policy-updated:p3:v2", kind: "blueprint", path: "/plan", text: "청년월세 지원의 내용이 바뀌었어요" },
    ]);
  });

  it("저장한 카드와 청사진이 같은 마감을 말하면 한 번만 싣고, 둘 다 보낸 것으로 남긴다", () => {
    const card: NotifyItem = { key: "deadline:youth-monthly-rent:2026년", kind: "deadlines", path: "/card/youth-monthly-rent", text: "청년월세 지원 신청이 5월 29일에 마감돼요" };
    const bp: NotifyItem = { key: "bp:window-closing:p1:2026년", kind: "blueprint", path: "/plan", text: card.text };
    const merged = mergeNotifications([bp, card], new Set());
    expect(merged.items).toEqual([card]);
    expect(merged.keys.sort()).toEqual([bp.key, card.key].sort());
  });
});

describe("composeMessage", () => {
  const item = (path: string, text: string, kind: NotifyItem["kind"] = "updates"): NotifyItem => ({ key: path, kind, path, text });
  it("하나면 그 화면으로, 여럿이면 저장한 카드로 — 모두 청사진 알림이면 청사진으로", () => {
    expect(composeMessage([item("/card/a", "가")])).toEqual({ title: "통통", body: "가", path: "/card/a" });
    expect(composeMessage([item("/card/a", "가"), item("/card/b", "나"), item("/plan", "다", "blueprint")])).toEqual({ title: "통통", body: "가 외 2건", path: "/saved" });
    expect(composeMessage([item("/plan", "가", "blueprint"), item("/plan", "나", "blueprint")])).toEqual({ title: "통통", body: "가 외 1건", path: "/plan" });
  });
});
