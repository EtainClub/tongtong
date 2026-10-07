import type { Metadata } from "next";

import { RegionalPolicies } from "@/features/regional/RegionalPolicies";

export const metadata: Metadata = {
  title: "우리 지역 청년 정책",
  robots: { index: false },
};

/** ?category= — 주제 화면에서 올 때 고를 분야(온통청년 큰 분야 이름). 모르는 값이면 목록이 전체로 둔다. */
export default async function RegionalPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { category } = await searchParams;
  return <RegionalPolicies initialCategory={typeof category === "string" ? category.slice(0, 20) : undefined} />;
}
