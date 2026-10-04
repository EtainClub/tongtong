"use client";

import { findCard } from "@/content/cards";
import { POLICIES } from "@/content/policies";
import type { Policy } from "@/content/schema";
import { CERTAINTY_LABELS, PLACEMENT_ROLE_LABELS, PLACEMENT_STATUS_LABELS } from "@/features/labels";
import { certaintyOf, offSeason, type Certainty } from "@/lib/blueprint/certainty";
import type { Blueprint, Milestone, Placement } from "@/lib/blueprint/model";
import { halfLabel } from "@/lib/blueprint/month";
import { timelineBands } from "@/lib/blueprint/timeline";

/*
 * 청사진 시간축 (청사진 설계 7.3). 세로, 반기 띠, "지금" 표시 하나.
 *
 * 이정표는 ● + 굵게. 배치는 왼쪽 선으로 확실성을 보여 준다 — 확정은 실선, 예상은 pending 점선, 미정은 회색 점선.
 * 상태는 오른쪽 글자다 — 색으로 상태를 말하지 않는다. ◆ = 따져볼 카드가 있는 정책.
 */

const policyById = new Map(POLICIES.map((policy) => [policy.id, policy]));

export const policyName = (policyId: string) => policyById.get(policyId)?.name ?? "지금은 볼 수 없는 정책";
export const findPlanPolicy = (policyId: string) => policyById.get(policyId);
export const formatMonth = (ym: string) => ym.replace("-", ".");
export const formatPeriod = (p: Pick<Placement, "from" | "to">) => (p.to && p.to !== p.from ? `${formatMonth(p.from)}–${formatMonth(p.to)}` : formatMonth(p.from));

/** 확실성 라벨. 예상인데 지난 회차의 달과 어긋나면 "예상 · 시기 확인" (청사진 설계 5.3). */
export const certaintyLabel = (placement: Pick<Placement, "from" | "to">, policy: Policy | undefined) =>
  offSeason(placement, policy) ? `${CERTAINTY_LABELS.expected} · 시기 확인` : CERTAINTY_LABELS[certaintyOf(placement, policy)];

/** 지난 회차가 열렸던 달 — "11–12월", "3월 · 9월". 이어지는 달은 묶는다. */
export function seasonText(months: readonly number[]): string {
  const runs: [number, number][] = [];
  for (const m of months) {
    const last = runs[runs.length - 1];
    if (last && last[1] === m - 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs.map(([a, b]) => (a === b ? `${a}월` : `${a}–${b}월`)).join(" · ");
}

const LINE: Record<Certainty, string> = {
  confirmed: "border-ink",
  expected: "border-dashed border-pending",
  undetermined: "border-dashed border-ash",
};
const CERTAINTY_TEXT: Record<Certainty, string> = { confirmed: "text-graphite", expected: "text-pending", undetermined: "text-smoke" };
/** 더는 계획이 아닌 배치는 흐리게 — 기록으로 남긴다. */
const FADED = new Set<Placement["status"]>(["missed", "dropped", "ineligible"]);

export function Timeline({
  blueprint,
  nowMonth,
  onPlacement,
  onMilestone,
}: {
  blueprint: Pick<Blueprint, "milestones" | "placements">;
  nowMonth: string;
  onPlacement?: (placement: Placement) => void;
  onMilestone?: (milestone: Milestone) => void;
}) {
  const bands = timelineBands(blueprint, nowMonth);
  return (
    <ol className="flex flex-col">
      {bands.map((band) => (
        <li key={band.half} className="border-t border-stone pt-3 pb-5">
          <p className="flex items-baseline justify-between text-[13px] text-smoke">
            <span className="font-mono tabular">{halfLabel(band.half)}</span>
            {band.isNow && <span className="text-ink">지금 ▸</span>}
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {band.milestones.map((milestone) => (
              <li key={milestone.id}>
                <Row onClick={onMilestone && (() => onMilestone(milestone))}>
                  <span className="text-[16px] font-medium">● {milestone.label}</span>
                  <span className="font-mono text-[13px] text-smoke tabular">{formatMonth(milestone.at)}</span>
                </Row>
              </li>
            ))}
            {band.placements.map((placement) => (
              <li key={placement.id}>
                <PlacementRow placement={placement} onClick={onPlacement && (() => onPlacement(placement))} />
              </li>
            ))}
          </ul>
          {/* 앞에서 시작해 이 반기에도 이어지는 것 — "그때 무엇으로 사나"를 띠마다 보이게 (검토 A-8). */}
          {band.continuing.length > 0 && (
            <p className="mt-2 text-[13px] text-smoke">
              계속:{" "}
              {band.continuing.map((placement, i) => (
                <span key={placement.id}>
                  {i > 0 && " · "}
                  {onPlacement ? (
                    <button type="button" onClick={() => onPlacement(placement)} className="underline-offset-4 hover:underline">
                      {policyName(placement.policyId)}
                    </button>
                  ) : (
                    policyName(placement.policyId)
                  )}
                </span>
              ))}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function PlacementRow({ placement, onClick }: { placement: Placement; onClick?: () => void }) {
  const policy = findPlanPolicy(placement.policyId);
  const certainty = certaintyOf(placement, policy);
  const hasCard = Boolean(findCard(placement.policyId));
  return (
    <Row onClick={onClick} className={`border-l-2 pl-3 ${LINE[certainty]} ${FADED.has(placement.status) ? "opacity-50" : ""}`}>
      <span className="min-w-0">
        <span className="block text-[16px]">
          {policyName(placement.policyId)}
          {/* 빚을 혜택과 같은 모양으로 두지 않는다 — 색이 아니라 글자로 (검토 A-7). */}
          {policy?.planning?.repayable && <span className="ml-1.5 text-[13px] text-graphite">갚아야 해요</span>}
          {hasCard && <span className="ml-1.5 text-[12px] text-graphite" aria-label="따져볼 카드 있음">◆</span>}
        </span>
        <span className="mt-0.5 block text-[13px] text-smoke">
          <span className="font-mono tabular">{formatPeriod(placement)}</span> · {PLACEMENT_ROLE_LABELS[placement.role]} ·{" "}
          <span className={CERTAINTY_TEXT[certainty]}>{certaintyLabel(placement, policy)}</span>
        </span>
      </span>
      <span className="shrink-0 text-[13px] text-graphite">{PLACEMENT_STATUS_LABELS[placement.status]}</span>
    </Row>
  );
}

/** 누를 수 있으면 버튼 — 화면 낭독기는 보이는 글자(이름·기간·상태)를 그대로 읽는다. */
function Row({ onClick, className = "", children }: { onClick?: () => void; className?: string; children: React.ReactNode }) {
  const layout = `flex w-full items-start justify-between gap-3 py-1 text-left ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${layout} hover:bg-taupe/40`}>
      {children}
    </button>
  ) : (
    <div className={layout}>{children}</div>
  );
}
