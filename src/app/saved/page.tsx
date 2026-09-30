import type { Metadata } from "next";

import { Saved } from "@/features/me/Saved";

export const metadata: Metadata = { title: "저장한 카드", robots: { index: false } };

export default function SavedPage() {
  return <Saved />;
}
