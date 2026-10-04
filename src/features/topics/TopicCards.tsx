"use client";

import Link from "next/link";
import { useState } from "react";

import { CARDS, findCard } from "@/content/cards";
import { POLICIES } from "@/content/policies";
import type { Card } from "@/content/schema";
import { APPLICATION_LABELS, CATEGORY_DESCRIPTIONS, CATEGORY_LABELS } from "@/features/labels";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";
import { currentApplication } from "@/lib/policy-state";

/**
 * 주제별 카드 (설계 56장 /topics/{topic}, 로드맵 4.7).
 * 피드와 달리 이미 본 카드도 보인다 — 따져본 카드에는 표시만 한다. 신청이 마감된 카드는 뒤로.
 * 로그인 전(첫 방문)에도 목록은 보인다.
 */
export function TopicCards({ topic }: { topic: Card["category"] }) {
  const { user } = useAuth();
  const data = useUserData();
  const [now] = useState(() => new Date());

  // 트랙을 아는 사용자에게는 자기 트랙 것만. 첫 방문(프로필 없음)에는 모두 보인다.
  const inTopic = (item: Pick<Card, "category" | "audience">) =>
    item.category === topic && (!data.profile || item.audience.includes(data.profile.audienceType));

  const cards = CARDS.map((card, index) => ({ card, index, application: currentApplication(card.policy.applications, now) }))
    .filter(({ card }) => inTopic(card))
    .sort((a, b) => Number(a.application?.state === "closed") - Number(b.application?.state === "closed") || a.index - b.index);
  const entries = POLICIES.filter((policy) => inTopic(policy) && !findCard(policy.id));

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <p className="mt-6 text-[13px] text-smoke">주제</p>
      <h1 className="mt-1 text-[28px] leading-tight font-bold tracking-tight">{CATEGORY_LABELS[topic]}</h1>
      <p className="mt-2 text-[15px] text-graphite">{CATEGORY_DESCRIPTIONS[topic]}</p>

      {cards.length === 0 ? (
        <p className="mt-10 text-graphite">아직 이 주제의 카드가 없어요.</p>
      ) : (
        <ul className="stagger mt-8 flex flex-col gap-3">
          {cards.map(({ card, application }) => {
            const done = Boolean(user && data.states.get(card.id)?.completedAt);
            return (
              <li key={card.id}>
                <Link href={`/card/${card.id}`} className="block rounded-card border border-stone p-5 hover:border-graphite">
                  <span className="flex items-center justify-between gap-3 text-[13px] text-smoke">
                    {card.shortTitle}
                    {done && <span className="rounded-pill border border-stone px-2 py-0.5 text-[11px] text-graphite">따져봄</span>}
                  </span>
                  <span className="mt-2 block text-[18px] leading-snug font-semibold tracking-tight">{card.hook}</span>
                  {application && (
                    <span className="mt-3 inline-block rounded-pill border border-stone px-3 py-0.5 text-[12px] text-graphite">
                      {application.app.label} {APPLICATION_LABELS[application.state]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* 카드가 아직 없는 정책 항목 (청사진 설계 2.4) — 따져보기 없이 사실만 있는 정책 페이지로 간다. */}
      {entries.length > 0 && (
        <section aria-labelledby="entries-title" className="mt-12">
          <h2 id="entries-title" className="text-[18px] font-bold tracking-tight">
            카드가 아직 없는 정책
          </h2>
          <p className="mt-1 text-[14px] text-smoke">따져보기 없이, 무엇을 지원하는지와 원자료만 있어요.</p>
          <ul className="mt-4 flex flex-col">
            {entries.map((policy) => (
              <li key={policy.id}>
                <Link href={`/policy/${policy.id}`} className="block border-t border-stone py-4 hover:text-graphite">
                  <span className="text-[16px]">{policy.name}</span>
                  {policy.summary && <span className="mt-1 block text-[14px] text-graphite">{policy.summary}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
