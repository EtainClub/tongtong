"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Path } from "@/content/path-schema";
import { PATHS } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { PlanStage } from "@/content/schema";
import { ClaimItem } from "@/features/card/Reveal";
import { ErrorNote, primaryButton } from "@/features/card/session";
import { PLAN_STAGE_LABELS } from "@/features/labels";
import { PlanGate } from "@/features/plan/PlanGate";
import { Timeline } from "@/features/plan/Timeline";
import { BlueprintGoalKind, MAX_HORIZON_YEARS, type Blueprint } from "@/lib/blueprint/model";
import { emptyBlueprint, materialize, pathHorizonYear } from "@/lib/blueprint/materialize";
import { currentMonth } from "@/lib/blueprint/month";
import { apiFetch } from "@/lib/firebase/api";
import { describeBlueprintError } from "@/lib/firebase/blueprint";

/*
 * 청사진 만들기 /plan/new (청사진 설계 7.2) — 세 단계, 한 단계씩.
 *   1 무엇이 되고 싶나 — 경로 견본 또는 직접 적기
 *   2 지금 어디쯤인가 — 학적·단계, 만 나이(선택), 목표 연도
 *   3 초안 — 저장하면 REV.1
 * 초안은 서버와 같은 함수(materialize)로 화면에서 그린다. 저장은 서버가 같은 계산을 다시 한다.
 */

const policyMap = new Map(POLICIES.map((policy) => [policy.id, policy]));

const GOAL_KIND_LABELS: Record<(typeof BlueprintGoalKind.options)[number], string> = {
  degree: "진학·학위",
  career: "취업",
  startup: "창업",
  other: "그 밖",
};

type Choice = { kind: "path"; path: Path } | { kind: "custom" };

export function PlanNew() {
  return (
    <PlanGate>
      {({ user, active }) =>
        active.blueprint ? (
          <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
            <p className="mt-16 text-[18px]">이미 청사진이 있어요.</p>
            <p className="mt-2 text-graphite">청사진은 하나씩 둬요. 새로 만들려면 지금 청사진을 보관하세요.</p>
            <Link href="/plan" className={`${primaryButton} mt-8 block text-center`}>
              내 청사진 보기
            </Link>
          </main>
        ) : (
          <Steps user={user} />
        )
      }
    </PlanGate>
  );
}

function Steps({ user }: { user: User }) {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const asOf = currentMonth(now);
  const baseYear = Number(asOf.slice(0, 4));

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [kind, setKind] = useState<(typeof BlueprintGoalKind.options)[number]>("other");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<(typeof PlanStage.options)[number] | null>(null);
  const [age, setAge] = useState("");
  const [horizonYear, setHorizonYear] = useState(baseYear + 5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAge = age.trim() === "" ? undefined : Number(age);
  const ageValid = parsedAge === undefined || (Number.isInteger(parsedAge) && parsedAge >= 14 && parsedAge <= 60);
  const goalTitle = choice?.kind === "path" ? choice.path.title : title.trim();

  const pick = (next: Choice) => {
    setChoice(next);
    if (next.kind === "path") setHorizonYear(pathHorizonYear(next.path, asOf));
  };

  const draft = (): Blueprint | null => {
    if (!choice || !stage) return null;
    const baseline = { asOf, stage, ...(parsedAge !== undefined && { age: parsedAge }) };
    return choice.kind === "path"
      ? materialize(choice.path, policyMap, { id: "draft", baseline, now, horizonYear })
      : emptyBlueprint({ id: "draft", baseline, now, goal: { kind, title: goalTitle, horizonYear } });
  };

  async function save() {
    if (!choice || !stage || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, "/api/blueprint", {
        method: "POST",
        body: {
          ...(choice.kind === "path" && { pathId: choice.path.id }),
          kind: choice.kind === "path" ? choice.path.goalKind : kind,
          title: goalTitle,
          horizonYear,
          stage,
          ...(parsedAge !== undefined && { age: parsedAge }),
        },
      });
      router.replace("/plan");
    } catch (e) {
      setError(describeBlueprintError(e));
      setBusy(false);
    }
  }

  const preview = step === 3 ? draft() : null;

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <p className="mt-10 font-mono text-[13px] text-smoke tabular">{step} / 3</p>

      <div key={step} className="step-enter">
        {step === 1 && (
          <section aria-labelledby="goal-title">
            <h1 id="goal-title" className="mt-1 text-[28px] leading-tight font-light">
              무엇이 되고 싶나요?
            </h1>
            <ul className="mt-6 flex flex-col gap-2">
              {PATHS.map((path) => (
                <li key={path.id}>
                  <Option selected={choice?.kind === "path" && choice.path.id === path.id} onClick={() => pick({ kind: "path", path })}>
                    <span className="block text-[17px]">{path.title}</span>
                    <span className="mt-1 block text-[14px] text-graphite">{path.summary}</span>
                    {path.publishStatus === "draft" && <span className="mt-2 inline-block rounded-pill bg-pending-tint px-2.5 py-0.5 text-[11px] text-pending">초안 견본</span>}
                  </Option>
                </li>
              ))}
              <li>
                <Option selected={choice?.kind === "custom"} onClick={() => pick({ kind: "custom" })}>
                  <span className="block text-[17px]">직접 적기</span>
                  <span className="mt-1 block text-[14px] text-graphite">목표만 적고 빈 청사진에서 시작해요.</span>
                </Option>
              </li>
            </ul>
            {choice?.kind === "custom" && (
              <div className="mt-6 flex flex-col gap-4">
                <div role="radiogroup" aria-label="목표 종류" className="flex flex-wrap gap-2">
                  {BlueprintGoalKind.options.map((option) => (
                    <Chip key={option} selected={kind === option} onClick={() => setKind(option)} role="radio">
                      {GOAL_KIND_LABELS[option]}
                    </Chip>
                  ))}
                </div>
                <label className="flex flex-col gap-1.5 text-[14px]">
                  <span>목표 (60자)</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={60}
                    placeholder="예: 게임 회사 기획자"
                    className="rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink"
                  />
                </label>
              </div>
            )}
            <button type="button" onClick={() => setStep(2)} disabled={!choice || !goalTitle} className={`mt-10 ${primaryButton}`}>
              다음
            </button>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="where-title">
            <h1 id="where-title" className="mt-1 text-[28px] leading-tight font-light">
              지금 어디쯤인가요?
            </h1>
            <div role="radiogroup" aria-label="지금 학적·단계" className="mt-6 flex flex-wrap gap-2">
              {PlanStage.options.map((option) => (
                <Chip key={option} selected={stage === option} onClick={() => setStage(option)} role="radio">
                  {PLAN_STAGE_LABELS[option]}
                </Chip>
              ))}
            </div>
            {choice?.kind === "path" && stage && stage !== choice.path.startStage && (
              <p className="mt-3 text-[14px] text-graphite">
                이 견본은 {PLAN_STAGE_LABELS[choice.path.startStage]}에서 시작한다고 가정해요. 만든 뒤 이정표와 정책 시점을 옮길 수 있어요.
              </p>
            )}

            <label className="mt-8 flex flex-col gap-1.5 text-[14px]">
              <span>
                만 나이 <span className="text-smoke">(선택)</span>
              </span>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={2}
                className="w-24 rounded-input border border-stone bg-eggshell px-3 py-2.5 font-mono text-[16px] tabular focus:border-ink"
              />
              <span className="text-[13px] text-smoke">나이 조건이 있는 정책을 점검하는 데만 써요. 안 적으면 &quot;확인 필요&quot;로 보여요.</span>
              {!ageValid && <span className="text-[13px] text-ink">만 14–60세로 적어 주세요.</span>}
            </label>

            <label className="mt-6 flex flex-col gap-1.5 text-[14px]">
              <span>목표 연도</span>
              <select value={horizonYear} onChange={(e) => setHorizonYear(Number(e.target.value))} className="w-32 rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink">
                {/* 견본은 마지막 칸이 든 해보다 이르게 잡을 수 없다 — 칸이 목표 연도 밖으로 나간다. */}
                {Array.from({ length: MAX_HORIZON_YEARS + 1 }, (_, i) => baseYear + i)
                  .filter((year) => choice?.kind !== "path" || year >= pathHorizonYear(choice.path, asOf))
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
              </select>
            </label>

            <div className="mt-10 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-pill border border-stone px-6 py-4">
                이전
              </button>
              <button type="button" onClick={() => setStep(3)} disabled={!stage || !ageValid} className={primaryButton}>
                초안 보기
              </button>
            </div>
          </section>
        )}

        {step === 3 && preview && (
          <section aria-labelledby="draft-title">
            <h1 id="draft-title" className="mt-1 text-[28px] leading-tight font-light">
              초안이에요 — 저장하면 REV.1
            </h1>
            <p className="mt-2 text-[17px]">
              {preview.goal.title} <span className="font-mono text-smoke tabular">({preview.goal.horizonYear})</span>
            </p>
            <p className="mt-3 text-[14px] text-smoke">정책은 해마다 바뀌어요. 예상·미정 칸은 공식 공고로 다시 확인하세요. 대상인지는 신청 기관이 정해요.</p>

            <div className="mt-6">
              {preview.placements.length + preview.milestones.length > 0 ? (
                <Timeline blueprint={preview} nowMonth={asOf} />
              ) : (
                <p className="text-graphite">빈 청사진이에요. 저장한 뒤 이정표와 정책을 넣을 수 있어요.</p>
              )}
            </div>

            {choice?.kind === "path" && choice.path.caveats.length > 0 && (
              <details className="mt-6 border-t border-stone pt-4">
                <summary className="cursor-pointer text-[15px]">이 경로의 한계</summary>
                <ul className="mt-4 flex flex-col gap-4">
                  {choice.path.caveats.map((claim) => (
                    <ClaimItem key={claim.id} claim={claim} sources={new Map(choice.path.sources.map((s) => [s.id, s]))} now={now} />
                  ))}
                </ul>
              </details>
            )}

            <div className="mt-10 flex flex-col gap-2">
              <button type="button" onClick={save} disabled={busy} className={primaryButton}>
                {busy ? "저장하는 중…" : "청사진으로 저장"}
              </button>
              <button type="button" onClick={() => setStep(1)} disabled={busy} className="rounded-pill border border-stone px-6 py-4">
                처음부터
              </button>
            </div>
            <ErrorNote error={error} />
          </section>
        )}
      </div>
    </main>
  );
}

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full rounded-card border p-5 text-left ${selected ? "border-ink" : "border-stone hover:border-graphite"}`}
    >
      {children}
    </button>
  );
}

export function Chip({ selected, onClick, children, role }: { selected: boolean; onClick: () => void; children: React.ReactNode; role?: "radio" }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "radio" ? selected : undefined}
      aria-pressed={role ? undefined : selected}
      onClick={onClick}
      className={`rounded-pill border px-4 py-2 ${selected ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
    >
      {children}
    </button>
  );
}
