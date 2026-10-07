"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

import { apiFetch, describeError } from "@/lib/firebase/api";
import type { RegionalPolicy } from "@/lib/regional";
import type { Region } from "@/lib/user-state";

/*
 * 지역 정책 목록 한 번 받기 — 목록 화면과 진입 링크("N개")가 같이 쓴다.
 * 탭이 열려 있는 동안 지역마다 한 번만 부른다(서버도 하루 캐시). 사용자마다 다르지 않은 공식 데이터라 지역으로만 나눈다.
 * 실패는 두지 않는다 — 다음에 다시 부른다.
 */
const cache = new Map<string, Promise<RegionalPolicy[]>>();

function load(user: User, region: Region): Promise<RegionalPolicy[]> {
  const key = `${region.sido}:${region.sigungu ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const value = apiFetch<{ policies: RegionalPolicy[] }>(user, "/api/regional", {
    method: "POST",
    body: { sido: region.sido, ...(region.sigungu && { sigungu: region.sigungu }) },
  }).then((result) => result.policies);
  cache.set(key, value);
  value.catch(() => cache.delete(key));
  return value;
}

/** region이 null이면 부르지 않는다. 지역이 바뀌면 새로 받는다. */
export function useRegionalPolicies(user: User | null, region: Region | null) {
  // region 객체가 아니라 코드가 바뀔 때만 다시 부른다.
  const sido = region?.sido;
  const sigungu = region?.sigungu;
  const key = sido ? `${sido}:${sigungu ?? ""}` : null;
  const [result, setResult] = useState<{ key: string; policies: RegionalPolicy[] | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!user || !sido || !key) return;
    let live = true;
    load(user, { sido, ...(sigungu && { sigungu }) })
      .then((policies) => live && setResult({ key, policies, error: null }))
      .catch((caught) => live && setResult({ key, policies: null, error: describeError(caught, "지역 정책을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.") }));
    return () => {
      live = false;
    };
  }, [user, key, sido, sigungu]);

  // 다른 지역의 지난 결과는 보이지 않는다.
  const current = result && result.key === key ? result : null;
  return { policies: current?.policies ?? null, error: current?.error ?? null };
}
