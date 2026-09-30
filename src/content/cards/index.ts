import { cardSchema, type Card } from "../schema";
import { RAW_CARDS } from "./raw";

/** 모든 카드(초안 포함). 모양이 틀린 카드가 있으면 빌드가 멈춘다. 검증·검수 스크립트가 쓴다. */
export const ALL_CARDS: Card[] = RAW_CARDS.map((raw) => cardSchema.parse(raw));

/**
 * 초안을 보여줄지. 운영 빌드에서는 공개(published) 카드만 보인다 — 검증 전 사실과
 * 비판 없는 카드가 새어 나가지 않게 (검토 문서 3장 4번, validateCard의 공개 조건).
 * 개발·테스트에서는 늘 보인다. 출시 전 미리보기는 NEXT_PUBLIC_SHOW_DRAFTS=true (apphosting.yaml).
 */
const showDrafts = process.env.NEXT_PUBLIC_SHOW_DRAFTS === "true" || process.env.NODE_ENV !== "production";

/** 앱이 쓰는 카드 — 피드, 카드 페이지, 판단 API, 집계가 모두 이것만 본다. */
export const CARDS: Card[] = showDrafts ? ALL_CARDS : ALL_CARDS.filter((card) => card.publishStatus === "published");

export function findCard(id: string): Card | undefined {
  return CARDS.find((card) => card.id === id);
}
