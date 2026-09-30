import type { Card } from "@/content/schema";
import type { CardState, StoredJudgment } from "@/lib/user-state";

/*
 * 다시 판단하기 (설계 26장 → 검토 문서 7.3).
 *
 * 저장한 카드에 한해 두 경우에 다시 묻는다.
 *   1. 사용자가 마지막으로 본 뒤 카드에 material 개정이 생겼다 — "새 정보 +N"
 *   2. 마지막 정책 평가 뒤 90일이 지났다
 * 오탈자 수정(material: false)은 세지 않는다. 저장하지 않은 카드는 조르지 않는다.
 * 정책 평가가 없는 카드(묻지 않는 카드, 동의하지 않아 저장 안 된 평가)는 비교할 것이 없으므로 제외.
 */

export const REVISIT_AFTER_DAYS = 90;
const DAY_MS = 86_400_000;

type Revision = Card["revisions"][number];
type OpinionJudgment = Extract<StoredJudgment, { axis: "opinion" }>;

/** 가장 최근 정책 평가(최종 또는 재평가). */
export function latestOpinion(state: CardState | undefined): OpinionJudgment | null {
  const opinions = (state?.judgments ?? []).filter((j): j is OpinionJudgment => j.axis === "opinion");
  return opinions.length ? opinions[opinions.length - 1] : null;
}

/** 처음 정책 평가(최종). 재평가 화면의 "처음"이다. */
export function firstOpinion(state: CardState | undefined): OpinionJudgment | null {
  return (state?.judgments ?? []).find((j): j is OpinionJudgment => j.axis === "opinion" && j.phase === "final") ?? null;
}

/** 사용자가 마지막으로 본 뒤 생긴 material 개정. */
export function unseenRevisions(card: Card, state: CardState | undefined): Revision[] {
  const seen = state?.lastSeenVersion ?? 0;
  return card.revisions.filter((r) => r.material && r.version > seen);
}

export type RevisitReason =
  | { kind: "updated"; revisions: Revision[] }
  | { kind: "time"; days: number };

export function revisitReason(card: Card, state: CardState | undefined, now: Date): RevisitReason | null {
  if (!card.flow.opinion || !state?.saved) return null;
  const last = latestOpinion(state);
  if (!last) return null;

  const revisions = unseenRevisions(card, state);
  if (revisions.length > 0) return { kind: "updated", revisions };

  const days = Math.floor((now.getTime() - Date.parse(last.at)) / DAY_MS);
  return days >= REVISIT_AFTER_DAYS ? { kind: "time", days } : null;
}

/** 카드를 다시 열었을 때 재평가 화면으로 갈 수 있는가 — 비교할 첫 평가가 있어야 한다. */
export function canRevisit(card: Card, state: CardState | undefined): boolean {
  return card.flow.opinion && firstOpinion(state) !== null;
}
