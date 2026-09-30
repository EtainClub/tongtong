import type { Metadata } from "next";

import { History } from "@/features/me/History";

export const metadata: Metadata = { title: "판단 이력", robots: { index: false } };

export default function HistoryPage() {
  return <History />;
}
