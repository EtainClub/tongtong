import { z } from "zod";

import { PlacementRole } from "@/content/schema";

/*
 * 측정 이벤트 (로드맵 M8, 검토 문서 9장의 여섯 지표).
 *
 * 누가 했는지 남기지 않는다 — uid·IP·쿠키를 읽지 않고, 서버는 날짜별·카드별 합계만 올린다 (임통 lib/metrics와 같다).
 * 판단 값·이유·생활 상황은 싣지 않는다. 스키마가 strict라 다른 필드가 끼면 거절한다 (events.test).
 *
 *   첫 판단 도달률   trust_done / (card_open − card_open_informed) — 정책 페이지에서 사실을 먼저 봐 훅 판단을 묻지 않은 열람은 뺀다
 *   게임 정답률      game_done(correct) / game_done(correct + wrong) — 정답이 없는 게임(자격 확인·예산 나누기·금액 맞히기)은 빼고
 *   원자료 클릭률    source_open / reveal_reached
 *   최종 판단 도달률 final_done / card_open
 *   30일 재방문      returned(코호트) / visit(first) — 첫 방문 날짜별
 *   재평가 응답률    revisit_done / revisit_open
 *
 * 지표 밖: gap_request — 청사진에서 찾는 정책이 없다고 고른 역할의 횟수. 다음에 쓸 항목의 순서를 정한다 (청사진 설계 9.4).
 *          regional_open · regional_policy_open — 지역 목록 열람과 정책별 원문 열기. 지역 정책을 항목으로 올릴 순서 (지역 검토 R2).
 */

export const CARD_EVENTS = ["card_open", "card_open_informed", "trust_done", "reveal_reached", "source_open", "final_done", "revisit_open", "revisit_done"] as const;
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
  // 청사진 "+ 정책 넣기"에서 찾는 정책이 없다 — 어떤 일(역할)에 쓸 정책인지만 (청사진 설계 9.4 빈칸 요청). 글은 받지 않는다.
  z.object({ event: z.literal("gap_request"), role: PlacementRole }).strict(),
  // 우리 지역 청년 정책 목록을 열었다 — 지역은 싣지 않는다 (지역 검토 4장).
  z.object({ event: z.literal("regional_open") }).strict(),
  // 지역 목록에서 원문을 열었다 — 온통청년 정책 번호(20자리)만. 많이 열린 정책부터 항목으로 올린다 (지역 검토 6장 R2).
  z.object({ event: z.literal("regional_policy_open"), policyId: z.string().regex(/^\d{20}$/) }).strict(),
]);
export type MetricEvent = z.infer<typeof metricEventSchema>;
