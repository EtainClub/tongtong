import { describe, expect, it } from "vitest";

import { buildBlueprintReport, PLACEMENT_MIN, type BlueprintWithVersions } from "./blueprint-report";

const now = new Date("2026-10-04T00:00:00Z");

function item(createdAt: string, opts: Partial<{ pathId: string; editedAt: string[]; acked: string[]; placements: string[]; checkVersions: BlueprintWithVersions["versions"] }> = {}): BlueprintWithVersions {
  return {
    blueprint: {
      status: "active",
      goal: { kind: "degree", title: "목표", horizonYear: 2032, ...(opts.pathId ? { pathId: opts.pathId } : {}) },
      placements: (opts.placements ?? []).map((policyId, i) => ({
        id: `p${i}`,
        policyId,
        policyVersion: 1,
        from: "2027-03",
        role: "funding",
        status: "planned",
        statusAt: createdAt,
      })),
      ackedChecks: opts.acked ?? [],
      createdAt,
    },
    versions: [
      { rev: 1, trigger: { kind: "create" }, changes: [], createdAt },
      ...(opts.editedAt ?? []).map((at, i) => ({ rev: i + 2, trigger: { kind: "user" as const }, changes: [], createdAt: at })),
      ...(opts.checkVersions ?? []),
    ],
  };
}

describe("buildBlueprintReport", () => {
  it("견본별로 세고, 직접 적은 것은 direct", () => {
    const report = buildBlueprintReport([item("2026-09-01T00:00:00Z", { pathId: "phd-stem" }), item("2026-09-02T00:00:00Z")], now);
    expect(report.byPath).toEqual({ "phd-stem": 1, direct: 1 });
    expect(report.total).toBe(2);
  });

  it("30일 재수정 — 만든 지 30일이 안 된 것은 분모에서 뺀다", () => {
    const report = buildBlueprintReport(
      [
        item("2026-08-01T00:00:00Z", { editedAt: ["2026-08-20T00:00:00Z"] }), // 30일 안에 고침
        item("2026-08-01T00:00:00Z", { editedAt: ["2026-09-15T00:00:00Z"] }), // 30일 뒤에 고침
        item("2026-08-01T00:00:00Z"), // 고치지 않음
        item("2026-09-20T00:00:00Z", { editedAt: ["2026-09-21T00:00:00Z"] }), // 아직 30일이 안 됨
      ],
      now,
    );
    expect(report.revised30).toEqual({ numerator: 1, denominator: 3 });
  });

  it("점검 처리 — 반영·이대로·닫기를 종류별로", () => {
    const report = buildBlueprintReport(
      [
        item("2026-09-01T00:00:00Z", {
          acked: ["window-open:p0:2027 1차", "card-available:youth-rent"],
          checkVersions: [
            { rev: 2, trigger: { kind: "check", checkKind: "policy-updated" }, changes: [{ op: "basis", targetId: "p0", before: { policyVersion: 1 }, after: { policyVersion: 2 } }], createdAt: "2026-09-10T00:00:00Z" },
            { rev: 3, trigger: { kind: "check", checkKind: "policy-ended" }, changes: [{ op: "remove", targetId: "p1", before: { policyId: "x" }, after: null }], createdAt: "2026-09-11T00:00:00Z" },
          ],
        }),
      ],
      now,
    );
    expect(report.checks).toEqual({
      "policy-updated": { fixed: 0, kept: 1, dismissed: 0 },
      "policy-ended": { fixed: 1, kept: 0, dismissed: 0 },
      "window-open": { fixed: 0, kept: 0, dismissed: 1 },
      "card-available": { fixed: 0, kept: 0, dismissed: 1 },
    });
  });

  it("항목별 배치 수는 청사진이 충분히 많을 때만", () => {
    const few = buildBlueprintReport([item("2026-09-01T00:00:00Z", { placements: ["youth-rent"] })], now);
    expect(few.placementsByPolicy).toBeNull();
    const many = buildBlueprintReport(
      Array.from({ length: PLACEMENT_MIN }, () => item("2026-09-01T00:00:00Z", { placements: ["youth-rent"] })),
      now,
    );
    expect(many.placementsByPolicy).toEqual({ "youth-rent": PLACEMENT_MIN });
  });
});
