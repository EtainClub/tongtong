import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { findCard } from "@/content/cards";
import { POLICIES, findPolicy } from "@/content/policies";
import { PolicyView } from "@/features/policy/PolicyView";

export const dynamicParams = false;

export function generateStaticParams() {
  return POLICIES.map((policy) => ({ id: policy.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const policy = findPolicy((await params).id);
  return policy ? { title: policy.name, description: policy.summary ?? `${policy.name} — 무엇을 지원하는지와 원자료` } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const policy = findPolicy((await params).id);
  if (!policy) notFound();
  return <PolicyView policy={policy} hasCard={Boolean(findCard(policy.id))} />;
}
