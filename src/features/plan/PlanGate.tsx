"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import type { ReactNode } from "react";

import { Onboarding } from "@/features/onboarding/Onboarding";
import { Notice } from "@/features/ui/Notice";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveBlueprint, type ActiveBlueprint } from "@/lib/firebase/blueprint";
import { useUserData } from "@/lib/firebase/user-data";

/**
 * 청사진 화면의 입구 — 로그인·프로필·청사진 구독을 기다린다. 청사진은 청년만 (청사진 설계 10장).
 * 준비되면 children에 사용자와 활성 청사진을 넘긴다.
 */
export function PlanGate({ children }: { children: (props: { user: User; active: ActiveBlueprint }) => ReactNode }) {
  const { user, error: authError } = useAuth();
  const data = useUserData();
  const active = useActiveBlueprint();

  if (authError) return <Notice>익명 로그인에 실패했어요. 새로고침해 주세요.</Notice>;
  if (!user || !data.ready || !active.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error || active.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;
  if (!data.profile) return <Onboarding />;
  if (data.profile.audienceType !== "young_adult") {
    return (
      <Notice>
        청사진은 아직 청년만 쓸 수 있어요.{" "}
        <Link href="/" className="underline underline-offset-4">
          피드로
        </Link>
      </Notice>
    );
  }
  return <>{children({ user, active })}</>;
}
