import { shiftDate } from "@/lib/date";

/** metrics/{날짜} 문서 하나 (lib/metrics/store). */
export type DailyDoc = {
  date: string;
  visits?: { first?: number; return?: number };
  returned30?: number;
  cards?: Record<string, Record<string, number>>;
  gaps?: Record<string, number>;
  regionalOpen?: number;
};

/** metricsRegional/{날짜} 문서 하나 — 지역 정책 원문 열기 (lib/metrics/store). */
export type RegionalDailyDoc = { policies?: Record<string, number> };

export type Rate = { numerator: number; denominator: number; rate: number | null };
const rate = (numerator: number, denominator: number): Rate => ({ numerator, denominator, rate: denominator > 0 ? numerator / denominator : null });

export type MetricsReport = {
  from: string;
  to: string;
  firstJudgment: Rate;
  gameCorrect: Rate;
  sourceClick: Rate;
  finalJudgment: Rate;
  /** 코호트가 30일을 다 채운 날(오늘 기준 31일 이전)만 센다 — 덜 찬 코호트는 비율을 낮춰 보이게 한다. */
  return30: Rate;
  revisitResponse: Rate;
  visits: { first: number; return: number };
  perCard: Record<string, { open: number; firstJudgment: Rate; finalJudgment: Rate; gameCorrect: Rate; sourceClick: Rate }>;
  /** 청사진 빈칸 요청 — 역할별 기간 합계 (청사진 설계 9.4). */
  gaps: Record<string, number>;
  /** 우리 지역 청년 정책 목록 열람 — 기간 합계 (지역 검토 R2). */
  regionalOpen: number;
};

/**
 * 여섯 지표 (검토 문서 9장, 로드맵 M8). days는 기간 지표용, cohortDocs는 30일 재방문용 — 오늘부터 31–60일 전.
 */
export function buildReport(docs: DailyDoc[], cohortDocs: DailyDoc[], today: string): MetricsReport {
  const sum = (pick: (card: Record<string, number>) => number, only?: string) =>
    docs.reduce((total, doc) => total + Object.entries(doc.cards ?? {}).reduce((s, [id, c]) => s + (only && id !== only ? 0 : pick(c)), 0), 0);
  const n = (key: string, only?: string) => sum((c) => c[key] ?? 0, only);

  const cardIds = [...new Set(docs.flatMap((doc) => Object.keys(doc.cards ?? {})))].sort();
  const dates = docs.map((d) => d.date).sort();

  return {
    from: dates[0] ?? today,
    to: dates.at(-1) ?? today,
    firstJudgment: rate(n("trust_done"), n("card_open") - n("card_open_informed")),
    gameCorrect: rate(n("game_correct"), n("game_correct") + n("game_wrong")),
    sourceClick: rate(n("source_open"), n("reveal_reached")),
    finalJudgment: rate(n("final_done"), n("card_open")),
    return30: rate(
      cohortDocs.reduce((s, d) => s + (d.returned30 ?? 0), 0),
      cohortDocs.reduce((s, d) => s + (d.visits?.first ?? 0), 0),
    ),
    revisitResponse: rate(n("revisit_done"), n("revisit_open")),
    visits: {
      first: docs.reduce((s, d) => s + (d.visits?.first ?? 0), 0),
      return: docs.reduce((s, d) => s + (d.visits?.return ?? 0), 0),
    },
    perCard: Object.fromEntries(
      cardIds.map((id) => [
        id,
        {
          open: n("card_open", id),
          firstJudgment: rate(n("trust_done", id), n("card_open", id) - n("card_open_informed", id)),
          finalJudgment: rate(n("final_done", id), n("card_open", id)),
          gameCorrect: rate(n("game_correct", id), n("game_correct", id) + n("game_wrong", id)),
          sourceClick: rate(n("source_open", id), n("reveal_reached", id)),
        },
      ]),
    ),
    gaps: docs.reduce<Record<string, number>>((total, doc) => {
      for (const [role, count] of Object.entries(doc.gaps ?? {})) total[role] = (total[role] ?? 0) + count;
      return total;
    }, {}),
    regionalOpen: docs.reduce((s, d) => s + (d.regionalOpen ?? 0), 0),
  };
}

/** 지역 정책별 원문 열기 — 기간 합계, 많은 순으로 limit개. */
export function topRegionalPolicies(docs: RegionalDailyDoc[], limit: number): [string, number][] {
  const total = new Map<string, number>();
  for (const doc of docs) for (const [id, count] of Object.entries(doc.policies ?? {})) total.set(id, (total.get(id) ?? 0) + count);
  return [...total].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

/** 기간 문서 날짜들과 30일 재방문 코호트 날짜들. */
export function reportDates(today: string, days: number) {
  return {
    period: Array.from({ length: days }, (_, i) => shiftDate(today, -i)),
    cohorts: Array.from({ length: 30 }, (_, i) => shiftDate(today, -31 - i)),
  };
}
