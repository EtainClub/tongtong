import type { Path } from "@/content/path-schema";
import { cardVersion, type Policy } from "@/content/schema";
import type { BlueprintOp } from "@/lib/blueprint/apply";
import type { Blueprint, Placement } from "@/lib/blueprint/model";
import { addMonths, monthIndex, monthOf, overlaps } from "@/lib/blueprint/month";
import { applicationState, endOf } from "@/lib/policy-state";

/*
 * 살아있는 청사진의 점검 (청사진 설계 5.1). 정책이 바뀌거나 시간이 흐르면 청사진에서 고칠 곳이 생긴다.
 *
 * 저장하지 않고 열 때마다 계산한다 — 신청 상태를 날짜에서 계산하는 것과 같다(검토 문서 4.3). 사용자가 닫은
 * 알림의 키만 청사진에 남는다(ackedChecks). 결과는 구조만 담는다 — 문장은 화면이 만든다(features/plan/checkText).
 *
 * 닫는 길은 셋이다 (5.1):
 *   고친다      fixes의 op를 반영 — REV가 오른다(trigger: check)
 *   받아들인다  policy-updated의 accept — 배치가 기대는 항목 버전을 올린다. 계획의 근거가 바뀌었으니 REV
 *   알림만 닫는다  dismissible인 것 — ackedChecks에 키만 적는다. REV 없음
 * 자격을 판정하지 않는다 — 나이·단계 점검은 "다를 수 있어요"까지만 말한다(원칙 3).
 */

export type CheckKind =
  | "policy-updated"
  | "policy-withdrawn"
  | "policy-ended"
  | "window-closing"
  | "window-missed"
  | "age-limit"
  | "exclusive-overlap"
  | "program-ending"
  | "stage-mismatch"
  | "missing-prerequisite"
  | "schedule-confirmed"
  | "window-open"
  | "card-available"
  | "path-updated";

/** 화면이 보여 주는 순서 — 놓치면 되돌릴 수 없는 것부터. */
const ORDER: readonly CheckKind[] = [
  "policy-updated",
  "policy-withdrawn",
  "policy-ended",
  "window-closing",
  "window-missed",
  "age-limit",
  "exclusive-overlap",
  "program-ending",
  "stage-mismatch",
  "missing-prerequisite",
  "schedule-confirmed",
  "window-open",
  "card-available",
  "path-updated",
];

export type FixId = "accept" | "remove" | "remove-other" | "trim" | "ready" | "missed" | "next-round" | "move-to-round";
export type Fix = { id: FixId; ops: BlueprintOp[] };

export type Check = {
  /** 종류:대상:근거 — 근거(회차·버전·시점)가 바뀌면 키도 바뀌어 닫은 알림이 다시 뜬다. */
  key: string;
  kind: CheckKind;
  placementId?: string;
  policyId?: string;
  /** 문장에 쓰는 값. */
  data: Record<string, string | number | boolean | null>;
  fixes: Fix[];
  /** 알림만 닫을 수 있나. 계획의 근거가 바뀐 policy-updated는 닫지 못하고 받아들이거나 고친다. */
  dismissible: boolean;
};

export type CheckContext = {
  /** 앱에 보이는 항목(운영에서는 공개). 없으면 내려간 항목이다. */
  policies: ReadonlyMap<string, Policy>;
  paths: ReadonlyMap<string, Path>;
  hasCard: (policyId: string) => boolean;
  /** 끝까지 따져본 카드 — card-available은 아직 따져보지 않은 것만. */
  completedCards: ReadonlySet<string>;
  now: Date;
};

/** 신청 마감 임박 — 이만큼 남으면 "곧 닫혀요". */
export const CLOSING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 아직 계획 안에 있는 배치 — 끝났거나 빠진 것은 점검하지 않는다. */
const RUNNING = new Set<Placement["status"]>(["planned", "ready", "applied", "active"]);
/** 신청 전 — 신청 기간 점검은 이 둘에만. */
const BEFORE_APPLYING = new Set<Placement["status"]>(["planned", "ready"]);

const endMonth = (p: Pick<Placement, "from" | "to">) => p.to ?? p.from;

/** 기간을 지키며 옮기는 op. */
function moveTo(placement: Placement, from: string): BlueprintOp {
  const shift = monthIndex(from) - monthIndex(placement.from);
  return { op: "movePlacement", id: placement.id, from, ...(placement.to && { to: addMonths(placement.to, shift) }) };
}

const remove = (placement: Placement): Fix => ({ id: "remove", ops: [{ op: "removePlacement", id: placement.id }] });

/** 그 달의 학적·단계 — 기준 단계에서 시작해, 그 달까지 지난 이정표의 단계로 바뀐다. */
export function blueprintStageAt(blueprint: Pick<Blueprint, "baseline" | "milestones">, month: string) {
  let stage = blueprint.baseline.stage;
  for (const milestone of [...blueprint.milestones].sort((a, b) => monthIndex(a.at) - monthIndex(b.at))) {
    if (monthIndex(milestone.at) > monthIndex(month)) break;
    stage = milestone.stage ?? stage;
  }
  return stage;
}

/**
 * 그 달의 만 나이 범위. 기준 달의 나이만 알고 생일은 모르므로, 기준에서 몇 달 지났는지로 [lo, lo + 1]까지만 안다.
 * (기준 달 바로 뒤가 생일이면 한 달 만에 한 살 많아진다.)
 */
export function ageRangeAt(baseline: Blueprint["baseline"], month: string): [number, number] | null {
  if (baseline.age === undefined) return null;
  const lo = baseline.age + Math.floor((monthIndex(month) - monthIndex(baseline.asOf)) / 12);
  return [lo, lo + 1];
}

function placementChecks(blueprint: Blueprint, placement: Placement, ctx: CheckContext): Check[] {
  const checks: Check[] = [];
  const policy = ctx.policies.get(placement.policyId);
  const base = { placementId: placement.id, policyId: placement.policyId };

  if (!policy) {
    return [{ key: `policy-withdrawn:${placement.id}`, kind: "policy-withdrawn", ...base, data: {}, fixes: [remove(placement)], dismissible: true }];
  }

  // 항목의 중요 개정 — 계획이 기대는 사실이 바뀌었다.
  const updates = policy.revisions.filter((rev) => rev.material && rev.version > placement.policyVersion);
  if (updates.length > 0) {
    const latest = updates[updates.length - 1];
    checks.push({
      key: `policy-updated:${placement.id}:v${cardVersion(policy)}`,
      kind: "policy-updated",
      ...base,
      data: { from: placement.policyVersion, to: latest.version, summary: latest.summary, date: latest.date },
      fixes: [{ id: "accept", ops: [{ op: "acceptPolicyVersion", id: placement.id }] }, remove(placement)],
      dismissible: false,
    });
  }

  // 이미 끝난 정책.
  const ended = policy.policy.history.find((event) => event.kind === "ended" && monthIndex(event.date.slice(0, 7)) <= monthIndex(endMonth(placement)));
  if (ended) {
    checks.push({ key: `policy-ended:${placement.id}:${ended.date}`, kind: "policy-ended", ...base, data: { date: ended.date }, fixes: [remove(placement)], dismissible: true });
  }

  // 끝나기로 된 사업 뒤까지 놓였다.
  const endsAt = policy.planning?.endsAt?.month;
  if (endsAt && monthIndex(endMonth(placement)) > monthIndex(endsAt)) {
    const trimmable = monthIndex(placement.from) <= monthIndex(endsAt);
    checks.push({
      key: `program-ending:${placement.id}:${endsAt}:${endMonth(placement)}`,
      kind: "program-ending",
      ...base,
      data: { endsAt, startsAfter: !trimmable },
      fixes: [...(trimmable ? [{ id: "trim" as const, ops: [{ op: "movePlacement" as const, id: placement.id, from: placement.from, to: endsAt }] }] : []), remove(placement)],
      dismissible: true,
    });
  }

  // 신청 회차 — 배치가 시작하는 달이 든 회차.
  if (BEFORE_APPLYING.has(placement.status)) {
    const inWindow = policy.policy.applications.filter((app) => overlaps(monthOf(app.startAt), monthOf(app.endAt), placement.from, undefined));
    for (const app of inWindow) {
      const state = applicationState(app, ctx.now);
      const data = { label: app.label, startAt: app.startAt, endAt: app.endAt, url: app.url ?? null };
      if (state === "open") {
        // 내림 — 46일 6시간 남았으면 46일. 남은 시간을 부풀려 말하지 않는다. 0은 "오늘 마감".
        const daysLeft = Math.max(0, Math.floor((endOf(app.endAt) - ctx.now.getTime()) / DAY_MS));
        const kind = daysLeft <= CLOSING_DAYS ? "window-closing" : "window-open";
        checks.push({
          key: `${kind}:${placement.id}:${app.label}`,
          kind,
          ...base,
          data: { ...data, daysLeft },
          fixes: placement.status === "planned" ? [{ id: "ready", ops: [{ op: "setStatus", id: placement.id, status: "ready" }] }] : [],
          dismissible: true,
        });
      } else if (state === "closed") {
        const recurring = policy.planning?.recurrence?.kind === "annual" || policy.planning?.recurrence?.kind === "rounds";
        checks.push({
          key: `window-missed:${placement.id}:${app.label}`,
          kind: "window-missed",
          ...base,
          data,
          fixes: [
            ...(recurring ? [{ id: "next-round" as const, ops: [moveTo(placement, addMonths(placement.from, 12))] }] : []),
            { id: "missed", ops: [{ op: "setStatus", id: placement.id, status: "missed" }] },
          ],
          dismissible: true,
        });
      }
    }

    // 예상으로 놓았는데 가까운 실제 회차가 나왔다 — 그 달로 맞추자.
    if (placement.status === "planned" && inWindow.length === 0) {
      const near = policy.policy.applications.find((app) => {
        const state = applicationState(app, ctx.now);
        return state !== "closed" && Math.abs(monthIndex(monthOf(app.startAt)) - monthIndex(placement.from)) <= 6;
      });
      if (near) {
        checks.push({
          key: `schedule-confirmed:${placement.id}:${near.label}:${placement.from}`,
          kind: "schedule-confirmed",
          ...base,
          data: { label: near.label, startAt: near.startAt, endAt: near.endAt },
          fixes: [{ id: "move-to-round", ops: [moveTo(placement, monthOf(near.startAt))] }],
          dismissible: true,
        });
      }
    }
  }

  // 나이 — 생일을 몰라 범위로만 안다. 넘는지 확실하면 "넘어요", 경계면 "넘었을 수 있어요"(검토 A-17).
  const age = policy.planning?.age;
  const range = ageRangeAt(blueprint.baseline, placement.from);
  if (age && range) {
    const [lo, hi] = range;
    const over = age.max !== undefined && hi > age.max;
    const under = age.min !== undefined && lo < age.min;
    if (over || under) {
      checks.push({
        key: `age-limit:${placement.id}:${placement.from}`,
        kind: "age-limit",
        ...base,
        data: { over, certain: over ? lo > age.max! : hi < age.min!, min: age.min ?? null, max: age.max ?? null },
        fixes: [remove(placement)],
        dismissible: true,
      });
    }
  }

  // 학적·단계 — 그 시점의 단계가 대상 단계 밖.
  const stages = policy.planning?.stages ?? [];
  const stage = blueprintStageAt(blueprint, placement.from);
  if (stages.length > 0 && !stages.includes(stage)) {
    checks.push({ key: `stage-mismatch:${placement.id}:${placement.from}:${stage}`, kind: "stage-mismatch", ...base, data: { stage }, fixes: [], dismissible: true });
  }

  // 선행 조건 — 먼저 있어야 할 항목이 그 전에 놓이지 않았다.
  for (const link of policy.planning?.after ?? []) {
    const satisfied = blueprint.placements.some((other) => other.policyId === link.policyId && other.status !== "dropped" && monthIndex(other.from) <= monthIndex(placement.from));
    if (!satisfied) {
      checks.push({ key: `missing-prerequisite:${placement.id}:${link.policyId}`, kind: "missing-prerequisite", ...base, data: { requires: link.policyId }, fixes: [], dismissible: true });
    }
  }

  return checks;
}

export function checkBlueprint(blueprint: Blueprint, ctx: CheckContext): Check[] {
  const running = blueprint.placements.filter((p) => RUNNING.has(p.status));
  const checks = running.flatMap((p) => placementChecks(blueprint, p, ctx));

  // 함께 받을 수 없는 두 배치가 기간이 겹친다.
  for (const [i, a] of running.entries()) {
    for (const b of running.slice(i + 1)) {
      const exclusive = ctx.policies.get(a.policyId)?.planning?.exclusiveWith.some((link) => link.policyId === b.policyId);
      if (exclusive && overlaps(a.from, a.to, b.from, b.to)) {
        checks.push({
          key: `exclusive-overlap:${[a.id, b.id].sort().join(":")}`,
          kind: "exclusive-overlap",
          placementId: a.id,
          policyId: a.policyId,
          data: { otherPlacementId: b.id, otherPolicyId: b.policyId },
          fixes: [remove(a), { id: "remove-other", ops: [{ op: "removePlacement", id: b.id }] }],
          dismissible: true,
        });
      }
    }
  }

  // 따져볼 카드가 있는데 아직 끝까지 보지 않았다 — 정책마다 한 번.
  for (const policyId of new Set(running.map((p) => p.policyId))) {
    if (ctx.policies.has(policyId) && ctx.hasCard(policyId) && !ctx.completedCards.has(policyId)) {
      checks.push({ key: `card-available:${policyId}`, kind: "card-available", policyId, data: {}, fixes: [], dismissible: true });
    }
  }

  // 가져온 견본이 그 뒤 개정됐다 — 덮어쓰지 않고 알리기만 한다.
  const path = blueprint.goal.pathId ? ctx.paths.get(blueprint.goal.pathId) : undefined;
  if (path && blueprint.goal.pathVersion !== undefined && cardVersion(path) > blueprint.goal.pathVersion) {
    checks.push({ key: `path-updated:${path.id}:v${cardVersion(path)}`, kind: "path-updated", data: { title: path.title }, fixes: [], dismissible: true });
  }

  return checks.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

/** 화면에 띄울 점검 — 닫은 알림을 뺀다. 닫을 수 없는 것(policy-updated)은 키가 남아 있어도 뜬다. */
export function openChecks(checks: readonly Check[], acked: readonly string[]): Check[] {
  const closed = new Set(acked);
  return checks.filter((check) => !check.dismissible || !closed.has(check.key));
}
