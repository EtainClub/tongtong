import { describe, expect, it } from "vitest";

import { ALL_PATHS } from "@/content/paths";
import { ALL_POLICIES } from "@/content/policies";
import { applyChanges, BlueprintRejection, lastPlacedYear, type BlueprintOp } from "@/lib/blueprint/apply";
import { certaintyOf, endsBefore, offSeason, seasonMonths } from "@/lib/blueprint/certainty";
import { diffBlueprint } from "@/lib/blueprint/diff";
import { anchorRange, emptyBlueprint, materialize, pathHorizonYear } from "@/lib/blueprint/materialize";
import { blueprintSchema, type Blueprint } from "@/lib/blueprint/model";
import { addMonths, halfIndex, halfLabel, monthOf, overlaps } from "@/lib/blueprint/month";
import { timelineBands } from "@/lib/blueprint/timeline";

const policies = new Map(ALL_POLICIES.map((policy) => [policy.id, policy]));
const phd = ALL_PATHS.find((path) => path.id === "phd-stem")!;
const now = new Date("2026-10-01T03:00:00Z");
const baseline = { asOf: "2026-10", stage: "undergrad" as const };

function fromPath(): Blueprint {
  return materialize(phd, policies, { id: "bp1", baseline, now });
}

function ctx() {
  let n = 0;
  return { policies, now: new Date("2026-10-02T03:00:00Z"), newId: () => String(++n) };
}

const rejection = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error instanceof BlueprintRejection ? error.code : error;
  }
  return null;
};

describe("month", () => {
  it("달 더하기·반기·겹침", () => {
    expect(addMonths("2026-10", 3)).toBe("2027-01");
    expect(addMonths("2026-10", -10)).toBe("2025-12");
    expect(halfLabel(halfIndex("2027-03"))).toBe("2027 상반기");
    expect(halfLabel(halfIndex("2027-07"))).toBe("2027 하반기");
    expect(overlaps("2026-07", "2026-11", "2026-11", undefined)).toBe(true);
    expect(overlaps("2026-07", "2026-10", "2026-11", "2027-01")).toBe(false);
  });

  it("시각이 있는 신청 회차는 한국 시간의 달로 읽는다", () => {
    expect(monthOf("2025-11-30T23:30:00+09:00")).toBe("2025-11");
    expect(monthOf("2026-03-06")).toBe("2026-03");
  });
});

describe("materialize", () => {
  it("견본의 상대 시점을 기준 달에 더한다", () => {
    const blueprint = fromPath();
    expect(blueprintSchema.safeParse(blueprint).success).toBe(true);
    expect(blueprint.rev).toBe(1);
    expect(blueprint.milestones.find((m) => m.id === "master")?.at).toBe("2028-10");
    const stipend = blueprint.placements.find((p) => p.id === "stipend")!;
    expect([stipend.from, stipend.to]).toEqual(["2028-10", "2034-09"]);
    expect(stipend.status).toBe("planned");
    expect(blueprint.goal).toMatchObject({ kind: "degree", pathId: "phd-stem", horizonYear: 2034 });
  });

  it("출발 달을 고르면 견본의 모든 시점이 그 달부터 놓인다 (검토 A-4)", () => {
    const anchored = materialize(phd, policies, { id: "bp1", baseline, now, anchor: "2028-03" });
    expect(anchored.milestones.find((m) => m.id === "junior")?.at).toBe("2028-03");
    expect(anchored.milestones.find((m) => m.id === "master")?.at).toBe("2030-03");
    expect(anchored.baseline.asOf).toBe("2026-10"); // 기준 달은 그대로 오늘
    expect(anchored.goal.horizonYear).toBe(pathHorizonYear(phd, "2028-03"));
    expect(pathHorizonYear(phd, "2028-03")).toBe(2036);
  });

  it("목표 연도가 견본의 끝보다 이르면 목표 연도까지만 담는다", () => {
    const short = materialize(phd, policies, { id: "bp1", baseline, now, horizonYear: 2029 });
    expect(blueprintSchema.safeParse(short).success).toBe(true);
    expect(short.goal.horizonYear).toBe(2029);
    expect(short.milestones.map((m) => m.id)).toEqual(["junior", "master"]);
    expect(short.placements.every((p) => Number((p.to ?? p.from).slice(0, 4)) <= 2029)).toBe(true);
    expect(short.placements.some((p) => p.id === "stipend")).toBe(false); // 2034년에 끝나는 칸
    expect(lastPlacedYear(short)).toBeLessThanOrEqual(2029);
  });

  it("출발 달 범위 — 4년 전부터, 견본 끝이 기준 + 10년을 넘지 않는 달까지", () => {
    const range = anchorRange(phd, "2026-10");
    expect(range.min).toBe("2022-10");
    expect(pathHorizonYear(phd, range.max)).toBe(2036);
    expect(pathHorizonYear(phd, addMonths(range.max, 1))).toBe(2037);
  });

  it("보이지 않는 항목을 가리키는 칸은 건너뛴다", () => {
    const without = new Map([...policies].filter(([id]) => id !== "bk21-four"));
    expect(materialize(phd, without, { id: "bp1", baseline, now }).placements.some((p) => p.policyId === "bk21-four")).toBe(false);
  });
});

describe("certaintyOf", () => {
  const loan = policies.get("income-contingent-loan")!; // 2026학년도 2학기 회차: 2026-07–11
  const scholarship = policies.get("national-scholarship")!; // recurrence: rounds
  const stipend = policies.get("stem-research-stipend")!; // 회차·recurrence 없음

  it("시작 달이 신청 회차 안이면 확정", () => {
    expect(certaintyOf({ from: "2026-10" }, loan)).toBe("confirmed");
    expect(certaintyOf({ from: "2026-10", to: "2034-09" }, loan)).toBe("confirmed");
  });

  it("회차가 끝난 뒤에 시작하면 확정이 아니다 — 기간이 회차에 걸쳐도", () => {
    expect(certaintyOf({ from: "2026-12" }, loan)).toBe("undetermined");
    expect(certaintyOf({ from: "2026-06", to: "2027-06" }, loan)).toBe("undetermined");
  });

  it("다시 열린다는 근거만 있으면 예상", () => {
    expect(certaintyOf({ from: "2028-03" }, scholarship)).toBe("expected");
  });

  it("근거가 없으면 미정", () => {
    expect(certaintyOf({ from: "2028-10" }, stipend)).toBe("undetermined");
    expect(certaintyOf({ from: "2028-10" }, undefined)).toBe("undetermined");
  });

  it("끝나기로 된 사업은 그 뒤에 시작하면 미정 (검토 A-6)", () => {
    const bk21 = policies.get("bk21-four")!; // endsAt 2027-08
    const withRecurrence = { ...bk21, planning: { ...bk21.planning!, recurrence: { kind: "annual" as const, claimIds: ["period"] } } };
    expect(certaintyOf({ from: "2027-03" }, withRecurrence)).toBe("expected");
    expect(certaintyOf({ from: "2027-09" }, withRecurrence)).toBe("undetermined");
    expect(endsBefore({ from: "2027-09" }, bk21)).toBe(true);
    expect(endsBefore({ from: "2027-08" }, bk21)).toBe(false);
  });

  it("그 전에 끝나는 정책은 미정", () => {
    const ended = { ...scholarship, policy: { ...scholarship.policy, history: [{ date: "2027-02-28", kind: "ended" as const, summary: "종료", sourceIds: ["korea-2025-11-20"] }] } };
    expect(certaintyOf({ from: "2028-03" }, ended)).toBe("undetermined");
  });
});

describe("offSeason — 예상 · 시기 확인 (5.3)", () => {
  const scholarship = policies.get("national-scholarship")!; // rounds, 지난 회차 2025-11-20 ~ 12-26
  const loan = policies.get("income-contingent-loan")!; // recurrence 없음

  it("지난 회차들이 열렸던 달을 해마다 되풀이한 창", () => {
    expect(seasonMonths(scholarship)).toEqual([11, 12]);
    expect(seasonMonths(loan)).toEqual([]); // 다시 열린다는 근거가 없으면 창도 없다
  });

  it("예상 배치의 시작 달이 창 밖이면 시기 확인", () => {
    expect(offSeason({ from: "2028-11" }, scholarship)).toBe(false);
    expect(offSeason({ from: "2028-12", to: "2029-05" }, scholarship)).toBe(false);
    expect(offSeason({ from: "2028-03" }, scholarship)).toBe(true);
  });

  it("예상이 아니면 말하지 않는다 — 확정·미정·창 없음", () => {
    expect(offSeason({ from: "2025-12" }, scholarship)).toBe(false); // 확정 (회차 안)
    expect(offSeason({ from: "2028-03" }, loan)).toBe(false); // 미정
    const noRounds = { ...scholarship, policy: { ...scholarship.policy, applications: [] } };
    expect(offSeason({ from: "2028-03" }, noRounds)).toBe(false);
  });

  it("해를 넘는 회차도 달로 펼친다", () => {
    const winter = { ...scholarship, policy: { ...scholarship.policy, applications: [{ ...scholarship.policy.applications[0], startAt: "2025-12-01", endAt: "2026-01-31" }] } };
    expect(seasonMonths(winter)).toEqual([1, 12]);
  });
});

describe("applyChanges", () => {
  const apply = (ops: BlueprintOp[], prev = fromPath()) => applyChanges(prev, ops, ctx());

  it("op 여러 개는 REV 하나", () => {
    const { next, changes } = apply([
      { op: "setStatus", id: "scholarship", status: "applied" },
      { op: "addMilestone", label: "학부 졸업", at: "2028-08", stage: "graduated_unemployed" },
    ]);
    expect(next.rev).toBe(2);
    expect(changes.map((c) => c.op).sort()).toEqual(["milestone", "status"]);
    expect(next.placements.find((p) => p.id === "scholarship")?.statusAt).toBe("2026-10-02T03:00:00.000Z");
  });

  it("배치 넣기 — 항목의 지금 버전을 적고 계획 상태로 시작한다", () => {
    const { next, changes } = apply([{ op: "addPlacement", policyId: "youth-tomorrow-savings", from: "2027-03", to: "2030-02", role: "asset" }]);
    const added = next.placements.at(-1)!;
    expect(added).toMatchObject({ id: "p-1", policyId: "youth-tomorrow-savings", policyVersion: 1, status: "planned" });
    expect(changes).toEqual([{ op: "add", targetId: "p-1", before: null, after: { policyId: "youth-tomorrow-savings", from: "2027-03", to: "2030-02", role: "asset" } }]);
  });

  it("청년 대상이 아니거나 없는 항목은 놓을 수 없다", () => {
    expect(rejection(() => apply([{ op: "addPlacement", policyId: "high-school-credit", from: "2027-03", role: "skill" }]))).toBe("unknown-policy");
    expect(rejection(() => apply([{ op: "addPlacement", policyId: "nowhere", from: "2027-03", role: "skill" }]))).toBe("unknown-policy");
  });

  it("기간 — 끝이 시작보다 이르거나 목표 연도를 넘으면 거절", () => {
    expect(rejection(() => apply([{ op: "movePlacement", id: "rent", from: "2029-01", to: "2028-12" }]))).toBe("invalid-range");
    expect(rejection(() => apply([{ op: "movePlacement", id: "rent", from: "2035-01" }]))).toBe("invalid-range");
  });

  it("옮기면 move 하나만 남는다", () => {
    const { changes } = apply([{ op: "movePlacement", id: "rent", from: "2029-03", to: "2031-02" }]);
    expect(changes).toEqual([{ op: "move", targetId: "rent", before: { from: "2028-10", to: "2030-09" }, after: { from: "2029-03", to: "2031-02" } }]);
  });

  it("되돌리기 — 뺀 배치를 같은 id·상태·메모로 다시 넣고, 바꾼 배치는 앞 모습으로", () => {
    const prev = apply([{ op: "setNote", id: "rent", note: "보증금 따로 마련" }]).next;
    const before = prev.placements.find((p) => p.id === "rent")!;
    const removed = apply([{ op: "removePlacement", id: "rent" }], prev).next;
    const { next, changes } = apply([{ op: "restorePlacement", placement: before }], removed);
    expect(next.placements.find((p) => p.id === "rent")).toEqual(before);
    expect(changes.map((c) => c.op)).toEqual(["add"]);

    const missed = apply([{ op: "setStatus", id: "rent", status: "missed" }], prev).next;
    // missed → ready는 전이 표에 없지만, 되돌리기는 앞 모습 그대로 돌아간다.
    const ready = apply([{ op: "setStatus", id: "rent", status: "ready" }], prev).next;
    const readyRent = ready.placements.find((p) => p.id === "rent")!;
    const missedFromReady = apply([{ op: "setStatus", id: "rent", status: "missed" }], ready).next;
    expect(apply([{ op: "restorePlacement", placement: readyRent }], missedFromReady).next.placements.find((p) => p.id === "rent")?.status).toBe("ready");
    expect(missed.placements.find((p) => p.id === "rent")?.status).toBe("missed");
  });

  it("되돌리기 — 지금 항목 버전보다 높은 버전, 범위 밖 기간은 거절", () => {
    const rent = fromPath().placements.find((p) => p.id === "rent")!;
    expect(rejection(() => apply([{ op: "restorePlacement", placement: { ...rent, policyVersion: 99 } }]))).toBe("unknown-policy");
    expect(rejection(() => apply([{ op: "restorePlacement", placement: { ...rent, from: "2040-01", to: undefined } }]))).toBe("invalid-range");
  });

  it("상태 전이 표 밖으로는 갈 수 없다", () => {
    expect(rejection(() => apply([{ op: "setStatus", id: "rent", status: "done" }]))).toBe("invalid-transition");
    const done = apply([{ op: "setStatus", id: "rent", status: "active" }]).next;
    expect(apply([{ op: "setStatus", id: "rent", status: "done" }], done).next.placements.find((p) => p.id === "rent")?.status).toBe("done");
  });

  it("바뀐 것이 없으면 REV를 올리지 않는다", () => {
    expect(rejection(() => apply([{ op: "setStatus", id: "rent", status: "planned" }]))).toBe("no-change");
  });

  it("하나라도 거절되면 모두 거절한다", () => {
    expect(rejection(() => apply([{ op: "setStatus", id: "rent", status: "ready" }, { op: "removePlacement", id: "nowhere" }]))).toBe("unknown-placement");
  });

  it("이정표를 지우면 배치는 남고 연결만 끊긴다", () => {
    const { next } = apply([{ op: "removeMilestone", id: "master" }]);
    expect(next.milestones.some((m) => m.id === "master")).toBe(false);
    const stipend = next.placements.find((p) => p.id === "stipend")!;
    expect(stipend.milestoneId).toBeUndefined();
  });

  it("메모를 비우면 지운다", () => {
    const noted = apply([{ op: "setNote", id: "rent", note: "학교 근처" }]).next;
    const { next, changes } = apply([{ op: "setNote", id: "rent", note: "" }], noted);
    expect(next.placements.find((p) => p.id === "rent")?.note).toBeUndefined();
    expect(changes).toEqual([{ op: "note", targetId: "rent", before: { note: "학교 근처" }, after: { note: null } }]);
  });

  it("목표 연도를 놓인 것보다 이른 해로 줄일 수 없다 — 서버가 막는다 (검토 A-16)", () => {
    // 견본의 마지막 칸·이정표가 2034년이다.
    expect(lastPlacedYear(fromPath())).toBe(2034);
    expect(rejection(() => apply([{ op: "setGoal", horizonYear: 2033 }]))).toBe("invalid-horizon");
    expect(apply([{ op: "setGoal", horizonYear: 2035 }]).next.goal.horizonYear).toBe(2035);
  });

  it("이정표의 단계를 고치고 지울 수 있다 (검토 A-14)", () => {
    const changed = apply([{ op: "editMilestone", id: "master", stage: "grad_phd" }]);
    expect(changed.next.milestones.find((m) => m.id === "master")?.stage).toBe("grad_phd");
    expect(changed.changes).toEqual([{ op: "milestone", targetId: "master", before: { stage: "grad_master" }, after: { stage: "grad_phd" } }]);
    const cleared = apply([{ op: "editMilestone", id: "master", stage: null }]).next;
    expect(cleared.milestones.find((m) => m.id === "master")?.stage).toBeUndefined();
    expect(rejection(() => apply([{ op: "editMilestone", id: "master", label: "석사 입학" }]))).toBe("no-change");
  });

  it("목표 연도는 기준 연도에서 10년 안", () => {
    expect(rejection(() => apply([{ op: "setGoal", horizonYear: 2037 }]))).toBe("invalid-horizon");
    expect(apply([{ op: "setGoal", horizonYear: 2036, title: "박사 후 연구원" }]).next.goal).toMatchObject({ horizonYear: 2036, title: "박사 후 연구원" });
  });

  it("상한 — 배치 40개", () => {
    const full = { ...emptyBlueprint({ id: "bp2", baseline, now, goal: { kind: "other", title: "x", horizonYear: 2030 } }) };
    full.placements = Array.from({ length: 40 }, (_, i) => ({ ...fromPath().placements[0], id: `p-x${i}` }));
    expect(rejection(() => apply([{ op: "addPlacement", policyId: "youth-monthly-rent", from: "2027-01", role: "housing" }], full))).toBe("too-many-placements");
  });
});

describe("timelineBands", () => {
  it("반기마다 이정표와 그 반기에 시작하는 배치를 모으고, 빈 반기는 지금만 남긴다", () => {
    const bands = timelineBands(fromPath(), "2026-10");
    expect(bands.map((b) => halfLabel(b.half))).toEqual(["2026 하반기", "2027 상반기", "2027 하반기", "2028 하반기", "2030 하반기", "2034 하반기"]);
    expect(bands[0]).toMatchObject({ isNow: true });
    expect(bands[0].placements.map((p) => p.id)).toEqual(["scholarship", "loan"]);
    expect(bands.find((b) => halfLabel(b.half) === "2028 하반기")?.milestones.map((m) => m.id)).toEqual(["master"]);
  });

  it("앞에서 시작해 이어지는 배치를 띠마다 '계속'으로 (검토 A-8)", () => {
    const blueprint = fromPath();
    const band = (label: string) => timelineBands(blueprint, "2026-10").find((b) => halfLabel(b.half) === label)!;
    // 2030 하반기: BK21·월세(2030.09까지)도 아직 이어진다.
    expect(band("2030 하반기").continuing.map((p) => p.id)).toEqual(["loan", "stipend", "bk21", "rent", "savings"]);
    // 2034 하반기(박사 학위): 대출·장려금(2034.09까지)만 남는다 — 적금(2031.09)은 끝났다.
    expect(band("2034 하반기").continuing.map((p) => p.id)).toEqual(["loan", "stipend"]);
    expect(band("2026 하반기").continuing).toEqual([]); // 그 반기에 시작한 것은 "계속"이 아니다
    const dropped = { ...blueprint, placements: blueprint.placements.map((p) => (p.id === "loan" ? { ...p, status: "dropped" as const } : p)) };
    expect(timelineBands(dropped, "2026-10").find((b) => halfLabel(b.half) === "2034 하반기")!.continuing.map((p) => p.id)).toEqual(["stipend"]);
  });
});

describe("diffBlueprint", () => {
  it("같은 모습이면 빈 목록", () => {
    expect(diffBlueprint(fromPath(), fromPath())).toEqual([]);
  });

  it("지운 배치는 remove", () => {
    const prev = fromPath();
    const next = { ...prev, placements: prev.placements.filter((p) => p.id !== "bk21") };
    expect(diffBlueprint(prev, next)).toEqual([{ op: "remove", targetId: "bk21", before: { policyId: "bk21-four", from: "2028-10", to: "2030-09" }, after: null }]);
  });
});
