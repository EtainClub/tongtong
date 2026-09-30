"use client";

import type { User } from "firebase/auth";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import type { Card } from "@/content/schema";
import { CardFlow } from "@/features/card/CardFlow";
import { RevisitFlow } from "@/features/card/RevisitFlow";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { Notice } from "@/features/ui/Notice";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData, type UserData } from "@/lib/firebase/user-data";
import { canRevisit } from "@/lib/revisit";

/**
 * 카드 페이지의 입구. 로그인·기록을 기다리고, 어느 흐름으로 갈지 고른다.
 *
 * 이미 정책 평가를 남긴 카드는 다시 판단하기로 간다 — 같은 숏츠와 게임을 또 풀게 하지 않는다.
 * ?full=1이면 처음부터 다시 본다.
 */
export function CardScreen({ card }: { card: Card }) {
  const { user, error: authError } = useAuth();
  const data = useUserData();
  const full = useSearchParams().get("full") === "1";

  if (authError) return <Notice>익명 로그인에 실패했어요. 새로고침해 주세요.</Notice>;
  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;
  // 링크로 바로 들어온 사람도 생활 상황과 동의 여부가 있어야 흐름이 성립한다.
  if (!data.profile) return <Onboarding />;

  return <Flow key={full ? "full" : "auto"} card={card} user={user} data={data} full={full} />;
}

/**
 * 흐름은 카드를 연 순간에 정한다. 처음 보기 도중 최종 평가를 저장하면 canRevisit가 참이 되는데,
 * 그때 화면이 다시 판단하기로 튀면 안 된다.
 */
function Flow({ card, user, data, full }: { card: Card; user: User; data: UserData; full: boolean }) {
  const [revisit] = useState(() => !full && canRevisit(card, data.states.get(card.id)));
  return revisit ? <RevisitFlow card={card} user={user} data={data} /> : <CardFlow card={card} user={user} data={data} />;
}
