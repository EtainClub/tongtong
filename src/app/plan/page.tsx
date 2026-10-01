import type { Metadata } from "next";

import { PlanView } from "@/features/plan/PlanView";

export const metadata: Metadata = {
  title: "내 청사진",
  description: "되고 싶은 것을 향해 언제 어떤 정책을 쓸지 시간축에 놓아 보는 살아있는 설계도.",
  robots: { index: false },
};

export default function PlanPage() {
  return <PlanView />;
}
