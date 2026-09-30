"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Card } from "@/content/schema";
import { GameView } from "@/features/card/games";
import { Investigate } from "@/features/card/Investigate";
import { ReasonChips, reasonLabels } from "@/features/card/ReasonChips";
import { Reveal } from "@/features/card/Reveal";
import { CardHeader, ConsentPanel, ErrorNote, primaryButton, useCardSession } from "@/features/card/session";
import { ShareButton } from "@/features/card/ShareButton";
import { Shorts } from "@/features/card/Shorts";
import { CardStats } from "@/features/card/Stats";
import { hookTransitionName } from "@/features/feed/SwipeDeck";
import { CATEGORY_LABELS } from "@/features/labels";
import { useCardMetrics } from "@/features/metrics/useCardMetrics";
import { Scale } from "@/features/ui/Scale";
import type { UserData } from "@/lib/firebase/user-data";
import { HOOK_ACCURACY_LABELS, SCALE_LABELS, type HookAccuracy, type ScaleValue } from "@/lib/judgment";

/*
 * 카드 한 장의 흐름 (검토 문서 7.2). 필수 경로는
 *   숏츠 → 첫 판단 → 게임 → 사실 공개(+훅 정확도) → 최종 판단 → 끝
 * 이고, 근거·AI는 공개 화면의 곁가지다. 저장은 단계가 아니라 늘 떠 있는 버튼이다.
 * 카드의 flow가 판단을 끄면 그 단계는 건너뛴다.
 * 이미 평가한 카드를 다시 열면 RevisitFlow로 간다 (CardScreen이 고른다).
 */

type Step = "shorts" | "trust" | "game" | "reveal" | "opinion" | "done";

export function CardFlow({ card, user, data }: { card: Card; user: User; data: UserData }) {
  const session = useCardSession(card, user, data);
  const metrics = useCardMetrics(card.id);
  useEffect(() => metrics.event("card_open"), [metrics]);
  const { state, consented, busy, error, clearError, record } = session;
  const [now] = useState(() => new Date());

  const steps = useMemo<Step[]>(
    () => ["shorts", ...(card.flow.trust ? (["trust"] as const) : []), "game", "reveal", ...(card.flow.opinion ? (["opinion"] as const) : []), "done"],
    [card.flow],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  const [trust, setTrust] = useState<ScaleValue>();
  const [accuracy, setAccuracy] = useState<HookAccuracy>();
  const [opinion, setOpinion] = useState<ScaleValue>();
  /** 최종 판단의 이유. 모르겠음을 고르면 비운다 — 값이 없는 판단에 이유를 달지 않는다. */
  const [reasons, setReasons] = useState<string[]>([]);
  /** 동의하지 않으면 정책 평가는 이 화면에서만 보여주고 저장하지 않는다 (검토 문서 3장 1번). */
  const [opinionLocalOnly, setOpinionLocalOnly] = useState(false);

  /** 답을 바꾸면 지난 실패 문구를 내린다. */
  const choose =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      clearError();
      set(value);
    };

  const pickOpinion = (value: ScaleValue) => {
    choose(setOpinion)(value);
    if (value === null) setReasons([]);
  };

  const advance = () => {
    const next = stepIndex + 1;
    setStepIndex(next);
    // 마지막 단계에 닿으면 완료로 남긴다. 판단이 없는 카드도, 평가를 저장하지 않은 경우도 여기서 끝난다.
    if (steps[next] === "reveal") metrics.event("reveal_reached");
    if (steps[next] === "done") {
      metrics.event("final_done");
      void session.cardAction("complete");
    }
    window.scrollTo({ top: 0 });
  };

  async function confirmTrust() {
    if (trust === undefined) return;
    if (await record({ axis: "trust", phase: "initial", value: trust })) {
      metrics.event("trust_done");
      advance();
    }
  }

  async function confirmReveal() {
    if (card.flow.trust) {
      if (!accuracy) return;
      if (!(await record({ axis: "hookAccuracy", phase: "final", value: accuracy }))) return;
    }
    advance();
  }

  async function confirmOpinion() {
    if (opinion === undefined) return;
    if (opinionLocalOnly) return advance();
    if (await record({ axis: "opinion", phase: "final", value: opinion, reasonCodes: reasons })) advance();
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-6 pb-16">
      <CardHeader step={stepIndex + 1} total={steps.length} saved={state?.saved ?? false} busy={busy} onToggleSave={session.toggleSave} />

      <p className="mt-10 text-[13px] text-smoke">
        {card.shortTitle} ·{" "}
        <Link href={`/topics/${card.category}`} className="underline underline-offset-4 hover:text-graphite">
          {CATEGORY_LABELS[card.category]}
        </Link>
      </p>

      {/* 근거 칩(원자료 링크)은 어디서 눌러도 원자료 클릭으로 센다 — 공개 화면·시트·AI 답 모두. */}
      <div className="mt-4 flex-1" onClickCapture={(event) => (event.target as Element).closest("[data-source-link]") && metrics.event("source_open")}>
        {/* 단계가 바뀔 때마다 새 내용이 떠오른다. */}
        <div key={step} className="step-enter">
          {step === "shorts" && <Shorts hook={card.hook} lines={card.shorts} onDone={advance} morphName={hookTransitionName(card.id)} />}

          {step === "trust" && (
            <section>
              <blockquote className="text-[28px] leading-tight font-light">“{card.hook}”</blockquote>
              <p className="mt-6 text-[18px]">이 문장, 얼마나 믿을 만한가요?</p>
              <div className="mt-6">
                <Scale label="이 문장을 얼마나 믿나요" options={SCALE_LABELS.trust} value={trust} onChange={choose(setTrust)} disabled={busy} />
              </div>
              <button type="button" onClick={confirmTrust} disabled={trust === undefined || busy} className={`mt-10 ${primaryButton}`}>
                다음
              </button>
            </section>
          )}

          {step === "game" && <GameView game={card.game} onDone={advance} onReveal={metrics.game} />}

          {step === "reveal" && (
            <>
              <Reveal card={card} now={now} />
              <Investigate card={card} now={now} />
              {card.flow.trust && (
                <section className="mt-12 border-t border-stone pt-8">
                  <p className="text-[18px]">처음 본 문장은 어땠나요?</p>
                  <blockquote className="mt-2 text-graphite">“{card.hook}”</blockquote>
                  <div role="radiogroup" aria-label="처음 본 문장은 어땠나요" className="mt-4 grid gap-2 sm:grid-cols-3">
                    {(Object.keys(HOOK_ACCURACY_LABELS) as HookAccuracy[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={accuracy === key}
                        onClick={() => choose(setAccuracy)(key)}
                        className={`rounded-pill border px-5 py-3 ${accuracy === key ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone"}`}
                      >
                        {HOOK_ACCURACY_LABELS[key]}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <button type="button" onClick={confirmReveal} disabled={(card.flow.trust && !accuracy) || busy} className={`mt-10 ${primaryButton}`}>
                다음
              </button>
            </>
          )}

          {step === "opinion" &&
            (!consented && !opinionLocalOnly ? (
              <ConsentPanel busy={busy} onAgree={session.giveConsent} onDecline={() => setOpinionLocalOnly(true)} />
            ) : (
              <section>
                <p className="text-[24px] leading-tight font-light">자료를 확인했어요. 이 정책을 어떻게 보나요?</p>
                {opinionLocalOnly && <p className="mt-2 text-[14px] text-smoke">이번 답은 저장하지 않아요.</p>}
                <div className="mt-6">
                  <Scale label="이 정책을 어떻게 보나요" options={SCALE_LABELS.opinion} value={opinion} onChange={pickOpinion} disabled={busy} />
                </div>
                {typeof opinion === "number" && <ReasonChips card={card} value={reasons} onChange={choose(setReasons)} disabled={busy} />}
                <button type="button" onClick={confirmOpinion} disabled={opinion === undefined || busy} className={`mt-10 ${primaryButton}`}>
                  다음
                </button>
              </section>
            ))}

          {step === "done" && (
            <>
              <Summary
                card={card}
                trust={trust}
                accuracy={accuracy}
                opinion={opinion}
                reasons={reasons}
                opinionSaved={card.flow.opinion && !opinionLocalOnly}
                saved={state?.saved ?? false}
                onSave={session.toggleSave}
              />
              {/* 다른 사용자의 응답은 자기 판단을 마친 뒤에만 보인다 — 먼저 보면 앵커링이 된다 (검토 문서 3장 6번). */}
              <CardStats card={card} />
            </>
          )}
        </div>
        {/* 오류는 누른 버튼 바로 아래에 — 화면 맨 아래로 밀려나면 보이지 않는다. */}
        <ErrorNote error={error} />
      </div>
    </main>
  );
}

/**
 * 끝 화면. 점수나 "+2 변화"를 만들지 않는다 (검토 문서 2.5). 무엇을 골랐는지만 순서대로 적는다.
 * 첫 판단(훅 신뢰)과 최종 판단(정책 평가)은 축이 달라서 비교하지 않는다 —
 * 같은 축의 처음/지금 비교는 다시 판단하기(RevisitFlow)에서 생긴다.
 */
function Summary(props: {
  card: Card;
  trust: ScaleValue | undefined;
  accuracy: HookAccuracy | undefined;
  opinion: ScaleValue | undefined;
  reasons: string[];
  opinionSaved: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const scaleText = (labels: readonly string[], value: ScaleValue | undefined) => (value === null ? "모르겠음" : value ? labels[value - 1] : null);
  const rows = [
    ["처음 본 문장", scaleText(SCALE_LABELS.trust, props.trust)],
    ["사실을 본 뒤", props.accuracy ? HOOK_ACCURACY_LABELS[props.accuracy] : null],
    ["이 정책은", scaleText(SCALE_LABELS.opinion, props.opinion)],
    ["이유", reasonLabels(props.card, props.reasons).join(" · ") || null],
  ].filter((row): row is [string, string] => row[1] !== null);

  return (
    <section>
      <p className="tong-pop text-[28px] leading-tight font-light">여기까지 따져봤어요.</p>
      {rows.length > 0 && (
        <dl className="stagger mt-8 flex flex-col">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-t border-stone py-3">
              <dt className="text-graphite">{label}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {props.card.flow.opinion && !props.opinionSaved && <p className="mt-3 text-[14px] text-smoke">정책 평가는 저장하지 않았어요.</p>}
      {!props.saved && (
        <p className="mt-8 text-[15px] text-graphite">
          저장해 두면 이 정책에 새 정보가 생겼을 때 다시 확인할 수 있어요.
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        {!props.saved && (
          <button type="button" onClick={props.onSave} className="w-full rounded-pill border border-ink px-6 py-4">
            이 카드 저장하기
          </button>
        )}
        <ShareButton card={props.card} />
        <Link href="/" className={`${primaryButton} text-center`}>
          다음 카드
        </Link>
      </div>
    </section>
  );
}
