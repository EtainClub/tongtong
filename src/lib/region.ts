"use client";

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

import { findDistrict, findSido } from "@/content/regions";
import { apiFetch } from "@/lib/firebase/api";
import { useUserData } from "@/lib/firebase/user-data";
import type { Profile, Region } from "@/lib/user-state";

/*
 * 사는 지역 — 기기와 서버 둘 다에 둔다 (docs/regional-benefits-review.md, 2026-10-06 결정).
 *
 * 서버(프로필 region)가 기준이다. 기기(브라우저 저장소)는 그 사본 — 프로필을 읽기 전에도, 오프라인에서도 바로 쓴다.
 * 다른 기기에서 지웠으면 이 기기의 사본도 지운다. 지역 정책을 보여 주는 데만 쓰고, 측정·AI에는 싣지 않는다.
 */

const KEY = "tongtong:region";

function readLocal(): Region | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const { sido, sigungu } = value as Record<string, unknown>;
    if (typeof sido !== "string" || !findSido(sido)) return null;
    return typeof sigungu === "string" && findDistrict(sido, sigungu) ? { sido, sigungu } : { sido };
  } catch {
    return null;
  }
}

function writeLocal(region: Region | null) {
  try {
    if (region) localStorage.setItem(KEY, JSON.stringify(region));
    else localStorage.removeItem(KEY);
  } catch {
    // 저장소를 쓸 수 없다 — 서버 값만 쓴다.
  }
}

/** "서울특별시 마포구", 시·군·구가 없으면 시·도만. */
export function regionLabel(region: Region): string {
  const sido = findSido(region.sido)?.name ?? "";
  const district = region.sigungu ? findDistrict(region.sido, region.sigungu) : undefined;
  return district ? `${sido} ${district}` : sido;
}

/** 지금 지역 — 프로필을 읽었으면 프로필, 아니면 기기의 사본. */
export function useRegion(): Region | null {
  const data = useUserData();
  // 브라우저에서만 읽는다. 이 값을 그리는 화면은 프로필을 읽은 뒤에 그려서 서버 렌더와 어긋나지 않는다.
  const [local] = useState<Region | null>(() => (typeof window === "undefined" ? null : readLocal()));
  const server = data.ready && data.profile ? (data.profile.region ?? null) : undefined;
  // 프로필이 기준 — 사본을 맞춘다.
  useEffect(() => {
    if (server !== undefined) writeLocal(server);
  }, [server]);
  return server === undefined ? local : server;
}

/** 지역 저장(null은 지움). 프로필의 다른 값은 서버가 그대로 둔다. */
export async function saveRegion(user: User, profile: Profile, region: Region | null) {
  await apiFetch(user, "/api/profile", { method: "PUT", body: { audienceType: profile.audienceType, lifeStages: profile.lifeStages, region } });
  writeLocal(region);
}
