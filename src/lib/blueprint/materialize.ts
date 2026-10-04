import type { Path } from "@/content/path-schema";
import { cardVersion, type Policy } from "@/content/schema";
import { MAX_HORIZON_YEARS, type Baseline, type Blueprint, type Goal } from "@/lib/blueprint/model";
import { addMonths, fromIndex } from "@/lib/blueprint/month";

/*
 * 청사진 만들기 (청사진 설계 4.5) — REV.1.
 *
 * 견본을 가져오면 상대 시점(offsetMonths)에 사용자의 기준 달을 더해 실제 달로 바꾼다.
 * 그 뒤로 견본과 청사진은 따로 산다 — 견본이 바뀌어도 덮어쓰지 않는다.
 * 견본 없이 시작하면 목표와 기준만 있는 빈 청사진이다.
 */

type Base = { id: string; baseline: Baseline; now: Date };

/** 견본이 그리는 길이 — 출발점에서 마지막 이정표·칸까지 몇 달. */
const pathLength = (path: Path) => Math.max(...path.milestones.map((m) => m.offsetMonths), ...path.slots.map((s) => s.toOffset ?? s.fromOffset));

/** 출발 달에서 견본의 마지막 시점이 들어가는 해 — 목표 연도의 기본값이자 하한(그보다 이르면 칸이 목표 연도 밖으로 나간다). */
export function pathHorizonYear(path: Path, anchor: string): number {
  return Number(addMonths(anchor, pathLength(path)).slice(0, 4));
}

/**
 * 견본의 출발 달로 고를 수 있는 범위 (검토 A-4). 이미 지난 출발점(올해 3월에 3학년이 됐다)도 고를 수 있게 4년 전부터,
 * 견본의 끝이 목표 연도 상한(기준 연도 + 10년)을 넘지 않는 달까지.
 */
export function anchorRange(path: Path, asOf: string): { min: string; max: string } {
  const lastMonthOfHorizon = (Number(asOf.slice(0, 4)) + MAX_HORIZON_YEARS) * 12 + 11;
  return { min: addMonths(asOf, -48), max: fromIndex(lastMonthOfHorizon - pathLength(path)) };
}

export function emptyBlueprint({ id, baseline, now, goal }: Base & { goal: Goal }): Blueprint {
  const at = now.toISOString();
  return { id, status: "active", rev: 1, goal, baseline, milestones: [], placements: [], ackedChecks: [], createdAt: at, updatedAt: at };
}

/**
 * 견본 → 청사진. 칸이 가리키는 항목이 지금 보이지 않으면(초안이 운영에서 빠졌을 때) 그 칸은 건너뛴다.
 * 이정표·배치 id는 견본의 id를 그대로 쓴다 — 견본 안에서 이미 겹치지 않는다(validatePath).
 * anchor는 견본의 출발점(offset 0)이 되는 달이다. 없으면 기준 달(오늘). 범위 검사는 부르는 쪽이 한다(anchorRange).
 */
export function materialize(
  path: Path,
  policies: ReadonlyMap<string, Policy>,
  { id, baseline, now, title, horizonYear, anchor = baseline.asOf }: Base & { title?: string; horizonYear?: number; anchor?: string },
): Blueprint {
  const at = now.toISOString();
  const month = (offset: number) => addMonths(anchor, offset);
  return {
    ...emptyBlueprint({
      id,
      baseline,
      now,
      goal: {
        kind: path.goalKind,
        title: title?.trim() || path.title,
        horizonYear: horizonYear ?? pathHorizonYear(path, anchor),
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
