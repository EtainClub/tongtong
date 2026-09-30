"use client";

import { ProfileForm } from "@/features/onboarding/ProfileForm";

/**
 * 첫 진입 (설계 2장). 생년월일을 받지 않는다 — 청소년/청년, 생활 상황, 관심 주제만.
 * 저장하면 프로필 구독이 바뀌어 피드가 이 화면을 내린다.
 */
export function Onboarding() {
  return <ProfileForm mode="onboarding" />;
}
