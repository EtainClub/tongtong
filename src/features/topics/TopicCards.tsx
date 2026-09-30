"use client";

import Link from "next/link";
import { useState } from "react";

import { CARDS } from "@/content/cards";
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

  const cards = CARDS.map((card, index) => ({ card, index, application: currentApplication(card.policy.applications, now) }))
    // 트랙을 아는 사용자에게는 자기 트랙 카드만. 첫 방문(프로필 없음)에는 모두 보인다.
    .filter(({ card }) => card.category === topic && (!data.profile || card.audience.includes(data.profile.audienceType)))
    .sort((a, b) => Number(a.application?.state === "closed") - Number(b.application?.state === "closed") || a.index - b.index);

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <p className="mt-10 text-[13px] text-smoke">주제</p>
      <h1 className="mt-1 text-[36px] leading-[1.17] font-light tracking-[-0.02em]">{CATEGORY_LABELS[topic]}</h1>
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
                  <span className="mt-2 block text-[20px] leading-snug font-light">{card.hook}</span>
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
    </main>
  );
}
