import type { Metadata } from "next";
import { Suspense } from "react";

import { PlanView } from "@/features/plan/PlanView";
import { Notice } from "@/features/ui/Notice";

export const metadata: Metadata = {
  title: "내 청사진",
  description: "되고 싶은 것을 향해 언제 어떤 정책을 쓸지 시간축에 놓아 보는 살아있는 설계도.",
  robots: { index: false },
};

export default function PlanPage() {
  // ?add=를 읽는 useSearchParams는 정적 페이지에서 Suspense 경계가 필요하다 (카드 페이지와 같다).
  return (
    <Suspense fallback={<Notice>불러오는 중…</Notice>}>
      <PlanView />
    </Suspense>
  );
}
