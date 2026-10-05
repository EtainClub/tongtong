import { z } from "zod";

import { cardVersion, PlacementRole, PlanStage, type Policy } from "@/content/schema";
import { diffBlueprint } from "@/lib/blueprint/diff";
import {
  BlueprintGoalKind,
  MAX_HORIZON_YEARS,
  MAX_MILESTONES,
  MAX_PLACEMENTS,
  PlacementStatus,
  placementSchema,
  STATUS_TRANSITIONS,
  type Blueprint,
  type Change,
  type Placement,
} from "@/lib/blueprint/model";
import { monthIndex, YearMonth } from "@/lib/blueprint/month";

/*
 * 청사진 쓰기 규칙 (청사진 설계 5.2). 클라이언트는 의도(op 목록)만 보내고, 서버가 여기서 다음 모습을 만든다.
 *
 * 쓰기 한 번 = REV 하나. 여러 op를 한 번에 보내면 한 REV로 묶인다. 바뀐 것이 없으면 REV를 올리지 않는다(no-change).
 * 변경 로그는 앞뒤 모습의 diff로 만든다 — op마다 따로 적지 않아서 로그와 실제가 어긋날 수 없다.
 * Firestore와 떨어져 있어서 단위 테스트가 된다 (lib/user-state와 같은 방식).
 * 지운 선택 필드는 undefined로 둔다 — 비교(diff)는 없는 것과 같게 보고, 저장할 때 빠진다(server/blueprint-store).
 */

const id = z.string().regex(/^[a-z0-9-]{1,40}$/);
const label = z.string().trim().min(1).max(40);

export const blueprintOp = z.discriminatedUnion("op", [
  z.object({ op: z.literal("addPlacement"), policyId: z.string(), from: YearMonth, to: YearMonth.optional(), role: PlacementRole, milestoneId: id.optional() }),
  z.object({ op: z.literal("removePlacement"), id }),
  /** to를 빼면 한 달짜리가 된다 — 기간을 지키려면 클라이언트가 to도 옮겨 보낸다. */
  z.object({ op: z.literal("movePlacement"), id, from: YearMonth, to: YearMonth.optional() }),
  z.object({ op: z.literal("setStatus"), id, status: PlacementStatus }),
  /** 항목이 개정됐는데 계획은 그대로 둔다 — 배치가 기대는 버전을 항목의 지금 버전으로 (점검 policy-updated의 "이대로 둘게요"). */
  z.object({ op: z.literal("acceptPolicyVersion"), id }),
  /** 빈 문자열은 메모를 지운다. */
  z.object({ op: z.literal("setNote"), id, note: z.string().trim().max(200) }),
  z.object({ op: z.literal("addMilestone"), label, at: YearMonth, stage: PlanStage.optional() }),
  /** stage: null은 단계를 지운다(이 이정표에서 단계가 바뀌지 않음), 생략하면 그대로 (검토 A-14). */
  z.object({ op: z.literal("editMilestone"), id, label: label.optional(), at: YearMonth.optional(), stage: PlanStage.nullable().optional() }),
  /** 이 이정표에 딸린 배치는 남고, 이정표 연결만 끊긴다. */
  z.object({ op: z.literal("removeMilestone"), id }),
  z.object({ op: z.literal("setGoal"), title: z.string().trim().min(1).max(60).optional(), horizonYear: z.number().int().optional() }),
  /**
   * 배치 하나를 앞의 모습 그대로 되돌린다 — 점검 반영 뒤 "되돌리기"(청사진 설계 7.5)만 쓴다.
   * 뺀 배치는 같은 id로 다시 넣고, 있는 배치는 통째로 바꾼다. 상태 전이 표를 거치지 않는다 — 내 청사진의 앞 모습으로 돌아갈 뿐이다.
   * 되돌리기도 새 REV다(기록은 지우지 않는다).
   */
  z.object({ op: z.literal("restorePlacement"), placement: placementSchema }),
]);
export type BlueprintOp = z.infer<typeof blueprintOp>;

/** 왜 바뀌었나 — 사용자가 직접 고쳤나, 점검을 반영했나 (REV 기록에 남는다). */
export const patchTrigger = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("user") }),
  z.object({ kind: z.literal("check"), checkKind: z.string().max(40), policyId: z.string().max(100).optional() }),
]);
export type PatchTrigger = z.infer<typeof patchTrigger>;

export const blueprintPatchInput = z.object({
  id,
  /** 보고 고친 REV. 그 사이 다른 기기에서 바뀌었으면 거절한다(stale-rev) — 덮어쓰지 않는다. */
  expectedRev: z.number().int().positive(),
  ops: z.array(blueprintOp).min(1).max(20),
  intent: z.string().trim().max(80).optional(),
  trigger: patchTrigger.optional(),
});

/**
 * 점검 알림 닫기 (청사진 설계 5.1) — 계획을 바꾸지 않으므로 REV를 올리지 않는다.
 * live는 지금 화면에 계산된 점검 키 전부다. 그 밖의 옛 키는 걷어 내 ackedChecks가 끝없이 쌓이지 않게 한다.
 */
export const blueprintAckInput = z.object({
  id,
  keys: z.array(z.string().max(200)).min(1).max(20),
  live: z.array(z.string().max(200)).max(200),
});
export type BlueprintAckInput = z.infer<typeof blueprintAckInput>;

/** 닫은 점검 키 — (이미 닫은 것 + 새로 닫은 것) 가운데 지금도 계산되는 것만. 순서는 처음 닫은 순서. */
export function nextAckedChecks(prev: readonly string[], keys: readonly string[], live: readonly string[]): string[] {
  const alive = new Set(live);
  return [...new Set([...prev, ...keys])].filter((key) => alive.has(key));
}
export type BlueprintPatchInput = z.infer<typeof blueprintPatchInput>;

/** 만들기. 기준 달(asOf)은 서버가 정한다 — 오늘. anchor는 견본의 출발점이 되는 달(없으면 오늘, 견본일 때만). */
export const blueprintCreateInput = z.object({
  pathId: z.string().optional(),
  anchor: YearMonth.optional(),
  kind: BlueprintGoalKind,
  title: z.string().trim().min(1).max(60),
  horizonYear: z.number().int().optional(),
  stage: PlanStage,
  age: z.number().int().min(14).max(60).optional(),
});
export type BlueprintCreateInput = z.infer<typeof blueprintCreateInput>;

export class BlueprintRejection extends Error {
  constructor(
    public readonly code:
      | "unknown-path" // 견본이 없거나 지금 보이지 않는다
      | "unknown-policy" // 항목이 없거나, 청년 대상이 아니다
      | "unknown-placement"
      | "unknown-milestone"
      | "too-many-placements"
      | "too-many-milestones"
      | "invalid-range" // 끝이 시작보다 이르거나, 목표 연도 밖이다
      | "invalid-horizon" // 목표 연도가 기준 연도 ~ +10년 밖이다
      | "invalid-transition" // 그 상태에서 갈 수 없는 상태다
      | "no-change",
  ) {
    super(code);
  }
}

export type ApplyContext = {
  policies: ReadonlyMap<string, Policy>;
  now: Date;
  /** 새 이정표·배치 id의 꼬리. 서버는 무작위, 테스트는 순번. */
  newId: () => string;
};

/** 목표 연도가 기준 연도에서 0–10년 안인가. */
export function checkHorizon(asOf: string, horizonYear: number) {
  const base = Number(asOf.slice(0, 4));
  if (horizonYear < base || horizonYear > base + MAX_HORIZON_YEARS) throw new BlueprintRejection("invalid-horizon");
}

/** 놓인 배치(끝 달)와 이정표 가운데 가장 늦은 해. 아무것도 없으면 기준 연도. */
export function lastPlacedYear(blueprint: Pick<Blueprint, "baseline" | "placements" | "milestones">): number {
  const months = [...blueprint.placements.map((p) => p.to ?? p.from), ...blueprint.milestones.map((m) => m.at)];
  return Math.max(Number(blueprint.baseline.asOf.slice(0, 4)), ...months.map((ym) => Math.floor(monthIndex(ym) / 12)));
}

/** 견본의 출발 달이 고를 수 있는 범위 안인가 (검토 A-4, materialize의 anchorRange). */
export function checkAnchor(range: { min: string; max: string }, anchor: string) {
  if (monthIndex(anchor) < monthIndex(range.min) || monthIndex(anchor) > monthIndex(range.max)) throw new BlueprintRejection("invalid-range");
}

/** 배치·이정표 기간 — 기준 10년 전부터 목표 연도 끝까지. 끝은 시작보다 이를 수 없다. */
function checkRange(blueprint: Blueprint, from: string, to?: string) {
  const lower = monthIndex(blueprint.baseline.asOf) - MAX_HORIZON_YEARS * 12;
  const upper = blueprint.goal.horizonYear * 12 + 11;
  const end = monthIndex(to ?? from);
  if (monthIndex(from) < lower || end > upper || end < monthIndex(from)) throw new BlueprintRejection("invalid-range");
}

function findPlacement(blueprint: Blueprint, placementId: string): Placement {
  const placement = blueprint.placements.find((p) => p.id === placementId);
  if (!placement) throw new BlueprintRejection("unknown-placement");
  return placement;
}

function requireMilestone(blueprint: Blueprint, milestoneId: string | undefined) {
  if (milestoneId && !blueprint.milestones.some((m) => m.id === milestoneId)) throw new BlueprintRejection("unknown-milestone");
}

/** 청사진에 놓을 수 있는 항목 — 보이는(운영에서는 공개) 청년 대상 항목. */
export function placeablePolicy(policies: ReadonlyMap<string, Policy>, policyId: string): Policy {
  const policy = policies.get(policyId);
  if (!policy || !policy.audience.includes("young_adult")) throw new BlueprintRejection("unknown-policy");
  return policy;
}

/** op 하나를 적용한 새 모습. 입력을 바꾸지 않는다. */
function applyOne(blueprint: Blueprint, op: BlueprintOp, ctx: ApplyContext): Blueprint {
  const at = ctx.now.toISOString();
  const withPlacement = (placementId: string, patch: (p: Placement) => Placement) => {
    findPlacement(blueprint, placementId);
    return { ...blueprint, placements: blueprint.placements.map((p) => (p.id === placementId ? patch(p) : p)) };
  };

  switch (op.op) {
    case "addPlacement": {
      const policy = placeablePolicy(ctx.policies, op.policyId);
      if (blueprint.placements.length >= MAX_PLACEMENTS) throw new BlueprintRejection("too-many-placements");
      requireMilestone(blueprint, op.milestoneId);
      checkRange(blueprint, op.from, op.to);
      const placement: Placement = {
        id: `p-${ctx.newId()}`,
        policyId: policy.id,
        policyVersion: cardVersion(policy),
        ...(op.milestoneId && { milestoneId: op.milestoneId }),
        from: op.from,
        ...(op.to && { to: op.to }),
        role: op.role,
        status: "planned",
        statusAt: at,
      };
      return { ...blueprint, placements: [...blueprint.placements, placement] };
    }
    case "removePlacement":
      findPlacement(blueprint, op.id);
      return { ...blueprint, placements: blueprint.placements.filter((p) => p.id !== op.id) };
    case "movePlacement":
      checkRange(blueprint, op.from, op.to);
      return withPlacement(op.id, (p) => ({ ...p, from: op.from, to: op.to }));
    case "setStatus":
      return withPlacement(op.id, (p) => {
        if (p.status === op.status) return p;
        if (!STATUS_TRANSITIONS[p.status].includes(op.status)) throw new BlueprintRejection("invalid-transition");
        return { ...p, status: op.status, statusAt: at };
      });
    case "acceptPolicyVersion":
      return withPlacement(op.id, (p) => ({ ...p, policyVersion: cardVersion(placeablePolicy(ctx.policies, p.policyId)) }));
    case "setNote":
      return withPlacement(op.id, (p) => ({ ...p, note: op.note || undefined }));
    case "restorePlacement": {
      const restored = op.placement;
      const policy = placeablePolicy(ctx.policies, restored.policyId);
      // 앞 모습은 지금 항목 버전을 넘을 수 없다 — 넘으면 만든 값이다.
      if (restored.policyVersion > cardVersion(policy)) throw new BlueprintRejection("unknown-policy");
      checkRange(blueprint, restored.from, restored.to);
      const exists = blueprint.placements.some((p) => p.id === restored.id);
      if (!exists && blueprint.placements.length >= MAX_PLACEMENTS) throw new BlueprintRejection("too-many-placements");
      // 그 사이 이정표가 지워졌으면 연결만 끊는다.
      const placement = { ...restored, milestoneId: restored.milestoneId && blueprint.milestones.some((m) => m.id === restored.milestoneId) ? restored.milestoneId : undefined };
      return {
        ...blueprint,
        placements: exists ? blueprint.placements.map((p) => (p.id === restored.id ? placement : p)) : [...blueprint.placements, placement],
      };
    }
    case "addMilestone":
      if (blueprint.milestones.length >= MAX_MILESTONES) throw new BlueprintRejection("too-many-milestones");
      checkRange(blueprint, op.at);
      return { ...blueprint, milestones: [...blueprint.milestones, { id: `m-${ctx.newId()}`, label: op.label, at: op.at, ...(op.stage && { stage: op.stage }) }] };
    case "editMilestone":
      requireMilestone(blueprint, op.id);
      if (op.at) checkRange(blueprint, op.at);
      return {
        ...blueprint,
        milestones: blueprint.milestones.map((m) =>
          m.id === op.id
            ? { ...m, ...(op.label && { label: op.label }), ...(op.at && { at: op.at }), ...(op.stage !== undefined && { stage: op.stage ?? undefined }) }
            : m,
        ),
      };
    case "removeMilestone":
      requireMilestone(blueprint, op.id);
      return {
        ...blueprint,
        milestones: blueprint.milestones.filter((m) => m.id !== op.id),
        placements: blueprint.placements.map((p) => (p.milestoneId === op.id ? { ...p, milestoneId: undefined } : p)),
      };
    case "setGoal":
      if (op.horizonYear !== undefined) {
        checkHorizon(blueprint.baseline.asOf, op.horizonYear);
        // 놓인 배치·이정표보다 이른 해로 줄이면 그것들이 목표 연도 밖으로 나간다 (검토 A-16). 화면만이 아니라 여기서 막는다.
        if (op.horizonYear < lastPlacedYear(blueprint)) throw new BlueprintRejection("invalid-horizon");
      }
      return { ...blueprint, goal: { ...blueprint.goal, ...(op.title && { title: op.title }), ...(op.horizonYear !== undefined && { horizonYear: op.horizonYear }) } };
  }
}

/**
 * op 목록을 차례로 적용한다. 하나라도 거절되면 모두 거절한다 — 반쯤 적용된 REV는 없다.
 * 돌려주는 changes가 그 REV의 변경 로그다.
 */
export function applyChanges(prev: Blueprint, ops: readonly BlueprintOp[], ctx: ApplyContext): { next: Blueprint; changes: Change[] } {
  const applied = ops.reduce((blueprint, op) => applyOne(blueprint, op, ctx), prev);
  const changes = diffBlueprint(prev, applied);
  if (changes.length === 0) throw new BlueprintRejection("no-change");
  return { next: { ...applied, rev: prev.rev + 1, updatedAt: ctx.now.toISOString() }, changes };
}
