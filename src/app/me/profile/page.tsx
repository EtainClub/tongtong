import type { Metadata } from "next";

import { ProfileEdit } from "@/features/me/ProfileEdit";

export const metadata: Metadata = { title: "내 상황 · 관심 주제", robots: { index: false } };

export default function ProfilePage() {
  return <ProfileEdit />;
}
