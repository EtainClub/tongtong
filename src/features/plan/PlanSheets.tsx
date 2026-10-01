"use client";

import Link from "next/link";
import { useState } from "react";

import { findCard } from "@/content/cards";
import { PATHS } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { PlacementRole, PlanStage, type Policy } from "@/content/schema";
import { ApplicationBox } from "@/features/card/Reveal";
import { primaryButton } from "@/features/card/session";
import { CERTAINTY_LABELS, PLACEMENT_ROLE_LABELS, PLACEMENT_STATUS_LABELS, PLAN_STAGE_LABELS } from "@/features/labels";
import { Chip } from "@/features/plan/PlanNew";
import { ageText } from "@/features/policy/PolicyView";
import { formatPeriod, policyName } from "@/features/plan/Timeline";
import type { BlueprintOp } from "@/lib/blueprint/apply";
import { certaintyOf } from "@/lib/blueprint/certainty";
import { MAX_HORIZON_YEARS, STATUS_TRANSITIONS, type Blueprint, type Milestone, type Placement } from "@/lib/blueprint/model";
import { addMonths, monthIndex } from "@/lib/blueprint/month";

/*
 * 청사진 화면의 시트들 (청사진 설계 7.4–7.6). 모두 op를 만들어 onOps로 넘기기만 한다 —
 * 규칙(전이·기간·상한)은 서버의 apply.ts가 본다. 화면은 갈 수 있는 것만 보여 줄 뿐이다.
 */

type SheetProps = { busy: boolean; onOps: (ops: BlueprintOp[], options?: { close?: boolean }) => void };

const secondaryButton = "rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40";
const inputClass = "rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink";

/** 청사진에 놓을 수 있는 항목 — 보이는 청년 대상 항목 (apply.ts placeablePolicy와 같은 조건). */
const PLACEABLE = POLICIES.filter((policy) => policy.audience.includes("young_adult"));
const policyById = new Map(POLICIES.map((policy) => [policy.id, policy]));

/** 견본에서 가져온 배치면 그 칸의 편집자 설명. */
function slotWhy(blueprint: Blueprint, placement: Placement): string | null {
  const path = PATHS.find((p) => p.id === blueprint.goal.pathId);
  return path?.slots.find((slot) => slot.id === placement.id && slot.policyId === placement.policyId)?.why ?? null;
}

// ── 배치 상세 ──

export function PlacementDetail({ blueprint, placement, now, busy, onOps }: SheetProps & { blueprint: Blueprint; placement: Placement; now: Date }) {
  const policy = policyById.get(placement.policyId);
  const why = slotWhy(blueprint, placement);
  const certainty = certaintyOf(placement, policy);
  const [note, setNote] = useState(placement.note ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  /** 반기 단위로 옮긴다 — 기간은 그대로. */
  const shift = (months: number) =>
    onOps([{ op: "movePlacement", id: placement.id, from: addMonths(placement.from, months), ...(placement.to && { to: addMonths(placement.to, months) }) }]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[20px]">{policyName(placement.policyId)}</p>
        <p className="mt-1 text-[14px] text-graphite">
          <span className="font-mono tabular">{formatPeriod(placement)}</span> · {PLACEMENT_ROLE_LABELS[placement.role]} · {CERTAINTY_LABELS[certainty]}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {policy && (
            <Link href={`/policy/${policy.id}`} className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
              정책 보기
            </Link>
          )}
          {findCard(placement.policyId) && (
            <Link href={`/card/${placement.policyId}`} className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
              따져보기 ◆
            </Link>
          )}
        </div>
      </div>

      {why && (
        <p className="text-[15px]">
          <span className="text-graphite">왜 여기에 </span>
          {why}
        </p>
      )}
      {certainty !== "confirmed" && (
        <p className="text-[14px] text-smoke">
          {certainty === "expected" ? "다시 열린다는 근거로 놓은 예상 시점이에요." : "이 시점에 열린다는 근거가 아직 없어요."} 공식 공고로 확인하세요.
        </p>
      )}
      {policy && <ApplicationBox applications={policy.policy.applications} now={now} />}
      {policy?.counterpoints[0] && (
        <p className="text-[14px] text-graphite">
          <span className="text-smoke">한계 </span>
          {policy.counterpoints[0].text}
        </p>
      )}

      <section aria-labelledby="status-title">
        <h3 id="status-title" className="text-[15px] font-medium">
          상태
        </h3>
        <div role="radiogroup" aria-label="상태" className="mt-3 flex flex-wrap gap-2">
          {[placement.status, ...STATUS_TRANSITIONS[placement.status]].map((status) => (
            <Chip key={status} role="radio" selected={status === placement.status} onClick={() => !busy && onOps([{ op: "setStatus", id: placement.id, status }])}>
              {PLACEMENT_STATUS_LABELS[status]}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-labelledby="when-title">
        <h3 id="when-title" className="text-[15px] font-medium">
          시점
        </h3>
        <div className="mt-3 flex items-center gap-3">
          <button type="button" disabled={busy} onClick={() => shift(-6)} className={secondaryButton}>
            ◀ 반기
          </button>
          <span className="font-mono text-[15px] tabular">{formatPeriod(placement)}</span>
          <button type="button" disabled={busy} onClick={() => shift(6)} className={secondaryButton}>
            반기 ▶
          </button>
        </div>
      </section>

      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>
          메모 <span className="text-smoke">(선택, 200자)</span>
        </span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={2} className={inputClass} />
        <span className="text-[13px] text-smoke">나만 볼 수 있어요. 소득·건강 같은 사정은 적지 마세요.</span>
        <button
          type="button"
          disabled={busy || note.trim() === (placement.note ?? "")}
          onClick={() => onOps([{ op: "setNote", id: placement.id, note }])}
          className={`self-start ${secondaryButton}`}
        >
          메모 저장
        </button>
      </label>

      <div className="border-t border-stone pt-6">
        {confirmRemove ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px]">청사진에서 뺄까요? 기록에는 남아요.</span>
            <button type="button" disabled={busy} onClick={() => onOps([{ op: "removePlacement", id: placement.id }], { close: true })} className={secondaryButton}>
              빼기
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} className="rounded-pill border border-stone px-5 py-2.5">
              그대로 두기
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmRemove(true)} className="text-[14px] text-graphite underline underline-offset-4">
            이 정책 빼기
          </button>
        )}
      </div>
    </div>
  );
}

// ── 정책 넣기 ──

export function AddPolicy({ blueprint, nowMonth, busy, onOps }: SheetProps & { blueprint: Blueprint; nowMonth: string }) {
  const [role, setRole] = useState<(typeof PlacementRole.options)[number] | null>(null);
  const [picked, setPicked] = useState<Policy | null>(null);

  const policies = PLACEABLE.filter((policy) => !role || policy.planning?.roles.includes(role));

  if (picked) return <PlaceForm key={picked.id} blueprint={blueprint} policy={picked} nowMonth={nowMonth} busy={busy} onOps={onOps} onBack={() => setPicked(null)} />;

  return (
    <div>
      <div role="radiogroup" aria-label="하는 일" className="flex flex-wrap gap-2">
        <Chip role="radio" selected={role === null} onClick={() => setRole(null)}>
          전체
        </Chip>
        {PlacementRole.options.map((option) => (
          <Chip key={option} role="radio" selected={role === option} onClick={() => setRole(option)}>
            {PLACEMENT_ROLE_LABELS[option]}
          </Chip>
        ))}
      </div>
      <ul className="mt-6 flex flex-col">
        {policies.map((policy) => (
          <li key={policy.id}>
            <button type="button" onClick={() => setPicked(policy)} className="block w-full border-t border-stone py-4 text-left hover:bg-taupe/40">
              <span className="text-[16px]">
                {policy.name}
                {findCard(policy.id) && <span className="ml-1.5 text-[12px] text-graphite">◆</span>}
              </span>
              <span className="mt-1 block text-[13px] text-smoke">
                {(policy.planning?.roles ?? []).map((r) => PLACEMENT_ROLE_LABELS[r]).join(" · ") || "역할 정보 없음"}
                {policy.planning?.age && ` · ${ageText(policy.planning.age)}`}
              </span>
            </button>
          </li>
        ))}
        {policies.length === 0 && <li className="border-t border-stone py-4 text-graphite">이 역할로 등록된 정책이 아직 없어요.</li>}
      </ul>
    </div>
  );
}

function PlaceForm({ blueprint, policy, nowMonth, busy, onOps, onBack }: SheetProps & { blueprint: Blueprint; policy: Policy; nowMonth: string; onBack: () => void }) {
  const roles = policy.planning?.roles.length ? policy.planning.roles : PlacementRole.options;
  const [from, setFrom] = useState(nowMonth);
  const [months, setMonths] = useState(policy.planning?.durationMonths ? String(policy.planning.durationMonths.value) : "");
  const [role, setRole] = useState(roles[0]);
  const [milestoneId, setMilestoneId] = useState("");

  const length = months.trim() === "" ? 0 : Number(months);
  const valid = /^\d{4}-\d{2}$/.test(from) && Number.isInteger(length) && length >= 0 && length <= 120;

  return (
    <div className="flex flex-col gap-5">
      <button type="button" onClick={onBack} className="self-start text-[14px] text-graphite underline underline-offset-4">
        ← 목록
      </button>
      <p className="text-[20px]">{policy.name}</p>
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>언제부터</span>
        <input type="month" value={from} onChange={(e) => setFrom(e.target.value)} className={`w-44 ${inputClass}`} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>
          몇 개월 <span className="text-smoke">(선택 — 한 번이면 비워 두세요)</span>
        </span>
        <input value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={3} className={`w-24 font-mono tabular ${inputClass}`} />
      </label>
      {roles.length > 1 && (
        <div role="radiogroup" aria-label="하는 일" className="flex flex-wrap gap-2">
          {roles.map((option) => (
            <Chip key={option} role="radio" selected={role === option} onClick={() => setRole(option)}>
              {PLACEMENT_ROLE_LABELS[option]}
            </Chip>
          ))}
        </div>
      )}
      {blueprint.milestones.length > 0 && (
        <label className="flex flex-col gap-1.5 text-[14px]">
          <span>
            이정표 <span className="text-smoke">(선택)</span>
          </span>
          <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className={inputClass}>
            <option value="">없음</option>
            {blueprint.milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        disabled={busy || !valid}
        onClick={() =>
          onOps(
            [
              {
                op: "addPlacement",
                policyId: policy.id,
                from,
                ...(length > 1 && { to: addMonths(from, length - 1) }),
                role,
                ...(milestoneId && { milestoneId }),
              },
            ],
            { close: true },
          )
        }
        className={primaryButton}
      >
        청사진에 넣기
      </button>
    </div>
  );
}

// ── 이정표 ──

export function MilestoneForm({ milestone, nowMonth, busy, onOps }: SheetProps & { milestone: Milestone | null; nowMonth: string }) {
  const [label, setLabel] = useState(milestone?.label ?? "");
  const [at, setAt] = useState(milestone?.at ?? nowMonth);
  const [stage, setStage] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const valid = label.trim().length > 0 && /^\d{4}-\d{2}$/.test(at);

  const save = () =>
    milestone
      ? onOps([{ op: "editMilestone", id: milestone.id, label: label.trim(), at }], { close: true })
      : onOps([{ op: "addMilestone", label: label.trim(), at, ...(stage && { stage: stage as (typeof PlanStage.options)[number] }) }], { close: true });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] text-graphite">입학·졸업·법인 설립처럼 삶의 사건이에요. 정책이 아니에요.</p>
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>이름 (40자)</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="예: 석사 입학" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>언제</span>
        <input type="month" value={at} onChange={(e) => setAt(e.target.value)} className={`w-44 ${inputClass}`} />
      </label>
      {!milestone && (
        <label className="flex flex-col gap-1.5 text-[14px]">
          <span>
            이때부터의 학적·단계 <span className="text-smoke">(선택)</span>
          </span>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass}>
            <option value="">그대로</option>
            {PlanStage.options.map((option) => (
              <option key={option} value={option}>
                {PLAN_STAGE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      )}
      <button type="button" disabled={busy || !valid} onClick={save} className={primaryButton}>
        {milestone ? "바꾸기" : "이정표 넣기"}
      </button>
      {milestone && (
        <div className="border-t border-stone pt-6">
          {confirmRemove ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px]">이정표를 지울까요? 딸린 정책은 남아요.</span>
              <button type="button" disabled={busy} onClick={() => onOps([{ op: "removeMilestone", id: milestone.id }], { close: true })} className={secondaryButton}>
                지우기
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(true)} className="text-[14px] text-graphite underline underline-offset-4">
              이 이정표 지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── 목표 ──

export function GoalForm({ blueprint, busy, onOps }: SheetProps & { blueprint: Blueprint }) {
  const [title, setTitle] = useState(blueprint.goal.title);
  const [horizonYear, setHorizonYear] = useState(blueprint.goal.horizonYear);
  const baseYear = Number(blueprint.baseline.asOf.slice(0, 4));
  /** 놓인 것보다 이르게 잡을 수 없다 — 칸이 목표 연도 밖으로 나간다. */
  const lastYear = Math.max(baseYear, ...[...blueprint.placements.map((p) => p.to ?? p.from), ...blueprint.milestones.map((m) => m.at)].map((ym) => Math.floor(monthIndex(ym) / 12)));

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>목표 (60자)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-[14px]">
        <span>목표 연도</span>
        <select value={horizonYear} onChange={(e) => setHorizonYear(Number(e.target.value))} className={`w-32 ${inputClass}`}>
          {Array.from({ length: MAX_HORIZON_YEARS + 1 }, (_, i) => baseYear + i)
            .filter((year) => year >= lastYear)
            .map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || title.trim().length === 0}
        onClick={() => onOps([{ op: "setGoal", title: title.trim(), horizonYear }], { close: true })}
        className={primaryButton}
      >
        바꾸기
      </button>
    </div>
  );
}
