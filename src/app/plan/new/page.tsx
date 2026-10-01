import type { Metadata } from "next";

import { PlanNew } from "@/features/plan/PlanNew";

export const metadata: Metadata = {
  title: "청사진 만들기",
  robots: { index: false },
};

export default function PlanNewPage() {
  return <PlanNew />;
}
