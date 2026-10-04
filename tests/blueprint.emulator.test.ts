import { afterAll, beforeEach, describe, expect, test } from "vitest";

import type { Blueprint, Version } from "@/lib/blueprint/model";

// `pnpm test:emulator`가 Firestore·Auth 에뮬레이터를 띄우고 변수를 넣는다. 없으면 건너뛴다.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

(enabled ? describe : describe.skip)("blueprint store (emulator)", async () => {
  // 에뮬레이터가 없을 때 Admin SDK를 초기화하지 않도록 안에서 불러온다.
  const { auth, db } = await import("@/lib/firebase/admin");
  const { saveProfile } = await import("@/lib/server/store");
  const store = await import("@/lib/server/blueprint-store");

  const fromPath = { pathId: "phd-stem", kind: "degree", title: "이공계 박사", stage: "undergrad" } as const;
  const versions = async (uid: string, id: string) =>
    (await db.collection(`users/${uid}/blueprints/${id}/versions`).orderBy("rev").get()).docs.map((d) => d.data() as Version);

  let uid: string;
  beforeEach(async () => {
    uid = (await auth.createUser({})).uid;
    await saveProfile(uid, { audienceType: "young_adult", lifeStages: ["college"] });
  });
  afterAll(async () => {
    await db.recursiveDelete(db.collection("users"));
  });

  test("견본에서 만들면 REV.1과 첫 기록이 함께 남는다", async () => {
    const created = await store.createBlueprint(uid, fromPath, new Date("2026-10-01T03:00:00Z"));
    const saved = (await db.doc(`users/${uid}/blueprints/${created.id}`).get()).data() as Blueprint;
    expect(saved).toMatchObject({ rev: 1, status: "active", baseline: { asOf: "2026-10", stage: "undergrad" }, goal: { pathId: "phd-stem" } });
    expect(saved.placements.length).toBeGreaterThan(0);
    expect(await versions(uid, created.id)).toEqual([{ rev: 1, intent: null, trigger: { kind: "path" }, changes: [], createdAt: "2026-10-01T03:00:00.000Z" }]);
  });

  test("고치면 REV가 오르고 변경 기록이 쌓인다 — 지운 선택 필드는 저장에서 빠진다", async () => {
    const created = await store.createBlueprint(uid, fromPath);
    await store.updateBlueprint(uid, { id: created.id, expectedRev: 1, ops: [{ op: "setNote", id: "rent", note: "학교 근처" }] });
    const next = await store.updateBlueprint(uid, { id: created.id, expectedRev: 2, ops: [{ op: "setNote", id: "rent", note: "" }, { op: "setStatus", id: "rent", status: "ready" }], intent: "월세 신청 준비" });
    expect(next.rev).toBe(3);

    const saved = (await db.doc(`users/${uid}/blueprints/${created.id}`).get()).data() as Blueprint;
    const rent = saved.placements.find((p) => p.id === "rent")!;
    expect(rent.status).toBe("ready");
    expect("note" in rent).toBe(false);
    const log = await versions(uid, created.id);
    expect(log.map((v) => v.rev)).toEqual([1, 2, 3]);
    expect(log[2]).toMatchObject({ intent: "월세 신청 준비", trigger: { kind: "user" } });
    expect(log[2].changes.map((c) => c.op).sort()).toEqual(["note", "status"]);
  });

  test("다른 기기가 먼저 고쳤으면(stale-rev) 덮어쓰지 않는다", async () => {
    const created = await store.createBlueprint(uid, fromPath);
    await store.updateBlueprint(uid, { id: created.id, expectedRev: 1, ops: [{ op: "setStatus", id: "rent", status: "ready" }] });
    await expect(store.updateBlueprint(uid, { id: created.id, expectedRev: 1, ops: [{ op: "removePlacement", id: "rent" }] })).rejects.toMatchObject({
      status: 409,
      reason: "stale-rev",
    });
    expect(((await db.doc(`users/${uid}/blueprints/${created.id}`).get()).data() as Blueprint).placements.some((p) => p.id === "rent")).toBe(true);
  });

  test("활성 청사진은 하나 — 보관하면 새로 만들 수 있다", async () => {
    const first = await store.createBlueprint(uid, fromPath);
    await expect(store.createBlueprint(uid, { kind: "other", title: "두 번째", stage: "undergrad" })).rejects.toMatchObject({ status: 409, reason: "active-exists" });
    await store.archiveBlueprint(uid, first.id);
    await expect(store.updateBlueprint(uid, { id: first.id, expectedRev: 1, ops: [{ op: "setGoal", title: "보관 뒤" }] })).rejects.toMatchObject({ status: 404 });
    const second = await store.createBlueprint(uid, { kind: "other", title: "두 번째", stage: "undergrad" });
    expect(second.placements).toEqual([]);
  });

  test("청소년과 프로필 없는 사람은 만들 수 없다", async () => {
    const teen = (await auth.createUser({})).uid;
    await saveProfile(teen, { audienceType: "youth", lifeStages: [], over14: true });
    await expect(store.createBlueprint(teen, fromPath)).rejects.toMatchObject({ status: 403, reason: "youth-not-supported" });
    const stranger = (await auth.createUser({})).uid;
    await expect(store.createBlueprint(stranger, fromPath)).rejects.toMatchObject({ status: 403, reason: "profile-required" });
  });

  test("규칙 위반은 거절 코드로 돌아온다", async () => {
    const created = await store.createBlueprint(uid, fromPath);
    await expect(store.updateBlueprint(uid, { id: created.id, expectedRev: 1, ops: [{ op: "setStatus", id: "rent", status: "planned" }] })).rejects.toMatchObject({
      status: 409,
      reason: "no-change",
    });
    await expect(store.updateBlueprint(uid, { id: created.id, expectedRev: 1, ops: [{ op: "addPlacement", policyId: "high-school-credit", from: "2027-03", role: "skill" }] })).rejects.toMatchObject({
      status: 404,
      reason: "unknown-policy",
    });
  });

  test("견본의 출발 달 — 고른 달부터 놓이고, 범위 밖이나 견본 끝보다 이른 목표 연도는 거절 (검토 A-4)", async () => {
    const now = new Date("2026-10-01T03:00:00Z");
    const created = await store.createBlueprint(uid, { ...fromPath, anchor: "2028-03" }, now);
    expect(created.milestones.find((m) => m.id === "junior")?.at).toBe("2028-03");
    expect(created.baseline.asOf).toBe("2026-10");
    await store.archiveBlueprint(uid, created.id);
    await expect(store.createBlueprint(uid, { ...fromPath, anchor: "2030-03" }, now)).rejects.toMatchObject({ status: 400, reason: "invalid-range" });
    await expect(store.createBlueprint(uid, { ...fromPath, anchor: "2028-03", horizonYear: 2035 }, now)).rejects.toMatchObject({ status: 400, reason: "invalid-horizon" });
  });

  test("청사진만 지우면 보관한 것과 REV 기록까지 사라지고 판단 기록은 남는다 (검토 A-10)", async () => {
    const first = await store.createBlueprint(uid, fromPath);
    await store.archiveBlueprint(uid, first.id);
    const second = await store.createBlueprint(uid, { kind: "other", title: "두 번째", stage: "undergrad" });
    await db.doc(`users/${uid}/cardStates/youth-job-leap`).set({ cardId: "youth-job-leap", judgments: [] });
    const { deleteUserData } = await import("@/lib/server/store");
    await deleteUserData(uid, "blueprints");
    expect((await db.collection(`users/${uid}/blueprints`).get()).size).toBe(0);
    expect(await versions(uid, first.id)).toEqual([]);
    expect(await versions(uid, second.id)).toEqual([]);
    expect((await db.doc(`users/${uid}/cardStates/youth-job-leap`).get()).exists).toBe(true);
    expect((await db.doc(`users/${uid}`).get()).exists).toBe(true);
  });

  test("점검 반영은 REV에 trigger: check로 남고, 알림 닫기는 REV를 올리지 않는다 (청사진 설계 5.1)", async () => {
    const created = await store.createBlueprint(uid, fromPath);
    await store.updateBlueprint(uid, {
      id: created.id,
      expectedRev: 1,
      ops: [{ op: "setStatus", id: "loan", status: "ready" }],
      trigger: { kind: "check", checkKind: "window-open", policyId: "income-contingent-loan" },
    });
    expect((await versions(uid, created.id))[1].trigger).toEqual({ kind: "check", checkKind: "window-open", policyId: "income-contingent-loan" });

    const before = (await db.doc(`users/${uid}/blueprints/${created.id}`).get()).data() as Blueprint;
    const result = await store.ackChecks(uid, { id: created.id, keys: ["window-open:loan:2026학년도 2학기"], live: ["window-open:loan:2026학년도 2학기", "x"] });
    expect(result.ackedChecks).toEqual(["window-open:loan:2026학년도 2학기"]);
    const after = (await db.doc(`users/${uid}/blueprints/${created.id}`).get()).data() as Blueprint;
    expect(after.rev).toBe(before.rev);
    expect(after.updatedAt).toBe(before.updatedAt);
    expect(await versions(uid, created.id)).toHaveLength(2);
  });

  test("계정을 지우면 청사진과 기록도 지워진다", async () => {
    const created = await store.createBlueprint(uid, fromPath);
    const { deleteUserData } = await import("@/lib/server/store");
    await deleteUserData(uid, "account");
    expect((await db.doc(`users/${uid}/blueprints/${created.id}`).get()).exists).toBe(false);
    expect(await versions(uid, created.id)).toEqual([]);
  });
});
