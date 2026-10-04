import type { Blueprint, Milestone, Placement } from "@/lib/blueprint/model";
import { halfIndex, monthIndex } from "@/lib/blueprint/month";

/*
 * 시간축 묶기 (청사진 설계 7.3) — 반기 띠마다 그 반기에 있는 이정표와, 그 반기에 시작하는 배치.
 * 여러 반기에 걸친 배치는 시작 반기에 놓고 기간을 글자로 적는다. 뒤의 띠에는 "계속:" 한 줄로 다시 이름만 보인다(검토 A-8) —
 * 몇 년 뒤 띠에서 "그때 무엇으로 사나"가 보여야 한다.
 * 빈 반기는 그리지 않는다 — 지금이 든 반기만은 비어도 남긴다("지금" 표시). 이어지는 것만 있는 반기도 따로 그리지 않는다.
 */

export type Band = { half: number; isNow: boolean; milestones: Milestone[]; placements: Placement[]; continuing: Placement[] };

/** 아직 이어지는 배치 — 끝났거나(done) 계획에서 빠진 것(놓침·뺌·대상 아님)은 "계속"에 넣지 않는다. */
const RUNNING = new Set<Placement["status"]>(["planned", "ready", "applied", "active"]);

export function timelineBands(blueprint: Pick<Blueprint, "milestones" | "placements">, nowMonth: string): Band[] {
  const nowHalf = halfIndex(nowMonth);
  const bands = new Map<number, Band>();
  const band = (half: number) => {
    let found = bands.get(half);
    if (!found) bands.set(half, (found = { half, isNow: half === nowHalf, milestones: [], placements: [], continuing: [] }));
    return found;
  };

  band(nowHalf);
  for (const milestone of blueprint.milestones) band(halfIndex(milestone.at)).milestones.push(milestone);
  for (const placement of blueprint.placements) band(halfIndex(placement.from)).placements.push(placement);

  const byMonth = <T,>(at: (x: T) => string) => (a: T, b: T) => monthIndex(at(a)) - monthIndex(at(b));
  return [...bands.values()]
    .sort((a, b) => a.half - b.half)
    .map((b) => ({
      ...b,
      milestones: b.milestones.sort(byMonth((m) => m.at)),
      placements: b.placements.sort(byMonth((p) => p.from)),
      continuing: blueprint.placements
        .filter((p) => RUNNING.has(p.status) && halfIndex(p.from) < b.half && halfIndex(p.to ?? p.from) >= b.half)
        .sort(byMonth((p) => p.from)),
    }));
}
