import type { Metadata } from "next";

import { Revisions } from "@/features/plan/Revisions";

export const metadata: Metadata = {
  title: "REV 기록",
  robots: { index: false },
};

export default function RevisionsPage() {
  return <Revisions />;
}
