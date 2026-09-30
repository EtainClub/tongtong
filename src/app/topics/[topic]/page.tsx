import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Category } from "@/content/schema";
import { CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/features/labels";
import { TopicCards } from "@/features/topics/TopicCards";

export const dynamicParams = false;

export function generateStaticParams() {
  return Category.options.map((topic) => ({ topic }));
}

const parse = async (params: Promise<{ topic: string }>) => Category.safeParse((await params).topic).data;

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const topic = await parse(params);
  return topic ? { title: CATEGORY_LABELS[topic], description: CATEGORY_DESCRIPTIONS[topic] } : {};
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const topic = await parse(params);
  if (!topic) notFound();
  return <TopicCards topic={topic} />;
}
