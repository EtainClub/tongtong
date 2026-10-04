import type { Blueprint, Change } from "@/lib/blueprint/model";

/*
 * REV 비교 (청사진 설계 5.2) — 두 모습 사이에서 바뀐 것만 뽑는다. LLM 없이 순수 함수로.
 * apply.ts가 쓰기마다 이것으로 변경 로그를 만들고, REV 기록 화면도 같은 결과를 그린다.
 * before/after에는 바뀐 필드만 담는다.
 */

function changed<T extends object>(a: T, b: T, keys: readonly (keyof T)[]): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const diff = keys.filter((key) => a[key] !== b[key]);
  if (diff.length === 0) return null;
  return {
    before: Object.fromEntries(diff.map((key) => [key, a[key] ?? null])),
    after: Object.fromEntries(diff.map((key) => [key, b[key] ?? null])),
  };
}

export function diffBlueprint(a: Blueprint, b: Blueprint): Change[] {
  const changes: Change[] = [];

  const goal = changed(a.goal, b.goal, ["title", "horizonYear"]);
  if (goal) changes.push({ op: "goal", targetId: "goal", ...goal });

  const aMilestones = new Map(a.milestones.map((m) => [m.id, m]));
  const bMilestones = new Map(b.milestones.map((m) => [m.id, m]));
  for (const [id, before] of aMilestones) {
    const after = bMilestones.get(id);
    if (!after) changes.push({ op: "milestone", targetId: id, before: { label: before.label, at: before.at }, after: null });
    else {
      const fields = changed(before, after, ["label", "at", "stage"]);
      if (fields) changes.push({ op: "milestone", targetId: id, ...fields });
    }
  }
  for (const [id, after] of bMilestones) {
    if (!aMilestones.has(id)) changes.push({ op: "milestone", targetId: id, before: null, after: { label: after.label, at: after.at } });
  }

  const aPlacements = new Map(a.placements.map((p) => [p.id, p]));
  const bPlacements = new Map(b.placements.map((p) => [p.id, p]));
  for (const [id, before] of aPlacements) {
    const after = bPlacements.get(id);
    if (!after) {
      changes.push({ op: "remove", targetId: id, before: { policyId: before.policyId, from: before.from, to: before.to ?? null }, after: null });
      continue;
    }
    const move = changed(before, after, ["from", "to", "milestoneId"]);
    if (move) changes.push({ op: "move", targetId: id, ...move });
    const status = changed(before, after, ["status"]);
    if (status) changes.push({ op: "status", targetId: id, ...status });
    const note = changed(before, after, ["note"]);
    if (note) changes.push({ op: "note", targetId: id, ...note });
    const basis = changed(before, after, ["policyVersion"]);
    if (basis) changes.push({ op: "basis", targetId: id, ...basis });
  }
  for (const [id, after] of bPlacements) {
    if (!aPlacements.has(id)) {
      changes.push({ op: "add", targetId: id, before: null, after: { policyId: after.policyId, from: after.from, to: after.to ?? null, role: after.role } });
    }
  }

  return changes;
}
