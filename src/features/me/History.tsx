"use client";

import Link from "next/link";

import { CARDS } from "@/content/cards";
import { reasonLabels } from "@/features/card/ReasonChips";
import { formatDate } from "@/features/labels";
import { Notice } from "@/features/ui/Notice";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";
import { HOOK_ACCURACY_LABELS, SCALE_LABELS, type HookAccuracy } from "@/lib/judgment";
import { canRevisit } from "@/lib/revisit";
import { timeline, type TimelineRole } from "@/lib/timeline";
import type { StoredJudgment } from "@/lib/user-state";

/*
 * 판단 이력 (설계 65장, 로드맵 4.6).
 *
 * 카드마다 무엇을 언제 골랐는지를 시간순으로만 적는다. 점수·방향·"생각이 변한 카드 수"를
 * 만들지 않는다 (검토 문서 2.5). 카드 버전이 바뀐 뒤의 판단에는 버전을 붙여 원인을 가를 수 있게 한다.
 */

const ROW_LABEL: Record<string, string> = {
  "initial:trust": "처음 본 문장",
  "final:hookAccuracy": "사실을 본 뒤",
  "final:opinion": "이 정책은",
  "revisit:opinion": "다시 봤을 때",
};

function valueText(judgment: StoredJudgment): string {
  if (judgment.axis === "hookAccuracy") return HOOK_ACCURACY_LABELS[judgment.value as HookAccuracy];
  if (judgment.value === null) return "모르겠음";
  return SCALE_LABELS[judgment.axis][judgment.value - 1];
}

export function History() {
  const { user } = useAuth();
  const data = useUserData();
  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;

  const entries = CARDS.map((card) => ({ card, judgments: data.states.get(card.id)?.judgments ?? [] }))
    .filter((entry) => entry.judgments.length > 0)
    .sort((a, b) => b.judgments[b.judgments.length - 1].at.localeCompare(a.judgments[a.judgments.length - 1].at));

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/me" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 내 기록
      </Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-tight">판단 이력</h1>
      <p className="mt-3 text-[15px] text-graphite">무엇을 언제 골랐는지 그대로 남겨요. 바뀐 것도, 그대로인 것도 같은 기록이에요.</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-smoke">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3.5 rounded-full border-2 border-dashed border-burgundy" aria-hidden /> 처음
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full bg-navy" aria-hidden /> 가장 최근
        </span>
        <span>같은 질문끼리만 나란히 놓아요.</span>
      </p>

      {entries.length === 0 ? (
        <p className="mt-16 text-center text-graphite">아직 기록이 없어요.</p>
      ) : (
        <div className="stagger mt-12 flex flex-col gap-12">
          {entries.map(({ card, judgments }) => (
            <section key={card.id} aria-labelledby={`history-${card.id}`}>
              <h2 id={`history-${card.id}`} className="text-[18px] font-bold tracking-tight">
                <Link href={`/card/${card.id}`} className="underline-offset-4 hover:underline">
                  {card.shortTitle}
                </Link>
              </h2>
              <ol className="mt-4 flex flex-col">
                {timeline(judgments).map(({ judgment, role, trigger }, index) => {
                  const versionChanged = index > 0 && judgment.cardVersion !== judgments[index - 1].cardVersion;
                  return (
                    <li key={`${judgment.sessionId}-${judgment.phase}-${judgment.axis}`} className="border-t border-stone py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-graphite">
                          {ROW_LABEL[`${judgment.phase}:${judgment.axis}`]}
                          {trigger && <span className="ml-2 text-[12px] text-smoke">{trigger === "updated" ? "정책 변경 후" : "다시 보기"}</span>}
                          {versionChanged && <span className="ml-2 rounded-pill bg-taupe px-2 py-0.5 text-[11px]">카드 v{judgment.cardVersion}</span>}
                        </span>
                        <span className="text-right">
                          {valueText(judgment)}
                          {judgment.axis === "opinion" && judgment.reasonCodes.length > 0 && (
                            <span className="block text-[13px] text-graphite">{reasonLabels(card, judgment.reasonCodes).join(" · ")}</span>
                          )}
                          <span className="block font-mono text-[11px] text-smoke tabular">{formatDate(Date.parse(judgment.at))}</span>
                        </span>
                      </div>
                      {role && judgment.axis !== "hookAccuracy" && typeof judgment.value === "number" && <ScaleDot value={judgment.value} role={role} />}
                    </li>
                  );
                })}
              </ol>
              {canRevisit(card, data.states.get(card.id)) && (
                <Link href={`/card/${card.id}`} className="mt-3 inline-block rounded-pill border border-stone px-4 py-2 text-[14px] hover:border-graphite">
                  지금 다시 판단하기
                </Link>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

/**
 * 척도 위의 점 하나 (로드맵 4.6). 별 대신 다섯 칸 위의 자리.
 * 데이터라서 색을 쓴다 — 가장 최근은 navy 채운 점, 처음은 burgundy 점선 원, 그 사이는 smoke.
 */
function ScaleDot({ value, role }: { value: 1 | 2 | 3 | 4 | 5; role: TimelineRole }) {
  const left = `${((value - 1) / 4) * 100}%`;
  const dot =
    role === "latest"
      ? "size-3 bg-navy"
      : role === "first"
        ? "size-3.5 border-2 border-dashed border-burgundy bg-eggshell"
        : "size-2.5 bg-smoke";
  return (
    <div aria-hidden className="relative mx-2 mt-2 h-4">
      <div className="absolute top-1/2 right-0 left-0 h-px bg-stone" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-stone" style={{ left: `${i * 25}%` }} />
      ))}
      <span className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${dot}`} style={{ left }} />
    </div>
  );
}
