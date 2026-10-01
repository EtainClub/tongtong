"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Planning, Policy } from "@/content/schema";
import { CorrectionPanel } from "@/features/card/CorrectionPanel";
import { ApplicationBox, ClaimItem, EvidenceChip } from "@/features/card/Reveal";
import { primaryButton } from "@/features/card/session";
import { CATEGORY_LABELS, PLACEMENT_ROLE_LABELS, RECURRENCE_LABELS, formatDate } from "@/features/labels";
import { startOf } from "@/lib/policy-state";
import { markFactsSeen } from "@/lib/seen-facts";

/*
 * 정책 페이지 (청사진 설계 2.4).
 *
 * 카드가 없는 정책 항목도 보여 줄 곳이다. 사실을 바로 보여 준다 — 따져보기(판단)는 카드의 몫이다.
 * 카드가 있는 정책을 여기서 보면 그 사실을 본 것으로 기억한다. 그 카드는 훅 판단을 건너뛴다 (2.5).
 * 정책은 해마다 바뀐다 — 공식 공고로 다시 확인하라는 말을 늘 위에 둔다 (10장 1번).
 */
export function PolicyView({ policy, hasCard }: { policy: Policy; hasCard: boolean }) {
  const [now] = useState(() => new Date());
  useEffect(() => {
    if (hasCard) markFactsSeen(policy.id);
  }, [hasCard, policy.id]);

  const sources = new Map(policy.sources.map((s) => [s.id, s]));

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-24">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <p className="mt-10 text-[13px] text-smoke">
        정책 ·{" "}
        <Link href={`/topics/${policy.category}`} className="underline underline-offset-4 hover:text-graphite">
          {CATEGORY_LABELS[policy.category]}
        </Link>
      </p>
      <h1 className="mt-1 text-[36px] leading-[1.17] font-light tracking-[-0.02em]">{policy.name}</h1>
      {policy.summary && <p className="mt-3 text-[17px] leading-relaxed">{policy.summary}</p>}
      <p className="mt-4 text-[14px] text-smoke">정책은 해마다 바뀌어요. 신청 전에 공식 공고로 다시 확인하세요. 대상인지는 신청 기관이 정해요.</p>

      {hasCard && (
        <div className="mt-8">
          <Link href={`/card/${policy.id}`} className={`${primaryButton} block text-center`}>
            따져보기
          </Link>
          <p className="mt-2 text-[13px] text-smoke">이미 내용을 봤으니 처음 문장을 믿는지는 묻지 않아요.</p>
        </div>
      )}

      <ApplicationBox applications={policy.policy.applications} now={now} />

      <section aria-labelledby="facts-title" className="mt-10">
        <h2 id="facts-title" className="text-[20px] font-medium">
          무엇을 지원하나
        </h2>
        <ul className="stagger mt-4 flex flex-col gap-4">
          {policy.claims.map((claim) => (
            <ClaimItem key={claim.id} claim={claim} sources={sources} now={now} />
          ))}
        </ul>
      </section>

      {policy.planning && <PlanningFacts planning={policy.planning} />}

      {policy.counterpoints.length > 0 && (
        <section aria-labelledby="counter-title" className="mt-10">
          <h2 id="counter-title" className="text-[20px] font-medium">
            비판과 한계
          </h2>
          <ul className="stagger mt-4 flex flex-col gap-4">
            {policy.counterpoints.map((claim) => (
              <ClaimItem key={claim.id} claim={claim} sources={sources} now={now} />
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sources-title" className="mt-10">
        <h2 id="sources-title" className="text-[20px] font-medium">
          원자료
        </h2>
        <ul className="mt-4 flex flex-col">
          {policy.sources.map((source) => (
            <li key={source.id} className="border-t border-stone py-3">
              <p className="text-[15px]">{source.title}</p>
              <div className="mt-1.5">
                <EvidenceChip source={source} />
              </div>
            </li>
          ))}
        </ul>
        {/* 초안은 공개 조건(원문 대조)을 아직 통과하지 않았다 — 날짜를 대조한 날처럼 보이게 하지 않는다. */}
        <p className="mt-4 text-[13px] text-smoke">
          {policy.publishStatus === "published" ? `원문 대조 ${formatDate(startOf(policy.reviewedAt))}` : "초안 — 원문 대조 전"}
        </p>
      </section>

      <details className="mt-10 border-t border-stone pt-6">
        <summary className="cursor-pointer text-[14px] text-graphite underline underline-offset-4">이 정보가 틀렸나요?</summary>
        <div className="mt-4">
          <CorrectionPanel card={policy} />
        </div>
      </details>
    </main>
  );
}

export function ageText(age: NonNullable<Planning["age"]>): string {
  if (age.min !== undefined && age.max !== undefined) return `만 ${age.min}–${age.max}세`;
  if (age.max !== undefined) return `만 ${age.max}세 이하`;
  return `만 ${age.min}세 이상`;
}

/** 청사진에 넣을 때 보는 값. 모두 위 사실(claim)에서 옮긴 것이다 — 근거는 위에 있다. */
function PlanningFacts({ planning }: { planning: Planning }) {
  const rows: [string, string][] = [
    ["하는 일", planning.roles.map((role) => PLACEMENT_ROLE_LABELS[role]).join(" · ")],
    ...(planning.age ? [["나이", ageText(planning.age)] as [string, string]] : []),
    ...(planning.durationMonths ? [["지원 기간", `${planning.durationMonths.value}개월`] as [string, string]] : []),
    ["다시 열리나", planning.recurrence ? RECURRENCE_LABELS[planning.recurrence.kind] : "공고로 확인해요"],
  ];
  return (
    <section aria-labelledby="planning-title" className="mt-10">
      <h2 id="planning-title" className="text-[20px] font-medium">
        계획할 때 볼 것
      </h2>
      <dl className="mt-4 flex flex-col">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-t border-stone py-3">
            <dt className="text-graphite">{label}</dt>
            <dd className="text-right">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
