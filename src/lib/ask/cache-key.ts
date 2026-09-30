import { createHash } from "node:crypto";

import { cardVersion, type Card } from "@/content/schema";

/*
 * AI 답 캐시의 열쇠 (설계 33장, 로드맵 M8).
 *
 * 추천 질문만 캐시한다. 직접 쓴 질문에는 나이·소득 같은 개인 사정이 섞이고, 답이 그것을 되풀이할 수 있다 —
 * 질문과 답을 저장하지 않는다는 원칙(api/ask)을 지킨다. 추천 질문은 카드에 적힌 고정 문장이라 괜찮다.
 * 카드 버전이 열쇠에 들어가므로 카드가 바뀌면 캐시가 저절로 무효가 된다.
 */

/** 띄어쓰기·끝 문장부호·대소문자 차이는 같은 질문으로 본다. */
export const normalizeQuestion = (question: string) =>
  question
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?？!.。…\s]+$/u, "")
    .toLowerCase();

/** 추천 질문이면 캐시 열쇠, 아니면 null. */
export function askCacheKey(card: Card, question: string): string | null {
  const normalized = normalizeQuestion(question);
  if (!card.suggestedQuestions.some((q) => normalizeQuestion(q) === normalized)) return null;
  return createHash("sha256").update(`${card.id}\n${cardVersion(card)}\n${normalized}`).digest("hex").slice(0, 32);
}
