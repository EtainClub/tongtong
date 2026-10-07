"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { findSido } from "@/content/regions";
import { RegionSetting } from "@/features/me/RegionSetting";
import { Notice } from "@/features/ui/Notice";
import { kstDate } from "@/lib/date";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";
import { track } from "@/lib/metrics/track";
import { useUserData } from "@/lib/firebase/user-data";
import { regionLabel, useRegion } from "@/lib/region";
import { applyState, type ApplyState, type RegionalPolicy } from "@/lib/regional";
import type { Region } from "@/lib/user-state";

/*
 * 우리 지역 청년 정책 /regional (docs/regional-benefits-review.md R1).
 *
 * 온통청년 공식 데이터를 그대로 옮긴다 — 통통이 원문과 대조한 정책 항목이 아니다. 그래서:
 *   - 맨 위에 "통통이 확인하지 않았어요"를 늘 둔다. 신청 전에 원문을 보라고 한다.
 *   - 청사진·카드에 넣는 버튼이 없다. 받을 수 있는지 판정하지 않는다(나이는 적힌 그대로 보여 줄 뿐).
 * 순서: 신청 중(마감 빠른 순) → 상시 → 곧 열림 → 기간 확인 필요 → 마감(접어 둠).
 */

const GROUPS: { state: ApplyState; title: string }[] = [
  { state: "open", title: "신청 중" },
  { state: "always", title: "상시" },
  { state: "upcoming", title: "곧 열려요" },
  { state: "unknown", title: "신청 기간을 원문에서 확인해요" },
];

const md = (date: string) => `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}`;

export function RegionalPolicies() {
  const { user } = useAuth();
  const data = useUserData();
  const region = useRegion();

  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight">우리 지역 청년 정책</h1>
      {data.profile?.audienceType !== "young_adult" ? (
        <p className="mt-4 text-graphite">청년(19–34) 정책 목록이라 청년으로 시작한 경우에만 볼 수 있어요.</p>
      ) : region ? (
        <List key={`${region.sido}:${region.sigungu ?? ""}`} user={user} region={region} />
      ) : (
        <>
          <p className="mt-4 text-[15px] text-graphite">사는 지역을 고르면 그 지역의 청년 정책을 모아 보여 드려요.</p>
          {data.profile && <RegionSetting user={user} profile={data.profile} />}
        </>
      )}
    </main>
  );
}

function List({ user, region }: { user: User; region: Region }) {
  const [policies, setPolicies] = useState<RegionalPolicy[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [today] = useState(() => kstDate());

  // 열람 수만 — 지역은 싣지 않는다.
  useEffect(() => track({ event: "regional_open" }), []);

  useEffect(() => {
    let live = true;
    apiFetch<{ policies: RegionalPolicy[] }>(user, "/api/regional", { method: "POST", body: { sido: region.sido, ...(region.sigungu && { sigungu: region.sigungu }) } })
      .then((result) => live && setPolicies(result.policies))
      .catch((caught) => live && setError(describeError(caught, "지역 정책을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.")));
    return () => {
      live = false;
    };
  }, [user, region.sido, region.sigungu]);

  const sidoName = findSido(region.sido)?.name ?? "";
  const categories = [...new Set((policies ?? []).map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const shown = (policies ?? []).filter((p) => !category || p.category === category);
  const byState = (state: ApplyState) =>
    shown
      .filter((p) => applyState(p, today) === state)
      .sort((a, b) => (a.apply.kind === "period" && b.apply.kind === "period" ? (state === "upcoming" ? a.apply.start.localeCompare(b.apply.start) : a.apply.end.localeCompare(b.apply.end)) : a.name.localeCompare(b.name, "ko")));
  const closed = byState("closed");

  return (
    <>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-[15px] text-graphite">
        <span>{regionLabel(region)}</span>
        <Link href="/me" className="text-[14px] underline underline-offset-4">
          바꾸기
        </Link>
      </p>
      {/* 확인하지 않은 공식 데이터 — 늘 보이게 (2026-10-06 결정). */}
      <p className="mt-4 rounded-card bg-pending-tint px-4 py-3 text-[14px] leading-relaxed text-pending">
        온통청년(한국고용정보원)의 공식 데이터를 그대로 옮겼어요. <strong className="font-semibold">통통이 원문과 확인하지 않았어요.</strong> 신청 전에 원문을 꼭 확인하세요. 대상인지는 신청 기관이 정해요.
      </p>

      {error && <p className="mt-8 text-graphite">{error}</p>}
      {!error && !policies && <p className="fade-in-late mt-8 text-graphite">불러오는 중…</p>}
      {policies && policies.length === 0 && <p className="mt-8 text-graphite">이 지역에 등록된 청년 정책을 찾지 못했어요.</p>}

      {categories.length > 1 && (
        <div role="radiogroup" aria-label="분야" className="mt-6 flex flex-wrap gap-2">
          {[null, ...categories].map((option) => (
            <button
              key={option ?? "all"}
              type="button"
              role="radio"
              aria-checked={category === option}
              onClick={() => setCategory(option)}
              className={`rounded-pill border px-4 py-1.5 text-[14px] ${category === option ? "border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
            >
              {option ?? "전체"}
            </button>
          ))}
        </div>
      )}

      {GROUPS.map(({ state, title }) => {
        const items = byState(state);
        if (items.length === 0) return null;
        return (
          <section key={state} className="mt-8">
            <h2 className="text-[18px] font-bold tracking-tight">
              {title} <span className="font-mono text-[14px] font-normal text-smoke tabular">{items.length}</span>
            </h2>
            <ul className="mt-2 flex flex-col">
              {items.map((policy) => (
                <PolicyRow key={policy.id} policy={policy} state={state} sidoName={sidoName} />
              ))}
            </ul>
          </section>
        );
      })}

      {closed.length > 0 && (
        <details className="mt-8 border-t border-stone pt-4">
          <summary className="disclosure text-[15px] font-semibold">
            <span>
              신청이 끝난 정책 <span className="font-mono font-normal text-smoke tabular">{closed.length}</span>
            </span>
          </summary>
          <ul className="mt-2 flex flex-col">
            {closed.map((policy) => (
              <PolicyRow key={policy.id} policy={policy} state="closed" sidoName={sidoName} />
            ))}
          </ul>
        </details>
      )}

      {policies && policies.length > 0 && (
        <p className="mt-10 text-[13px] text-smoke">
          출처: 온통청년 청년정책 API (한국고용정보원). 하루에 한 번 새로 받아요. 전국 정책은 빼고 이 지역 정책만 모았어요.
        </p>
      )}
    </>
  );
}

function PolicyRow({ policy, state, sidoName }: { policy: RegionalPolicy; state: ApplyState; sidoName: string }) {
  const when =
    policy.apply.kind === "period"
      ? state === "open"
        ? `${md(policy.apply.end)}까지`
        : state === "upcoming"
          ? `${md(policy.apply.start)}부터`
          : `${md(policy.apply.end)} 마감`
      : null;
  return (
    <li className="border-t border-stone py-4">
      <p className="text-[16px] font-medium">
        {policy.url ? (
          <a
            href={policy.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ event: "regional_policy_open", policyId: policy.id })}
            className="underline-offset-4 hover:underline"
          >
            {policy.name} <span className="text-[13px] text-smoke">↗</span>
          </a>
        ) : (
          policy.name
        )}
      </p>
      <p className="mt-1 text-[13px] text-smoke">
        {[policy.scope === "district" ? "이 시·군·구" : `${sidoName} 전체`, policy.agency, policy.subcategory || policy.category].filter(Boolean).join(" · ")}
      </p>
      {policy.summary && <p className="mt-2 text-[14px] leading-relaxed text-graphite">{policy.summary}</p>}
      <p className="mt-2 text-[13px] text-graphite">
        {when && <span className="font-medium text-ink">{when}</span>}
        {when && (policy.age || policy.updatedAt) && " · "}
        {policy.age && <span>공고상 나이 {ageText(policy.age)}</span>}
        {policy.age && policy.updatedAt && " · "}
        {policy.updatedAt && <span className="text-smoke">수정 {policy.updatedAt.replaceAll("-", ".")}</span>}
      </p>
    </li>
  );
}

function ageText({ min, max }: { min: number; max: number }) {
  if (min && max) return min === max ? `${min}세` : `${min}–${max}세`;
  return min ? `${min}세 이상` : `${max}세 이하`;
}
