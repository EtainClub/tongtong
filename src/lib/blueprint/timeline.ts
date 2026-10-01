import type { Blueprint, Milestone, Placement } from "@/lib/blueprint/model";
import { halfIndex, monthIndex } from "@/lib/blueprint/month";

/*
 * 시간축 묶기 (청사진 설계 7.3) — 반기 띠마다 그 반기에 있는 이정표와, 그 반기에 시작하는 배치.
 * 여러 반기에 걸친 배치는 시작 반기에 한 번만 놓고 기간을 글자로 적는다.
 * 빈 반기는 그리지 않는다 — 지금이 든 반기만은 비어도 남긴다("지금" 표시).
 */

export type Band = { half: number; isNow: boolean; milestones: Milestone[]; placements: Placement[] };

export function timelineBands(blueprint: Pick<Blueprint, "milestones" | "placements">, nowMonth: string): Band[] {
  const nowHalf = halfIndex(nowMonth);
  const bands = new Map<number, Band>();
  const band = (half: number) => {
    let found = bands.get(half);
    if (!found) bands.set(half, (found = { half, isNow: half === nowHalf, milestones: [], placements: [] }));
    return found;
  };

  band(nowHalf);
  for (const milestone of blueprint.milestones) band(halfIndex(milestone.at)).milestones.push(milestone);
  for (const placement of blueprint.placements) band(halfIndex(placement.from)).placements.push(placement);

  const byMonth = <T,>(at: (x: T) => string) => (a: T, b: T) => monthIndex(at(a)) - monthIndex(at(b));
  return [...bands.values()]
    .sort((a, b) => a.half - b.half)
    .map((b) => ({ ...b, milestones: b.milestones.sort(byMonth((m) => m.at)), placements: b.placements.sort(byMonth((p) => p.from)) }));
}
