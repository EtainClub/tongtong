import type { Path } from "@/content/path-schema";
import { cardVersion, type Policy } from "@/content/schema";
import { MAX_HORIZON_YEARS, type Baseline, type Blueprint, type Goal } from "@/lib/blueprint/model";
import { addMonths } from "@/lib/blueprint/month";

/*
 * 청사진 만들기 (청사진 설계 4.5) — REV.1.
 *
 * 견본을 가져오면 상대 시점(offsetMonths)에 사용자의 기준 달을 더해 실제 달로 바꾼다.
 * 그 뒤로 견본과 청사진은 따로 산다 — 견본이 바뀌어도 덮어쓰지 않는다.
 * 견본 없이 시작하면 목표와 기준만 있는 빈 청사진이다.
 */

type Base = { id: string; baseline: Baseline; now: Date };

/** 견본의 마지막 시점이 들어가는 해 — 목표 연도의 기본값. 10년을 넘지 않는다. */
export function pathHorizonYear(path: Path, asOf: string): number {
  const last = Math.max(...path.milestones.map((m) => m.offsetMonths), ...path.slots.map((s) => s.toOffset ?? s.fromOffset));
  const year = Number(addMonths(asOf, last).slice(0, 4));
  return Math.min(year, Number(asOf.slice(0, 4)) + MAX_HORIZON_YEARS);
}

export function emptyBlueprint({ id, baseline, now, goal }: Base & { goal: Goal }): Blueprint {
  const at = now.toISOString();
  return { id, status: "active", rev: 1, goal, baseline, milestones: [], placements: [], ackedChecks: [], createdAt: at, updatedAt: at };
}

/**
 * 견본 → 청사진. 칸이 가리키는 항목이 지금 보이지 않으면(초안이 운영에서 빠졌을 때) 그 칸은 건너뛴다.
 * 이정표·배치 id는 견본의 id를 그대로 쓴다 — 견본 안에서 이미 겹치지 않는다(validatePath).
 */
export function materialize(path: Path, policies: ReadonlyMap<string, Policy>, { id, baseline, now, title, horizonYear }: Base & { title?: string; horizonYear?: number }): Blueprint {
  const at = now.toISOString();
  const month = (offset: number) => addMonths(baseline.asOf, offset);
  return {
    ...emptyBlueprint({
      id,
      baseline,
      now,
      goal: {
        kind: path.goalKind,
        title: title?.trim() || path.title,
        horizonYear: horizonYear ?? pathHorizonYear(path, baseline.asOf),
        pathId: path.id,
        pathVersion: cardVersion(path),
      },
    }),
    milestones: path.milestones.map((m) => ({ id: m.id, label: m.label, at: month(m.offsetMonths), ...(m.stage && { stage: m.stage }) })),
    placements: path.slots.flatMap((slot) => {
      const policy = policies.get(slot.policyId);
      if (!policy) return [];
      return [
        {
          id: slot.id,
          policyId: policy.id,
          policyVersion: cardVersion(policy),
          ...(slot.milestoneId && { milestoneId: slot.milestoneId }),
          from: month(slot.fromOffset),
          ...(slot.toOffset !== undefined && { to: month(slot.toOffset) }),
          role: slot.role,
          status: "planned" as const,
          statusAt: at,
        },
      ];
    }),
  };
}
