import type { Card, Game } from "@/content/schema";

/*
 * 카드 한 장을 필수 경로로 끝내는 데 드는 시간 (설계 7장 estimatedSeconds).
 *
 * 손으로 적지 않고 내용에서 계산한다 — 카드를 고치면 시간도 따라 바뀐다.
 * 읽기: 한글 초당 8자(분당 약 500자). 누르기: 한 번 고르는 데 4–5초.
 * 원자료·AI는 곁가지라 넣지 않는다 (검토 문서 7.2).
 */

const CHARS_PER_SECOND = 8;
const CHOICE_SECONDS = 4;
const JUDGMENT_SECONDS = 5;

const readSeconds = (texts: readonly string[]) => texts.join("").replace(/\s/g, "").length / CHARS_PER_SECOND;

function gameSeconds(game: Game): number {
  switch (game.type) {
    case "multiple_choice":
      return readSeconds([game.question, ...game.options.map((o) => o.label)]) + CHOICE_SECONDS;
    case "guess_amount":
      return readSeconds([game.question, game.premise]) + CHOICE_SECONDS * 2;
    case "eligibility":
      return readSeconds([game.question, ...game.steps.map((s) => s.question)]) + CHOICE_SECONDS * game.steps.length;
    case "slider":
      return readSeconds([game.question, game.premise ?? ""]) + CHOICE_SECONDS * 2;
    case "yes_no":
      return readSeconds([game.question, game.note]) + CHOICE_SECONDS;
    case "sort":
      return readSeconds([game.question, ...game.items.map((i) => `${i.label}${i.value}`)]) + CHOICE_SECONDS * game.items.length;
    case "before_after":
      return readSeconds([game.question, game.before.label, game.before.detail, game.after.label, game.after.detail]) + CHOICE_SECONDS;
    case "budget":
      return readSeconds([game.question, game.premise ?? "", ...game.items.map((i) => i.label)]) + CHOICE_SECONDS * game.items.length;
  }
}

export function estimateSeconds(card: Card): number {
  const reading = readSeconds([card.hook, ...card.shorts, ...card.claims.map((c) => c.text), ...card.counterpoints.map((c) => c.text)]);
  const judgments = (card.flow.trust ? JUDGMENT_SECONDS * 2 : 0) + (card.flow.opinion ? JUDGMENT_SECONDS : 0); // 훅 신뢰 + 훅 정확도, 정책 평가
  return Math.round(reading + gameSeconds(card.game) + judgments);
}

/** "약 1분", "약 1분 30초". 30초 단위로 반올림하고 1분 미만은 1분으로 적는다. */
export function formatEstimate(seconds: number): string {
  const halves = Math.max(2, Math.round(seconds / 30));
  const minutes = Math.floor(halves / 2);
  return halves % 2 ? `약 ${minutes}분 30초` : `약 ${minutes}분`;
}
