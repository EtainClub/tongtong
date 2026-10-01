import { ALL_POLICIES, SHOW_DRAFTS } from "../policies";
import { cardExperienceSchema, resolveCard, type Card, type Policy } from "../schema";
import { RAW_CARDS } from "./raw";

const policyById = new Map(ALL_POLICIES.map((policy) => [policy.id, policy]));

/** 카드가 얹힌 정책 항목. 없으면 콘텐츠가 틀린 것이라 빌드가 멈춘다. */
export function policyOf(policyId: string): Policy {
  const policy = policyById.get(policyId);
  if (!policy) throw new Error(`카드 ${policyId}의 정책 항목이 없다 — policies/raw.ts에 등록했나`);
  return policy;
}

/** 모든 카드(초안 포함) — 카드 경험과 정책 항목을 합친 것. 모양이 틀리면 빌드가 멈춘다. 검증·검수 스크립트가 쓴다. */
export const ALL_CARDS: Card[] = RAW_CARDS.map((raw) => {
  const experience = cardExperienceSchema.parse(raw);
  return resolveCard(policyOf(experience.policyId), experience);
});

/** 앱이 쓰는 카드 — 피드, 카드 페이지, 판단 API, 집계가 모두 이것만 본다. 운영에서는 카드와 항목이 모두 공개여야 보인다. */
export const CARDS: Card[] = SHOW_DRAFTS
  ? ALL_CARDS
  : ALL_CARDS.filter((card) => card.publishStatus === "published" && policyOf(card.id).publishStatus === "published");

export function findCard(id: string): Card | undefined {
  return CARDS.find((card) => card.id === id);
}
