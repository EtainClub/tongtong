import { z } from "zod";

/*
 * 측정 이벤트 (로드맵 M8, 검토 문서 9장의 여섯 지표).
 *
 * 누가 했는지 남기지 않는다 — uid·IP·쿠키를 읽지 않고, 서버는 날짜별·카드별 합계만 올린다 (임통 lib/metrics와 같다).
 * 판단 값·이유·생활 상황은 싣지 않는다. 스키마가 strict라 다른 필드가 끼면 거절한다 (events.test).
 *
 *   첫 판단 도달률   trust_done / card_open
 *   게임 정답률      game_done(correct) / game_done(correct + wrong) — 정답이 없는 게임(자격 확인·예산 나누기·금액 맞히기)은 빼고
 *   원자료 클릭률    source_open / reveal_reached
 *   최종 판단 도달률 final_done / card_open
 *   30일 재방문      returned(코호트) / visit(first) — 첫 방문 날짜별
 *   재평가 응답률    revisit_done / revisit_open
 */

export const CARD_EVENTS = ["card_open", "trust_done", "reveal_reached", "source_open", "final_done", "revisit_open", "revisit_done"] as const;
export type CardEvent = (typeof CARD_EVENTS)[number];

const cardId = z.string().min(1).max(100);

export const metricEventSchema = z.union([
  // 앱을 연 한 번(탭마다). first는 이 브라우저의 첫 방문인가.
  z.object({ event: z.literal("visit"), first: z.boolean() }).strict(),
  // 첫 방문 뒤 1–30일 안에 다시 왔다 — 브라우저마다 한 번만 보낸다. cohort는 첫 방문 날짜.
  z.object({ event: z.literal("returned"), cohort: z.iso.date() }).strict(),
  z.object({ event: z.enum(CARD_EVENTS), cardId }).strict(),
  // correct: 맞혔나. 정답이 없는 게임은 null.
  z.object({ event: z.literal("game_done"), cardId, correct: z.boolean().nullable() }).strict(),
]);
export type MetricEvent = z.infer<typeof metricEventSchema>;
