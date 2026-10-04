import { z } from "zod";

import type { Card } from "@/content/schema";
import type { Check, CheckKind } from "@/lib/blueprint/check";
import { currentApplication, endOf } from "@/lib/policy-state";
import { latestOpinion, revisitReason } from "@/lib/revisit";
import type { CardState } from "@/lib/user-state";

/*
 * 알림 (로드맵 M7-B, 청사진 설계 B5). 무엇을 보낼지 고르는 규칙 — 순수 함수라 서버 발송과 테스트가 같이 쓴다.
 *
 * - 네 가지를 따로 켜고 끈다. 기본은 모두 꺼짐. 하나도 켜지 않은 사람에게는 아무것도 가지 않는다.
 * - 카드 알림은 저장한 카드만, 청사진 알림은 지금 청사진에 넣은 정책만 — 관심을 표시한 정책만.
 * - 문구에는 정책 이름과 날짜만. 판단 값·이유·생활 상황, 청사진의 목표·메모·상태는 담지 않는다 (B5).
 * - 하루 한 번, 한 사람에게 한 건으로 묶는다. 한 번 알린 것(key)은 다시 알리지 않는다.
 */

export const NOTIFY_KINDS = ["updates", "revisit", "deadlines", "blueprint"] as const;
export type NotifyKind = (typeof NOTIFY_KINDS)[number];

export const NOTIFY_LABELS: Record<NotifyKind, { title: string; detail: string }> = {
  updates: { title: "정책이 바뀌었을 때", detail: "저장한 카드에 새 정보가 생기면" },
  revisit: { title: "다시 판단할 때", detail: "저장한 카드를 평가한 지 90일이 지나면" },
  deadlines: { title: "신청 마감 전", detail: "저장한 카드의 신청이 3일 안에 끝나면" },
  blueprint: { title: "내 청사진 점검", detail: "청사진에 넣은 정책의 신청 마감·지난 신청·내용 변경" },
};

/** 마감 알림을 보내는 날 수. */
export const DEADLINE_DAYS = 3;
const DAY_MS = 86_400_000;

export const notifySettingsSchema = z.strictObject({
  updates: z.boolean(),
  revisit: z.boolean(),
  deadlines: z.boolean(),
  blueprint: z.boolean(),
});
export type NotifySettings = z.infer<typeof notifySettingsSchema>;

export const OFF: NotifySettings = { updates: false, revisit: false, deadlines: false, blueprint: false };

/** 저장된 문서 → 설정. 없는 칸(나중에 더한 종류)은 꺼짐. */
export const readSettings = (data: Record<string, unknown> | undefined): NotifySettings =>
  Object.fromEntries(NOTIFY_KINDS.map((kind) => [kind, data?.[kind] === true])) as NotifySettings;

/** 설정 저장 요청. 켤 때 이 기기의 푸시 토큰을 함께 보낸다. */
export const notifyInput = notifySettingsSchema.extend({ token: z.string().min(20).max(4096).optional() });

export const anyOn = (settings: NotifySettings) => NOTIFY_KINDS.some((kind) => settings[kind]);

/** path — 알림을 누르면 열 화면. */
export type NotifyItem = { key: string; kind: NotifyKind; path: string; text: string };

const md = (ms: number) => {
  const date = new Date(ms + 9 * 3_600_000); // KST
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일`;
};

/** 저장한 카드에서 오늘 보낼 것. */
export function pickCardNotifications(cards: readonly Card[], states: ReadonlyMap<string, CardState>, settings: NotifySettings, now: Date): NotifyItem[] {
  const items: NotifyItem[] = [];
  for (const card of cards) {
    const state = states.get(card.id);
    if (!state?.saved) continue;
    const path = `/card/${card.id}`;

    if (settings.deadlines) {
      const current = currentApplication(card.policy.applications, now);
      const end = current && endOf(current.app.endAt);
      if (current?.state === "open" && end && end - now.getTime() <= DEADLINE_DAYS * DAY_MS) {
        items.push({ key: `deadline:${card.id}:${current.app.label}`, kind: "deadlines", path, text: `${card.shortTitle} 신청이 ${md(end)}에 마감돼요` });
      }
    }

    const reason = revisitReason(card, state, now);
    if (settings.updates && reason?.kind === "updated") {
      const version = reason.revisions[reason.revisions.length - 1].version;
      items.push({ key: `updated:${card.id}:v${version}`, kind: "updates", path, text: `${card.shortTitle}에 새 정보가 있어요` });
    }
    if (settings.revisit && reason?.kind === "time") {
      items.push({ key: `revisit:${card.id}:${latestOpinion(state)!.at.slice(0, 10)}`, kind: "revisit", path, text: `${card.shortTitle}, 다시 판단해 볼 때예요` });
    }
  }
  return items;
}

/** 청사진 점검 가운데 알림으로 보내는 것 (청사진 설계 B5). 신청 기간 열림·카드 안내 같은 나머지는 화면에서만. */
export const BLUEPRINT_NOTIFY_CHECKS: readonly CheckKind[] = ["window-closing", "window-missed", "policy-updated"];

/**
 * 지금 청사진의 열린 점검(닫은 알림은 이미 뺀 것)에서 보낼 것. key는 점검 키 그대로라, 회차가 바뀌면 다시 알린다.
 * 문구는 정책 이름과 날짜만 — 배치의 상태·메모, 목표는 담지 않는다.
 */
export function pickBlueprintNotifications(checks: readonly Check[], policyName: (policyId: string) => string): NotifyItem[] {
  return checks.flatMap((check): NotifyItem[] => {
    if (!BLUEPRINT_NOTIFY_CHECKS.includes(check.kind) || !check.policyId) return [];
    const name = policyName(check.policyId);
    const data = check.data as { endAt?: string; label?: string };
    const text =
      check.kind === "window-closing"
        ? `${name} 신청이 ${md(endOf(data.endAt!))}에 마감돼요`
        : check.kind === "window-missed"
          ? `${name} ${data.label} 신청 기간이 지났어요`
          : `${name}의 내용이 바뀌었어요`;
    return [{ key: `bp:${check.key}`, kind: "blueprint", path: "/plan", text }];
  });
}

/**
 * 오늘 보낼 것을 합친다. 이미 보낸 key는 빼고, 같은 문구(저장한 카드와 청사진이 같은 마감을 말할 때)는 한 번만 싣는다.
 * keys는 보낸 것으로 남길 key — 겹쳐서 싣지 않은 것도 넣어야 다음 날 다시 가지 않는다.
 * 순서는 마감 → 청사진 → 새 정보 → 다시 판단(급한 것부터).
 */
export function mergeNotifications(all: readonly NotifyItem[], sent: ReadonlySet<string>): { items: NotifyItem[]; keys: string[] } {
  const order: Record<NotifyKind, number> = { deadlines: 0, blueprint: 1, updates: 2, revisit: 3 };
  const fresh = all.filter((item) => !sent.has(item.key)).sort((a, b) => order[a.kind] - order[b.kind]);
  const texts = new Set<string>();
  const items = fresh.filter((item) => (texts.has(item.text) ? false : (texts.add(item.text), true)));
  return { items, keys: fresh.map((item) => item.key) };
}

/** 한 사람에게 보내는 한 건. 하나면 그 화면으로, 여럿이면 모두 청사진 알림일 때 청사진, 아니면 저장한 카드로. */
export function composeMessage(items: readonly NotifyItem[]): { title: string; body: string; path: string } {
  const [first] = items;
  return {
    title: "통통",
    body: items.length === 1 ? first.text : `${first.text} 외 ${items.length - 1}건`,
    path: items.length === 1 ? first.path : items.every((item) => item.kind === "blueprint") ? "/plan" : "/saved",
  };
}
