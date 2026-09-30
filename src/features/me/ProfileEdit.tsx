"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ProfileForm } from "@/features/onboarding/ProfileForm";
import { Notice } from "@/features/ui/Notice";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";

/** 내 기록 → 내 상황 · 관심 주제 바꾸기. 저장하면 내 기록으로 돌아간다. */
export function ProfileEdit() {
  const router = useRouter();
  const { user } = useAuth();
  const data = useUserData();
  const missing = data.ready && !data.error && !data.profile;

  // 아직 첫 진입을 하지 않았다면 첫 화면(온보딩)으로 보낸다.
  useEffect(() => {
    if (missing) router.replace("/");
  }, [missing, router]);

  if (!user || !data.ready || missing) return <Notice>불러오는 중…</Notice>;
  if (data.error || !data.profile) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;

  return (
    <ProfileForm
      mode="edit"
      initial={{ audienceType: data.profile.audienceType, lifeStages: data.profile.lifeStages, interests: data.profile.interests ?? [] }}
      onSaved={() => router.push("/me")}
    />
  );
}
