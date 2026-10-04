import { describe, expect, it } from "vitest";

import { ALL_PATHS } from "@/content/paths";
import { ALL_POLICIES } from "@/content/policies";
import type { Policy } from "@/content/schema";
import { applyChanges, nextAckedChecks } from "@/lib/blueprint/apply";
import { ageRangeAt, blueprintStageAt, checkBlueprint, openChecks, type CheckContext } from "@/lib/blueprint/check";
import { emptyBlueprint, materialize } from "@/lib/blueprint/materialize";
import type { Blueprint, Placement } from "@/lib/blueprint/model";

const basePolicies = new Map(ALL_POLICIES.map((policy) => [policy.id, policy]));
const phd = ALL_PATHS.find((path) => path.id === "phd-stem")!;
const created = new Date("2026-10-01T03:00:00Z");
const baseline = { asOf: "2026-10", stage: "undergrad" as const };

function ctx(patch: Partial<CheckContext> = {}): CheckContext {
  return {
    policies: basePolicies,
    paths: new Map(ALL_PATHS.map((path) => [path.id, path])),
    hasCard: () => false,
    completedCards: new Set(),
    now: new Date("2026-10-02T03:00:00Z"),
    ...patch,
  };
}

/** 빈 청사진에 배치 하나. */
function withPlacement(placement: Partial<Placement> & Pick<Placement, "policyId" | "from">, extra: Partial<Blueprint> = {}): Blueprint {
  const blueprint = emptyBlueprint({ id: "bp", baseline, now: created, goal: { kind: "other", title: "x", horizonYear: 2036 } });
  const policy = basePolicies.get(placement.policyId);
  return {
    ...blueprint,
    ...extra,
    placements: [{ id: "p1", policyVersion: policy ? policy.revisions.at(-1)!.version : 1, role: "funding", status: "planned", statusAt: created.toISOString(), ...placement }],
  };
}

/** 항목 하나를 바꾼 policies. */
function patched(id: string, change: (policy: Policy) => Policy) {
  const map = new Map(basePolicies);
  map.set(id, change(structuredClone(basePolicies.get(id)!)));
  return map;
}

const kinds = (blueprint: Blueprint, context = ctx()) => checkBlueprint(blueprint, context).map((c) => c.kind);

describe("checkBlueprint", () => {
  it("항목의 중요 개정 — 받아들이면 점검이 사라지고 REV가 오른다", () => {
    const blueprint = withPlacement({ policyId: "youth-monthly-rent", from: "2027-03", role: "housing" });
    const policies = patched("youth-monthly-rent", (p) => ({
      ...p,
      revisions: [...p.revisions, { version: 2, date: "2026-10-02", material: true, summary: "2027년 기준 변경", claimIds: [] }],
    }));
    const [check] = checkBlueprint(blueprint, ctx({ policies }));
    expect(check).toMatchObject({ kind: "policy-updated", dismissible: false, data: { from: 1, to: 2, summary: "2027년 기준 변경" } });

    const accept = check.fixes.find((f) => f.id === "accept")!;
    const { next, changes } = applyChanges(blueprint, accept.ops, { policies, now: new Date(), newId: () => "x" });
    expect(next.rev).toBe(blueprint.rev + 1);
    expect(changes).toEqual([{ op: "basis", targetId: "p1", before: { policyVersion: 1 }, after: { policyVersion: 2 } }]);
    expect(kinds(next, ctx({ policies }))).not.toContain("policy-updated");
  });

  it("오탈자 같은 비중요 개정은 점검하지 않는다", () => {
    const blueprint = withPlacement({ policyId: "youth-monthly-rent", from: "2027-03" });
    const policies = patched("youth-monthly-rent", (p) => ({ ...p, revisions: [...p.revisions, { version: 2, date: "2026-10-02", material: false, summary: "오탈자", claimIds: [] }] }));
    expect(kinds(blueprint, ctx({ policies }))).toEqual([]);
  });

  it("내려간 항목", () => {
    const blueprint = withPlacement({ policyId: "youth-monthly-rent", from: "2027-03" });
    const policies = new Map([...basePolicies].filter(([id]) => id !== "youth-monthly-rent"));
    expect(checkBlueprint(blueprint, ctx({ policies }))[0]).toMatchObject({ kind: "policy-withdrawn", fixes: [{ id: "remove" }] });
  });

  it("신청 중 — 마감이 7일보다 멀면 window-open, 가까우면 window-closing", () => {
    // 학자금대출 2026학년도 2학기: 2026-07-01 ~ 11-17 18시
    const blueprint = withPlacement({ policyId: "income-contingent-loan", from: "2026-10" });
    expect(checkBlueprint(blueprint, ctx())[0]).toMatchObject({ kind: "window-open", data: { daysLeft: 46 }, fixes: [{ id: "ready" }] });
    expect(checkBlueprint(blueprint, ctx({ now: new Date("2026-11-12T03:00:00Z") }))[0]).toMatchObject({ kind: "window-closing", data: { daysLeft: 5 } });
    expect(checkBlueprint(blueprint, ctx({ now: new Date("2026-11-17T03:00:00Z") }))[0]).toMatchObject({ kind: "window-closing", data: { daysLeft: 0 } });
  });

  it("신청함 뒤에는 신청 기간을 묻지 않는다", () => {
    expect(kinds(withPlacement({ policyId: "income-contingent-loan", from: "2026-10", status: "applied" }))).toEqual([]);
  });

  it("회차가 지났는데 계획 그대로면 window-missed — 회차 모집이면 다음 해로 미루기를 제안", () => {
    const blueprint = withPlacement({ policyId: "national-scholarship", from: "2025-12", to: "2026-05" });
    const [check] = checkBlueprint(blueprint, ctx());
    expect(check.kind).toBe("window-missed");
    expect(check.fixes.map((f) => f.id)).toEqual(["next-round", "missed"]);
    expect(check.fixes[0].ops).toEqual([{ op: "movePlacement", id: "p1", from: "2026-12", to: "2027-05" }]);
  });

  it("가까운 실제 회차가 나오면 그 달로 맞추기를 제안", () => {
    // 청년미래적금 2026년 2차: 10/7–10/16. 예상으로 12월에 놓았다.
    const blueprint = withPlacement({ policyId: "young-future-savings", from: "2026-12", to: "2029-11", role: "asset" });
    const check = checkBlueprint(blueprint, ctx()).find((c) => c.kind === "schedule-confirmed")!;
    expect(check.fixes[0].ops).toEqual([{ op: "movePlacement", id: "p1", from: "2026-10", to: "2029-09" }]);
  });

  it("나이 — 확실히 넘으면 certain, 경계 해는 넘었을 수 있음 (생일을 모른다)", () => {
    const at = (from: string) => withPlacement({ policyId: "youth-monthly-rent", from }, { baseline: { ...baseline, age: 33 } });
    expect(kinds(at("2027-03"))).toEqual([]); // 33–34세
    expect(checkBlueprint(at("2027-10"), ctx())[0]).toMatchObject({ kind: "age-limit", data: { over: true, certain: false } }); // 34–35세
    expect(checkBlueprint(at("2028-10"), ctx())[0]).toMatchObject({ kind: "age-limit", data: { over: true, certain: true } }); // 35–36세
    expect(kinds(withPlacement({ policyId: "youth-monthly-rent", from: "2030-10" }))).toEqual([]); // 나이를 안 적으면 묻지 않는다
  });

  it("끝나기로 된 사업 뒤까지 놓이면 program-ending — 걸쳐 있으면 줄이기를 제안", () => {
    const across = checkBlueprint(withPlacement({ policyId: "bk21-four", from: "2027-03", to: "2028-02" }, { baseline: { ...baseline, stage: "grad_master" } }), ctx());
    expect(across[0]).toMatchObject({ kind: "program-ending", data: { endsAt: "2027-08", startsAfter: false } });
    expect(across[0].fixes[0]).toEqual({ id: "trim", ops: [{ op: "movePlacement", id: "p1", from: "2027-03", to: "2027-08" }] });
    const after = checkBlueprint(withPlacement({ policyId: "bk21-four", from: "2028-03" }, { baseline: { ...baseline, stage: "grad_master" } }), ctx());
    expect(after[0]).toMatchObject({ kind: "program-ending", data: { startsAfter: true }, fixes: [{ id: "remove" }] });
  });

  it("그 시점의 단계가 대상 단계 밖이면 stage-mismatch", () => {
    // 연구생활장려금은 대학원생 대상 — 학부 때 놓았다.
    expect(kinds(withPlacement({ policyId: "stem-research-stipend", from: "2027-03" }))).toEqual(["stage-mismatch"]);
  });

  it("함께 받을 수 없는 두 배치가 겹치면 exclusive-overlap", () => {
    const policies = new Map(basePolicies);
    const link = (target: string, from: Policy) => ({ policyId: target, claimIds: [from.claims[0].id] });
    const a = structuredClone(basePolicies.get("young-future-savings")!);
    const b = structuredClone(basePolicies.get("youth-tomorrow-savings")!);
    a.planning!.exclusiveWith = [link(b.id, a)];
    b.planning!.exclusiveWith = [link(a.id, b)];
    policies.set(a.id, a).set(b.id, b);
    const blueprint = withPlacement({ policyId: a.id, from: "2027-03", to: "2030-02", role: "asset" });
    blueprint.placements.push({ ...blueprint.placements[0], id: "p2", policyId: b.id, from: "2029-01", to: "2031-12" });
    const check = checkBlueprint(blueprint, ctx({ policies })).find((c) => c.kind === "exclusive-overlap")!;
    expect(check.key).toBe("exclusive-overlap:p1:p2");
    expect(check.fixes.map((f) => f.id)).toEqual(["remove", "remove-other"]);
  });

  it("따져보지 않은 카드는 정책마다 한 번만 알린다", () => {
    const blueprint = withPlacement({ policyId: "youth-monthly-rent", from: "2027-03" });
    blueprint.placements.push({ ...blueprint.placements[0], id: "p2", from: "2029-03" });
    const hasCard = (id: string) => id === "youth-monthly-rent";
    expect(kinds(blueprint, ctx({ hasCard }))).toEqual(["card-available"]);
    expect(kinds(blueprint, ctx({ hasCard, completedCards: new Set(["youth-monthly-rent"]) }))).toEqual([]);
  });

  it("견본이 개정되면 path-updated (덮어쓰지 않는다)", () => {
    const blueprint = materialize(phd, basePolicies, { id: "bp", baseline, now: created });
    const revised = { ...phd, revisions: [...phd.revisions, { version: 2, date: "2026-10-02", material: true, summary: "칸 추가", claimIds: [] }] };
    expect(kinds(blueprint, ctx({ paths: new Map([[phd.id, revised]]) }))).toContain("path-updated");
  });

  it("끝났거나 뺀 배치는 점검하지 않는다", () => {
    expect(kinds(withPlacement({ policyId: "income-contingent-loan", from: "2026-10", status: "dropped" }))).toEqual([]);
  });

  it("놓친 것부터 — 순서", () => {
    const blueprint = withPlacement({ policyId: "income-contingent-loan", from: "2026-10" });
    blueprint.placements.push({ ...blueprint.placements[0], id: "p2", policyId: "youth-monthly-rent", policyVersion: 1 });
    const policies = patched("youth-monthly-rent", (p) => ({ ...p, revisions: [...p.revisions, { version: 2, date: "2026-10-02", material: true, summary: "개정", claimIds: [] }] }));
    expect(kinds(blueprint, ctx({ policies }))[0]).toBe("policy-updated");
  });
});

describe("닫기 (ackedChecks)", () => {
  it("닫은 알림은 빠지고, 닫을 수 없는 점검은 남는다", () => {
    const blueprint = withPlacement({ policyId: "income-contingent-loan", from: "2026-10" });
    const checks = checkBlueprint(blueprint, ctx());
    expect(openChecks(checks, [checks[0].key])).toEqual([]);
    const forced = checks.map((c) => ({ ...c, dismissible: false }));
    expect(openChecks(forced, [checks[0].key])).toHaveLength(1);
  });

  it("지금 계산되지 않는 옛 키는 걷어 낸다", () => {
    expect(nextAckedChecks(["old", "a"], ["b"], ["a", "b", "c"])).toEqual(["a", "b"]);
  });
});

describe("blueprintStageAt · ageRangeAt", () => {
  it("이정표를 지나면 단계가 바뀐다", () => {
    const blueprint = materialize(phd, basePolicies, { id: "bp", baseline, now: created });
    expect(blueprintStageAt(blueprint, "2027-01")).toBe("undergrad");
    expect(blueprintStageAt(blueprint, "2028-10")).toBe("grad_master");
    expect(blueprintStageAt(blueprint, "2031-01")).toBe("grad_phd");
  });

  it("생일을 모르므로 범위로", () => {
    expect(ageRangeAt({ ...baseline, age: 22 }, "2027-09")).toEqual([22, 23]);
    expect(ageRangeAt({ ...baseline, age: 22 }, "2027-10")).toEqual([23, 24]);
    expect(ageRangeAt(baseline, "2027-10")).toBeNull();
  });
});
