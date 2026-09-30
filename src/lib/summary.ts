import type { Card } from "@/content/schema";
import type { CardState } from "@/lib/user-state";

export type Summary = {
  completed: number;
  saved: number;
  /** 재평가를 한 번 이상 한 카드 수. "생각이 바뀐" 수는 세지 않는다 (검토 문서 2.5). */
  revisited: number;
  /** 주제별 따져본 카드 수. 0인 주제는 뺀다. 많은 순, 같으면 주제 순서. */
  byTopic: { topic: Card["category"]; count: number }[];
};

/** 내 기록 화면의 수치 (설계 27·64장, 로드맵 4.5). 판단 값은 쓰지 않는다 — 몇 장을 봤는가만. */
export function summarize(cards: readonly Card[], states: ReadonlyMap<string, CardState>, topics: readonly Card["category"][]): Summary {
  const known = cards.filter((card) => states.has(card.id));
  const stateOf = (card: Card) => states.get(card.id)!;
  const completed = known.filter((card) => stateOf(card).completedAt);

  const counts = new Map<Card["category"], number>();
  for (const card of completed) counts.set(card.category, (counts.get(card.category) ?? 0) + 1);

  return {
    completed: completed.length,
    saved: known.filter((card) => stateOf(card).saved).length,
    revisited: known.filter((card) => stateOf(card).judgments.some((j) => j.phase === "revisit")).length,
    byTopic: topics
      .map((topic, index) => ({ topic, count: counts.get(topic) ?? 0, index }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count || a.index - b.index)
      .map(({ topic, count }) => ({ topic, count })),
  };
}
