import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CARDS, findCard } from "@/content/cards";
import { CardScreen } from "@/features/card/CardScreen";
import { Notice } from "@/features/ui/Notice";

export const dynamicParams = false;

export function generateStaticParams() {
  return CARDS.map((card) => ({ id: card.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const card = findCard((await params).id);
  return card ? { title: card.shortTitle, description: card.hook } : {};
}

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const card = findCard((await params).id);
  if (!card) notFound();
  // ?full=1을 읽는 useSearchParams는 정적 페이지에서 Suspense 경계가 필요하다.
  return (
    <Suspense fallback={<Notice>불러오는 중…</Notice>}>
      <CardScreen card={card} />
    </Suspense>
  );
}
