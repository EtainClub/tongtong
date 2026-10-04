import type { Blueprint, Version } from "@/lib/blueprint/model";

/*
 * 청사진 측정 (청사진 설계 B3 6번, 부록 A-11). `pnpm metrics`가 그린다.
 *
 * 합계만 낸다 — 판단 값·메모·목표 제목·나이는 읽어도 결과에 싣지 않는다.
 * 항목별 배치 수는 운영 내부용이고, 청사진이 PLACEMENT_MIN개 이상일 때만 낸다 (10장 5번).
 */

export const REVISE_WINDOW_DAYS = 30;
export const PLACEMENT_MIN = 30;

const DAY = 24 * 60 * 60 * 1000;

export type BlueprintWithVersions = {
  blueprint: Pick<Blueprint, "status" | "goal" | "placements" | "ackedChecks" | "createdAt">;
  versions: Pick<Version, "rev" | "trigger" | "changes" | "createdAt">[];
};

export type BlueprintReport = {
  total: number;
  active: number;
  /** 견본 id별 만든 수. 직접 적은 것은 "direct". */
  byPath: Record<string, number>;
  /** 만든 지 30일이 지난 청사진 가운데, 만든 뒤 30일 안에 한 번 더 고친 것. */
  revised30: { numerator: number; denominator: number };
  /** 점검 처리 — 반영(계획을 고침)·이대로(basis)·닫기(ack). 점검 종류별. */
  checks: Record<string, { fixed: number; kept: number; dismissed: number }>;
  /** 청사진이 PLACEMENT_MIN개 미만이면 null. */
  placementsByPolicy: Record<string, number> | null;
};

/** 점검 키의 앞부분이 종류다 (`policy-updated:p1:v3` → `policy-updated`). */
const kindOfKey = (key: string) => key.split(":")[0];

export function buildBlueprintReport(items: readonly BlueprintWithVersions[], now: Date): BlueprintReport {
  const byPath: Record<string, number> = {};
  const checks: BlueprintReport["checks"] = {};
  const bump = (kind: string, field: "fixed" | "kept" | "dismissed") => {
    checks[kind] ??= { fixed: 0, kept: 0, dismissed: 0 };
    checks[kind][field] += 1;
  };
  const revised30 = { numerator: 0, denominator: 0 };
  const placements: Record<string, number> = {};

  for (const { blueprint, versions } of items) {
    const path = blueprint.goal.pathId ?? "direct";
    byPath[path] = (byPath[path] ?? 0) + 1;

    const created = Date.parse(blueprint.createdAt);
    if (now.getTime() - created >= REVISE_WINDOW_DAYS * DAY) {
      revised30.denominator += 1;
      if (versions.some((v) => v.rev > 1 && Date.parse(v.createdAt) - created <= REVISE_WINDOW_DAYS * DAY)) revised30.numerator += 1;
    }

    for (const version of versions) {
      if (version.trigger.kind !== "check" || !version.trigger.checkKind) continue;
      const kept = version.changes.length > 0 && version.changes.every((c) => c.op === "basis");
      bump(version.trigger.checkKind, kept ? "kept" : "fixed");
    }
    // 닫은 키는 지금도 계산되는 것만 남는다(nextAckedChecks) — "지금 닫혀 있는 수"다.
    for (const key of blueprint.ackedChecks) bump(kindOfKey(key), "dismissed");

    for (const placement of blueprint.placements) placements[placement.policyId] = (placements[placement.policyId] ?? 0) + 1;
  }

  return {
    total: items.length,
    active: items.filter((i) => i.blueprint.status === "active").length,
    byPath,
    revised30,
    checks,
    placementsByPolicy: items.length >= PLACEMENT_MIN ? placements : null,
  };
}
