import type { HookAccuracy } from "@/lib/judgment";
import type { CardState, StoredJudgment } from "@/lib/user-state";

/*
 * 통통 사용자 응답 집계 (설계 34장 → 검토 문서 3장 6번).
 *
 * 한 사람은 축마다 한 표 — 가장 최근 판단만 센다. 재평가로 생각을 바꾸면 표가 옮겨 간다.
 * 응답이 MIN_PUBLIC 미만인 축은 분포를 아예 쓰지 않는다. 작은 수는 개인을 드러낼 수 있고,
 * 의미도 없다. 공개 문서에 작은 수가 남지 않게 서버에서 거른다.
 * 화면은 "통통 사용자 응답이며 여론조사가 아닙니다"를 늘 붙인다.
 */

export const MIN_PUBLIC = 30;

export type ScaleDistribution = { "1": number; "2": number; "3": number; "4": number; "5": number; unknown: number };
export type AccuracyDistribution = Record<HookAccuracy, number>;

/** 공개 문서 cardStats/{cardId}. n이 MIN_PUBLIC 미만인 축은 null. */
export type CardStat = {
  cardId: string;
  trust: { n: number; distribution: ScaleDistribution } | null;
  hookAccuracy: { n: number; distribution: AccuracyDistribution } | null;
  opinion: { n: number; distribution: ScaleDistribution } | null;
};

const emptyScale = (): ScaleDistribution => ({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, unknown: 0 });
const emptyAccuracy = (): AccuracyDistribution => ({ accurate: 0, exaggerated: 0, misleading: 0 });

function latest(judgments: StoredJudgment[], axis: StoredJudgment["axis"]): StoredJudgment | undefined {
  return judgments.filter((j) => j.axis === axis).at(-1);
}

export function aggregate(cardIds: readonly string[], states: readonly CardState[]): CardStat[] {
  const raw = new Map(
    cardIds.map((id) => [id, { trust: emptyScale(), trustN: 0, accuracy: emptyAccuracy(), accuracyN: 0, opinion: emptyScale(), opinionN: 0 }]),
  );

  for (const state of states) {
    const bucket = raw.get(state.cardId);
    if (!bucket) continue; // 내려간 카드
    const trust = latest(state.judgments, "trust");
    if (trust) {
      bucket.trust[trust.value === null ? "unknown" : (String(trust.value) as "1")] += 1;
      bucket.trustN += 1;
    }
    const accuracy = latest(state.judgments, "hookAccuracy");
    if (accuracy) {
      bucket.accuracy[accuracy.value as HookAccuracy] += 1;
      bucket.accuracyN += 1;
    }
    const opinion = latest(state.judgments, "opinion");
    if (opinion) {
      bucket.opinion[opinion.value === null ? "unknown" : (String(opinion.value) as "1")] += 1;
      bucket.opinionN += 1;
    }
  }

  return cardIds.map((cardId) => {
    const b = raw.get(cardId)!;
    return {
      cardId,
      trust: b.trustN >= MIN_PUBLIC ? { n: b.trustN, distribution: b.trust } : null,
      hookAccuracy: b.accuracyN >= MIN_PUBLIC ? { n: b.accuracyN, distribution: b.accuracy } : null,
      opinion: b.opinionN >= MIN_PUBLIC ? { n: b.opinionN, distribution: b.opinion } : null,
    };
  });
}
