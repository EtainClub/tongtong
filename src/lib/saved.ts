import type { Card } from "@/content/schema";
import { currentApplication, type ApplicationState } from "@/lib/policy-state";
import { revisitReason, type RevisitReason } from "@/lib/revisit";
import type { CardState } from "@/lib/user-state";

export type SavedEntry = { card: Card; reason: RevisitReason | null; application: ApplicationState | null };

/**
 * 저장한 카드 순서 (로드맵 4.4): 새 정보 → 지금 신청 중 → 다시 볼 때 → 나머지.
 * 같은 무리 안에서는 편집 순서. 판단 값은 쓰지 않는다.
 */
export function orderSaved(cards: readonly Card[], states: ReadonlyMap<string, CardState>, now: Date): SavedEntry[] {
  const rank = ({ reason, application }: SavedEntry) =>
    reason?.kind === "updated" ? 0 : application === "open" ? 1 : reason?.kind === "time" ? 2 : 3;

  return cards
    .filter((card) => states.get(card.id)?.saved)
    .map((card) => ({
      card,
      reason: revisitReason(card, states.get(card.id), now),
      application: currentApplication(card.policy.applications, now)?.state ?? null,
    }))
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => rank(a.entry) - rank(b.entry) || a.index - b.index)
    .map(({ entry }) => entry);
}
