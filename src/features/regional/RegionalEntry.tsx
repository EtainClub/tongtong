"use client";

import Link from "next/link";
import { useState } from "react";

import { useRegionalPolicies } from "@/features/regional/useRegionalPolicies";
import { kstDate } from "@/lib/date";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";
import { regionLabel, useRegion } from "@/lib/region";
import { liveCount } from "@/lib/regional";

/**
 * "우리 지역 청년 정책 N개" 진입 (docs/regional-benefits-review.md R1) — 피드 끝 화면, 주제 화면.
 * N은 신청이 끝나지 않은 정책 수. category를 주면(주제 화면) 그 분야만 세고, 목록도 그 분야를 골라 둔 채 연다 —
 * 그 분야에 열린 정책이 없으면 링크를 숨긴다. 청년만(온통청년은 청년 정책).
 * 수를 받기 전·못 받았을 때는 수 없이 보인다. 지역을 고르지 않았으면 고르러 가는 링크.
 */
export function RegionalEntry({ category, className = "" }: { category?: string; className?: string }) {
  const { user } = useAuth();
  const data = useUserData();
  const region = useRegion();
  const { policies } = useRegionalPolicies(user, region);
  const [today] = useState(() => kstDate());

  if (!data.ready || data.profile?.audienceType !== "young_adult") return null;
  const count = policies ? liveCount(policies, today, category) : null;
  if (category && count === 0) return null;

  const href = category ? `/regional?category=${encodeURIComponent(category)}` : "/regional";
  return (
    <Link href={href} className={`block rounded-card border border-stone p-5 hover:border-graphite ${className}`}>
      <span className="block text-[17px]">
        우리 지역 {category ? `${category} ` : "청년 "}정책{count ? ` ${count}개` : ""} →
      </span>
      <span className="mt-1 block text-[14px] text-graphite">
        {region
          ? `${regionLabel(region)} 청년 정책${count ? " 가운데 신청이 끝나지 않은 것만 셌어요" : "을 모아 봐요"}. 공식 데이터를 그대로 옮긴 목록이에요.`
          : "사는 지역을 고르면 시·도, 시·군·구 청년 정책을 모아 봐요. 공식 데이터를 그대로 옮긴 목록이에요."}
      </span>
    </Link>
  );
}
