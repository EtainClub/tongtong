"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cardVersion, type Card } from "@/content/schema";
import { Compare } from "@/features/card/Compare";
import { Investigate } from "@/features/card/Investigate";
import { ReasonChips } from "@/features/card/ReasonChips";
import { ClaimItem, Reveal } from "@/features/card/Reveal";
import { CardHeader, ConsentPanel, ErrorNote, primaryButton, useCardSession } from "@/features/card/session";
import { CardStats } from "@/features/card/Stats";
import { formatDate } from "@/features/labels";
import { useCardMetrics } from "@/features/metrics/useCardMetrics";
import { Scale } from "@/features/ui/Scale";
import type { UserData } from "@/lib/firebase/user-data";
import { SCALE_LABELS, type ScaleValue } from "@/lib/judgment";
import { firstOpinion, revisitReason, unseenRevisions } from "@/lib/revisit";

/*
 * 다시 판단하기 (검토 문서 7.3).
 *
 *   바뀐 내용 → 지금 판단 → 처음과 나란히
 *
 * 지난번 판단을 먼저 보여주지 않는다. 먼저 보면 일관성 편향으로 같은 값을 누른다.
 * 바뀐 것을 보고, 판단하고, 그 다음에야 처음 값을 꺼낸다.
 */

type Step = "changes" | "opinion" | "compare";
const STEPS: Step[] = ["changes", "opinion", "compare"];

export function RevisitFlow({ card, user, data }: { card: Card; user: User; data: UserData }) {
  const session = useCardSession(card, user, data);
  const metrics = useCardMetrics(card.id);
  useEffect(() => metrics.event("revisit_open"), [metrics]);
  const { state, consented, busy, error, clearError, record } = session;
  const [now] = useState(() => new Date());
  const [step, setStep] = useState<Step>("changes");
  const [opinion, setOpinion] = useState<ScaleValue>();
  const [reasons, setReasons] = useState<string[]>([]);
  const [opinionLocalOnly, setOpinionLocalOnly] = useState(false);
  const [recordedAt, setRecordedAt] = useState<string | null>(null);

  // 화면을 연 순간의 상태로 고정한다 — 기록하면 lastSeenVersion이 올라가 "새 정보"가 사라지기 때문.
  const [opened] = useState(() => ({
    reason: revisitReason(card, state, now),
    revisions: unseenRevisions(card, state),
    first: firstOpinion(state),
    lastAt: state?.judgments.filter((j) => j.axis === "opinion").at(-1)?.at ?? null,
  }));

  const claims = new Map([...card.claims, ...card.counterpoints].map((c) => [c.id, c]));
  const sources = new Map(card.sources.map((s) => [s.id, s]));
  const changedClaimIds = [...new Set(opened.revisions.flatMap((r) => r.claimIds))];

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  async function confirmOpinion() {
    if (opinion === undefined) return;
    if (!opinionLocalOnly && !(await record({ axis: "opinion", phase: "revisit", value: opinion, reasonCodes: reasons }))) return;
    // 저장하지 않고 답해도 재평가에 응답한 것으로 센다 — 값은 보내지 않는다.
    metrics.event("revisit_done");
    setRecordedAt(new Date().toISOString());
    go("compare");
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-6 pb-16">
      <CardHeader step={STEPS.indexOf(step) + 1} total={STEPS.length} saved={state?.saved ?? false} busy={busy} onToggleSave={session.toggleSave} />

      <p className="mt-10 text-[13px] text-smoke">{card.shortTitle} · 다시 판단하기</p>

      {/* 근거 칩(원자료 링크)은 어디서 눌러도 원자료 클릭으로 센다. */}
      <div className="mt-4 flex-1" onClickCapture={(event) => (event.target as Element).closest("[data-source-link]") && metrics.event("source_open")}>
        <div key={step} className="step-enter">
          {step === "changes" && (
            <section>
              <h1 className="text-[28px] leading-tight font-light">
                {opened.revisions.length > 0 ? "지난번 판단 뒤, 새 정보가 생겼어요." : "지난번 판단 뒤, 바뀐 내용은 없어요."}
              </h1>
              {opened.lastAt && (
                <p className="mt-3 text-[15px] text-graphite">
                  마지막으로 판단한 날 <span className="font-mono tabular">{formatDate(Date.parse(opened.lastAt))}</span>
                  {opened.reason?.kind === "time" && ` · ${opened.reason.days}일 전`}
                </p>
              )}

              {opened.revisions.length > 0 && (
                <ol className="mt-8 flex flex-col gap-6">
                  {opened.revisions.map((revision) => (
                    <li key={revision.version}>
                      <p className="font-mono text-[11px] tracking-[0.04em] text-smoke">
                        v{revision.version} · {formatDate(Date.parse(revision.date))}
                      </p>
                      <p className="mt-1 text-[18px]">{revision.summary}</p>
                    </li>
                  ))}
                </ol>
              )}
              {changedClaimIds.length > 0 && (
                <ul className="mt-6 flex flex-col gap-4">
                  {changedClaimIds.map((id) => {
                    const claim = claims.get(id);
                    return claim ? <ClaimItem key={id} claim={claim} sources={sources} now={now} /> : null;
                  })}
                </ul>
              )}

              <details className="mt-10 rounded-sm border border-stone">
                <summary className="cursor-pointer px-4 py-3 text-[15px]">지금의 사실 다시 보기</summary>
                <div className="px-4 pt-2 pb-6">
                  <Reveal card={card} now={now} />
                </div>
              </details>
              <Investigate card={card} now={now} />

              <button type="button" onClick={() => go("opinion")} className={`mt-10 ${primaryButton}`}>
                지금 생각 정하기
              </button>
              <Link href={`/card/${card.id}?full=1`} className="mt-3 block text-center text-[14px] text-graphite underline-offset-4 hover:underline">
                처음부터 다시 보기
              </Link>
            </section>
          )}

          {step === "opinion" &&
            (!consented && !opinionLocalOnly ? (
              <ConsentPanel busy={busy} onAgree={session.giveConsent} onDecline={() => setOpinionLocalOnly(true)} />
            ) : (
              <section>
                <p className="text-[24px] leading-tight font-light">지금은 이 정책을 어떻게 보나요?</p>
                {opinionLocalOnly && <p className="mt-2 text-[14px] text-smoke">이번 답은 저장하지 않아요.</p>}
                <div className="mt-6">
                  <Scale
                    label="지금은 이 정책을 어떻게 보나요"
                    options={SCALE_LABELS.opinion}
                    value={opinion}
                    onChange={(value) => {
                      clearError();
                      setOpinion(value);
                      if (value === null) setReasons([]);
                    }}
                    disabled={busy}
                  />
                </div>
                {typeof opinion === "number" && (
                  <ReasonChips
                    card={card}
                    value={reasons}
                    onChange={(next) => {
                      clearError();
                      setReasons(next);
                    }}
                    disabled={busy}
                  />
                )}
                <button type="button" onClick={confirmOpinion} disabled={opinion === undefined || busy} className={`mt-10 ${primaryButton}`}>
                  다음
                </button>
              </section>
            ))}

          {step === "compare" && opened.first && opinion !== undefined && recordedAt && (
            <section>
              <p className="text-[28px] leading-tight font-light">처음과 지금을 나란히 놓았어요.</p>
              <Compare before={opened.first} after={{ value: opinion, at: recordedAt, cardVersion: cardVersion(card) }} />
              {opinionLocalOnly && <p className="mt-3 text-[14px] text-smoke">이번 판단은 저장하지 않았어요.</p>}
              <div className="mt-10 flex flex-col gap-2">
                <Link href="/me/history" className="w-full rounded-pill border border-ink px-6 py-4 text-center">
                  판단 이력 보기
                </Link>
                <Link href="/" className={`${primaryButton} text-center`}>
                  피드로
                </Link>
              </div>
              <CardStats card={card} />
            </section>
          )}
        </div>
        <ErrorNote error={error} />
      </div>
    </main>
  );
}
