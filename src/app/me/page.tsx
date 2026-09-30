import type { Metadata } from "next";

import { MyRecords } from "@/features/me/MyRecords";

export const metadata: Metadata = { title: "내 기록", robots: { index: false } };

export default function MePage() {
  return <MyRecords />;
}
