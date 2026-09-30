import type { Card } from "@/content/schema";
import { currentApplication } from "@/lib/policy-state";
import type { CardState, Profile } from "@/lib/user-state";

/*
 * 피드 순서 (설계 21장 → 검토 문서 5.2).
 *
 * 카드는 빌드 때 번들되므로 서버 getFeed가 필요 없다. 사용자 상태와 합쳐 여기서 정렬한다.
 * 쓰는 신호는 생활 상황, 관심 주제, 신청 일정, 본 기록뿐이다. 판단 값(신뢰·평가)은 절대 쓰지 않는다 —
 * 같은 방향의 콘텐츠만 계속 보여주는 구조를 만들지 않기 위해서다 (설계 52장).
 */

export const PASS_COOLDOWN_DAYS = 30;
const DAY_MS = 86_400_000;

export function orderFeed(
  cards: readonly Card[],
  profile: Pick<Profile, "audienceType" | "lifeStages" | "interests">,
  states: ReadonlyMap<string, CardState>,
  now: Date,
): Card[] {
  const stages = new Set(profile.lifeStages);
  const interests = new Set(profile.interests ?? []);

  return cards
    .map((card, index) => ({ card, index, state: states.get(card.id) }))
    .filter(({ card, state }) => {
      if (!card.audience.includes(profile.audienceType)) return false;
      if (state?.completedAt) return false;
      if (state?.passedAt && now.getTime() - Date.parse(state.passedAt) < PASS_COOLDOWN_DAYS * DAY_MS) return false;
      return true;
    })
    .map((entry) => ({
      ...entry,
      // 관련도 = 겹치는 생활 상황 수 + 관심 주제면 1.
      score: entry.card.lifeStages.filter((s) => stages.has(s)).length + (interests.has(entry.card.category) ? 1 : 0),
      closed: currentApplication(entry.card.policy.applications, now)?.state === "closed",
    }))
    // 관련도가 먼저다. 같으면 지금 신청할 수 없는(마감된) 카드를 뒤로, 그다음은 편집 순서(raw.ts).
    .sort((a, b) => b.score - a.score || Number(a.closed) - Number(b.closed) || a.index - b.index)
    .map(({ card }) => card);
}
