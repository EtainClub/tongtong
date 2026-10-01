import { policySchema, type Policy } from "../schema";
import { RAW_POLICIES } from "./raw";

/** 모든 정책 항목(초안 포함). 모양이 틀린 항목이 있으면 빌드가 멈춘다. 검증·검수 스크립트와 카드 합치기가 쓴다. */
export const ALL_POLICIES: Policy[] = RAW_POLICIES.map((raw) => policySchema.parse(raw));

/**
 * 초안을 보여줄지. 운영 빌드에서는 공개(published)만 보인다 — 검증 전 사실과
 * 비판 없는 카드가 새어 나가지 않게 (검토 문서 3장 4번, validatePolicy·validateCard의 공개 조건).
 * 개발·테스트에서는 늘 보인다. 출시 전 미리보기는 NEXT_PUBLIC_SHOW_DRAFTS=true (apphosting.yaml).
 */
export const SHOW_DRAFTS = process.env.NEXT_PUBLIC_SHOW_DRAFTS === "true" || process.env.NODE_ENV !== "production";

/** 앱이 쓰는 정책 항목 — 청사진과 정책 페이지가 이것만 본다. */
export const POLICIES: Policy[] = SHOW_DRAFTS ? ALL_POLICIES : ALL_POLICIES.filter((policy) => policy.publishStatus === "published");

export function findPolicy(id: string): Policy | undefined {
  return POLICIES.find((policy) => policy.id === id);
}
