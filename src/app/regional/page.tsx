import type { Metadata } from "next";

import { RegionalPolicies } from "@/features/regional/RegionalPolicies";

export const metadata: Metadata = {
  title: "우리 지역 청년 정책",
  robots: { index: false },
};

export default function RegionalPage() {
  return <RegionalPolicies />;
}
