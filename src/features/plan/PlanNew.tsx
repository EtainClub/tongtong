"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GoalKind, type Path } from "@/content/path-schema";
import { PATHS } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { PlanStage } from "@/content/schema";
import { Stepper } from "@/features/card/game-parts";
import { ClaimItem } from "@/features/card/Reveal";
import { ErrorNote, primaryButton } from "@/features/card/session";
import { PLAN_STAGE_LABELS } from "@/features/labels";
import { PlanGate } from "@/features/plan/PlanGate";
import { Timeline } from "@/features/plan/Timeline";
import { BlueprintGoalKind, MAX_HORIZON_YEARS, type Blueprint } from "@/lib/blueprint/model";
import { anchorRange, emptyBlueprint, materialize, pathHorizonYear } from "@/lib/blueprint/materialize";
import { addMonths, currentMonth, fromIndex, monthIndex } from "@/lib/blueprint/month";
import { apiFetch } from "@/lib/firebase/api";
import { describeBlueprintError } from "@/lib/firebase/blueprint";

/*
 * 청사진 만들기 /plan/new (청사진 설계 7.2) — 세 단계, 한 단계씩.
 *   1 무엇이 되고 싶나 — 경로 견본(목표 종류로 거른다) 또는 직접 적기
 *   2 지금의 나 — 학적·단계, 출발 시점(견본일 때), 만 나이(선택), 목표 연도. 고르는 대로 위 카드(ProfileCard)가 바뀐다.
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

/** 견본이 가질 수 있는 목표 종류 — 1단계 거름 칩의 순서. */
const PATH_KINDS = GoalKind.options;

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
  /** 1단계 견본 목록을 목표 종류로 거른다 — null이면 전부. */
  const [kindFilter, setKindFilter] = useState<Path["goalKind"] | null>(null);
  const [kind, setKind] = useState<(typeof BlueprintGoalKind.options)[number]>("other");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<(typeof PlanStage.options)[number] | null>(null);
  /** 만 나이 — 안 적으면 null. 나이 조건이 있는 정책은 "확인 필요"로 보인다. */
  const [age, setAge] = useState<number | null>(null);
  const [horizonYear, setHorizonYear] = useState(baseYear + 5);
  /** 견본의 출발점(offset 0)이 되는 달 — 오늘이 아니라 사용자가 고른다 (청사진 설계 4.5, 검토 A-4). */
  const [anchor, setAnchor] = useState(asOf);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalTitle = choice?.kind === "path" ? choice.path.title : title.trim();
  const range = choice?.kind === "path" ? anchorRange(choice.path, asOf) : null;
  const anchorValid = !range || (monthIndex(anchor) >= monthIndex(range.min) && monthIndex(anchor) <= monthIndex(range.max));
  /** 목표 연도는 출발 달이 든 해보다 이를 수 없다. 견본의 끝보다 이르면 목표 연도까지만 담는다(materialize). */
  const minYear = Math.max(baseYear, choice?.kind === "path" ? Number(anchor.slice(0, 4)) : baseYear);

  const pick = (next: Choice) => {
    setChoice(next);
    setAnchor(asOf);
    if (next.kind === "path") setHorizonYear(pathHorizonYear(next.path, asOf));
  };

  /** 출발 달을 옮기면, 목표 연도를 건드리지 않았을 때(경로 끝)는 경로 끝을 따라가고, 아니면 출발 해 이상으로만 맞춘다. */
  const moveAnchor = (value: string) => {
    if (choice?.kind !== "path") return;
    const path = choice.path;
    setAnchor(value);
    setHorizonYear((year) => (year === pathHorizonYear(path, anchor) ? pathHorizonYear(path, value) : Math.max(year, Number(value.slice(0, 4)), baseYear)));
  };

  const draft = (forStage = stage): Blueprint | null => {
    if (!choice || !forStage) return null;
    const baseline = { asOf, stage: forStage, ...(age !== null && { age }) };
    return choice.kind === "path"
      ? materialize(choice.path, policyMap, { id: "draft", baseline, now, anchor, horizonYear })
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
          ...(choice.kind === "path" && { pathId: choice.path.id, anchor }),
          kind: choice.kind === "path" ? choice.path.goalKind : kind,
          title: goalTitle,
          horizonYear,
          stage,
          ...(age !== null && { age }),
        },
      });
      router.replace("/plan");
    } catch (e) {
      setError(describeBlueprintError(e));
      setBusy(false);
    }
  }

  const preview = step === 3 ? draft() : null;
  /** 2단계에서 고르는 대로 바뀌는 미리보기 — 단계를 아직 안 골랐으면 견본의 출발 단계로 그린다. */
  const live = step === 2 && anchorValid ? draft(stage ?? (choice?.kind === "path" ? choice.path.startStage : "undergrad")) : null;

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <StepBar step={step} />

      <div key={step} className="step-enter">
        {step === 1 && (
          <section aria-labelledby="goal-title">
            <h1 id="goal-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight">
              무엇이 되고 싶나요?
            </h1>
            <div role="radiogroup" aria-label="목표 종류로 거르기" className="mt-6 flex flex-wrap gap-2">
              <Chip role="radio" selected={kindFilter === null} onClick={() => setKindFilter(null)}>
                전체 {PATHS.length}
              </Chip>
              {PATH_KINDS.filter((k) => PATHS.some((path) => path.goalKind === k)).map((k) => (
                <Chip key={k} role="radio" selected={kindFilter === k} onClick={() => setKindFilter(k)}>
                  {GOAL_KIND_LABELS[k]} {PATHS.filter((path) => path.goalKind === k).length}
                </Chip>
              ))}
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {PATHS.filter((path) => !kindFilter || path.goalKind === kindFilter).map((path) => (
                <li key={path.id}>
                  <Option selected={choice?.kind === "path" && choice.path.id === path.id} onClick={() => pick({ kind: "path", path })}>
                    <span className="block text-[12px] text-smoke">
                      {GOAL_KIND_LABELS[path.goalKind]} · {startLabel(path)}부터
                    </span>
                    <span className="mt-1 block text-[17px]">{path.title}</span>
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

        {step === 2 && choice && (
          <section aria-labelledby="where-title">
            <h1 id="where-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight">
              지금의 나를 설정해요
            </h1>
            <p className="mt-2 text-[14px] text-graphite">고르는 대로 아래 카드가 바로 바뀌어요.</p>

            <ProfileCard
              goalTitle={goalTitle}
              stage={stage}
              age={age}
              horizonYear={horizonYear}
              asOf={asOf}
              start={choice.kind === "path" ? anchor : asOf}
              live={live}
              dropped={choice.kind === "path" ? choice.path.milestones.filter((m) => Number(addMonths(anchor, m.offsetMonths).slice(0, 4)) > horizonYear).length : 0}
            />

            <Field title="지금 나는" hint="지금 학적이나 하는 일을 하나 골라요.">
              <div role="radiogroup" aria-label="지금 학적·단계" className="grid grid-cols-3 gap-2">
                {PlanStage.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={stage === option}
                    onClick={() => setStage(option)}
                    className={`min-h-14 rounded-sm border px-2 py-2.5 text-[14px] leading-snug break-keep ${stage === option ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
                  >
                    {PLAN_STAGE_LABELS[option]}
                  </button>
                ))}
              </div>
            </Field>

            {choice.kind === "path" && range && (
              <Field
                title="출발 시점"
                hint={`'${choice.path.title}' 경로는 '${startLabel(choice.path)}'에서 시작해요. 그때가 언제인가요? 이미 지났으면 그 무렵을, 아직이면 그때가 될 무렵을 골라요. 이정표와 정책 시기가 여기에 맞춰져요.`}
              >
                <AnchorPicker value={anchor} onChange={moveAnchor} asOf={asOf} min={range.min} max={range.max} />
              </Field>
            )}

            <Field title="만 나이" optional hint="나이 조건이 있는 정책을 점검하는 데만 써요. 안 적으면 '확인 필요'로 보여요.">
              <AgePicker value={age} onChange={setAge} />
            </Field>

            <Field title="목표 연도" hint="언제까지의 청사진인가요? 가까운 해를 고르면 그해까지만 담아요.">
              <YearPicker
                value={horizonYear}
                onChange={setHorizonYear}
                baseYear={baseYear}
                minYear={minYear}
                pathEndYear={choice.kind === "path" ? pathHorizonYear(choice.path, anchor) : null}
              />
            </Field>

            <div className="mt-10 flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="shrink-0 rounded-pill border border-stone px-6 py-4 whitespace-nowrap">
                이전
              </button>
              <button type="button" onClick={() => setStep(3)} disabled={!stage || !anchorValid} className={primaryButton}>
                {stage ? "초안 보기" : "지금 단계를 골라 주세요"}
              </button>
            </div>
          </section>
        )}

        {step === 3 && preview && (
          <section aria-labelledby="draft-title">
            <h1 id="draft-title" className="mt-1 text-[26px] leading-tight font-bold tracking-tight">
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
                <summary className="disclosure text-[15px] font-semibold">이 경로의 한계</summary>
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

const STEP_LABELS = ["목표", "지금의 나", "초안"] as const;

function StepBar({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol aria-label="만들기 단계" className="mt-8 grid grid-cols-3 gap-2">
      {STEP_LABELS.map((label, i) => (
        <li key={label} aria-current={step === i + 1 ? "step" : undefined} className="flex flex-col gap-1.5">
          <span className={`h-1 rounded-pill transition-colors duration-300 ${i < step ? "bg-ink" : "bg-stone"}`} />
          <span className={`text-[12px] ${step === i + 1 ? "font-semibold text-ink" : "text-smoke"}`}>
            {i + 1}. {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 견본이 시작하는 이정표 이름 — "학부 2학년". */
const startLabel = (path: Path) => path.milestones.find((m) => m.offsetMonths === 0)?.label ?? PLAN_STAGE_LABELS[path.startStage];

const dotted = (ym: string) => ym.replace("-", ".");

const monthLabel = (index: number) => `${Math.floor(index / 12)}년 ${(index % 12) + 1}월`;

/** 달 수 차이를 "1년 3개월 전"처럼. */
function relativeMonths(diff: number): string {
  if (diff === 0) return "이번 달";
  const n = Math.abs(diff);
  const span = [Math.floor(n / 12) > 0 && `${Math.floor(n / 12)}년`, n % 12 > 0 && `${n % 12}개월`].filter(Boolean).join(" ");
  return `지금부터 ${span} ${diff < 0 ? "전" : "뒤"}`;
}

function Field({ title, hint, optional, children }: { title: string; hint: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={title} className="mt-9">
      <h2 className="text-[16px] font-semibold">
        {title} {optional && <span className="font-normal text-smoke">(선택)</span>}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-smoke">{hint}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * 캐릭터 시트처럼 — 2단계에서 고르는 값이 바로 보이는 카드. 화면 위에 붙어 있어 아래에서 고르는 동안 늘 보인다.
 * 막대는 출발(또는 오늘)부터 목표 연도 끝까지, 점은 담기는 이정표다.
 */
function ProfileCard({
  goalTitle,
  stage,
  age,
  horizonYear,
  asOf,
  start,
  live,
  dropped,
}: {
  goalTitle: string;
  stage: (typeof PlanStage.options)[number] | null;
  age: number | null;
  horizonYear: number;
  asOf: string;
  start: string;
  live: Blueprint | null;
  dropped: number;
}) {
  const from = Math.min(monthIndex(asOf), monthIndex(start));
  const to = horizonYear * 12 + 11;
  const at = (ym: string) => `${((monthIndex(ym) - from) / Math.max(1, to - from)) * 100}%`;
  const moving = "transition-[left] duration-300 ease-[var(--ease-out-expo)] motion-reduce:transition-none";
  const stats = [
    { label: "지금", value: stage ? PLAN_STAGE_LABELS[stage] : "?" },
    { label: "만 나이", value: age === null ? "—" : `${age}세` },
    { label: "목표", value: `${horizonYear}년` },
  ];

  return (
    <div className="sticky top-0 z-10 -mx-5 mt-5 bg-canvas px-5 py-3">
      <div className="rounded-card border border-ink p-4">
        <p className="truncate text-[17px] font-bold">{goalTitle}</p>
        <dl className="mt-2 grid grid-cols-3 gap-2">
          {stats.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-[11px] text-smoke">{label}</dt>
              <dd key={value} className="pick-pop truncate text-[14px] font-semibold">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="relative mt-4 h-4" aria-hidden>
          <span className="absolute inset-x-0 top-1/2 h-px bg-stone" />
          <span className={`absolute top-1/2 right-0 h-0.5 -translate-y-1/2 bg-ink ${moving}`} style={{ left: at(start) }} />
          <span className={`absolute top-0 h-full w-px bg-graphite ${moving}`} style={{ left: at(asOf) }} />
          {live?.milestones.map((m) => (
            <span
              key={m.id}
              title={`${m.label} ${dotted(m.at)}`}
              className={`absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-canvas ${moving}`}
              style={{ left: at(m.at) }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[11px] text-smoke tabular">
          <span>{from === monthIndex(asOf) ? "오늘" : dotted(fromIndex(from))}</span>
          <span>{horizonYear}.12</span>
        </div>

        {live?.goal.pathId && (
          <p className="mt-2 text-[12px] text-graphite">
            이정표 {live.milestones.length}개 · 정책 {live.placements.length}개{dropped > 0 && ` · 목표 연도 뒤 이정표 ${dropped}개는 빠져요`}
          </p>
        )}
      </div>
    </div>
  );
}

/** 출발 시점 — 가까운 학기 시작을 바로 고르거나, −/+로 한 달씩 옮긴다. */
function AnchorPicker({ value, onChange, asOf, min, max }: { value: string; onChange: (ym: string) => void; asOf: string; min: string; max: string }) {
  const lo = monthIndex(min);
  const hi = monthIndex(max);
  const now = monthIndex(asOf);
  const year = Number(asOf.slice(0, 4));
  const quick = [...new Set([asOf, ...[year - 1, year, year + 1].flatMap((y) => [`${y}-03`, `${y}-09`])])]
    .filter((ym) => monthIndex(ym) >= lo && monthIndex(ym) <= hi && Math.abs(monthIndex(ym) - now) <= 12)
    .sort((a, b) => monthIndex(a) - monthIndex(b));

  return (
    <div>
      <div role="radiogroup" aria-label="가까운 학기 시작" className="flex flex-wrap gap-2">
        {quick.map((ym) => (
          <Chip key={ym} role="radio" selected={value === ym} onClick={() => onChange(ym)}>
            {ym === asOf ? "지금" : `${ym.slice(0, 4)}년 ${ym.endsWith("03") ? "1학기" : "2학기"}`}
          </Chip>
        ))}
      </div>
      <div className="mt-4 rounded-sm border border-stone p-3">
        <Stepper label="출발 달" value={monthIndex(value)} onChange={(i) => onChange(fromIndex(i))} min={lo} max={hi} step={1} format={monthLabel} />
        <p className="mt-2 text-center text-[13px] text-smoke">{relativeMonths(monthIndex(value) - now)}</p>
      </div>
    </div>
  );
}

function AgePicker({ value, onChange }: { value: number | null; onChange: (age: number | null) => void }) {
  const [last, setLast] = useState(value ?? 22);
  const set = (age: number) => {
    setLast(age);
    onChange(age);
  };

  return (
    <div>
      <div role="radiogroup" aria-label="만 나이 적기" className="flex gap-2">
        <Chip role="radio" selected={value !== null} onClick={() => onChange(last)}>
          적을게요
        </Chip>
        <Chip role="radio" selected={value === null} onClick={() => onChange(null)}>
          안 적을래요
        </Chip>
      </div>
      {value !== null && (
        <div className="step-enter mt-4 rounded-sm border border-stone p-3">
          {/* 슬라이더를 끌지 않아도 −/+ 로 정할 수 있다. */}
          <Stepper label="만 나이" value={value} onChange={set} min={14} max={60} step={1} format={(n) => `만 ${n}세`} />
          <input
            type="range"
            min={14}
            max={60}
            value={value}
            onChange={(e) => set(Number(e.target.value))}
            aria-label="만 나이"
            aria-valuetext={`만 ${value}세`}
            className="mt-3 w-full accent-ink"
          />
        </div>
      )}
    </div>
  );
}

/** 목표 연도 — 올해부터 10년 안. 출발 해보다 이른 해는 고를 수 없고, 경로 끝보다 이르면 그해까지만 담는다. */
function YearPicker({ value, onChange, baseYear, minYear, pathEndYear }: { value: number; onChange: (year: number) => void; baseYear: number; minYear: number; pathEndYear: number | null }) {
  const years = Array.from({ length: MAX_HORIZON_YEARS + 1 }, (_, i) => baseYear + i);
  return (
    <div>
      <div role="radiogroup" aria-label="목표 연도" className="grid grid-cols-4 gap-2">
        {years.map((year) => {
          const selected = year === value;
          return (
            <button
              key={year}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={year < minYear}
              onClick={() => onChange(year)}
              className={`flex flex-col items-center rounded-sm border py-2.5 disabled:opacity-30 ${selected ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
            >
              <span className="font-mono text-[16px] tabular">{year}</span>
              <span className={`text-[11px] ${selected ? "text-eggshell" : "text-smoke"}`}>{year === pathEndYear ? "경로 끝" : year === baseYear ? "올해" : `+${year - baseYear}년`}</span>
            </button>
          );
        })}
      </div>
      {pathEndYear !== null && value < pathEndYear && (
        <p className="mt-3 text-[13px] leading-relaxed text-graphite">
          이 경로는 {pathEndYear}년까지 이어져요. {value}년까지만 담고 그 뒤 이정표와 정책은 빼요. 나중에 목표 연도를 늘려도 뺀 것은 직접 넣어야 해요.
        </p>
      )}
    </div>
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
