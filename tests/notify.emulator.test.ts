import { afterAll, beforeEach, describe, expect, test } from "vitest";

import type { Sender } from "@/lib/server/notify-store";

// `pnpm test:emulator`가 Firestore·Auth 에뮬레이터를 띄우고 변수를 넣는다. 없으면 건너뛴다.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

(enabled ? describe : describe.skip)("notify store (emulator)", async () => {
  const { auth, db } = await import("@/lib/firebase/admin");
  const { saveProfile, recordCardAction } = await import("@/lib/server/store");
  const store = await import("@/lib/server/notify-store");

  // 청년월세 지원 — 2026년 신청 마감 2026-05-29 16:00 KST. 이틀 전이면 마감 알림 대상이다.
  const now = new Date("2026-05-27T10:00:00+09:00");
  const ALL = { updates: true, revisit: true, deadlines: true, blueprint: true };
  const OFF = { updates: false, revisit: false, deadlines: false, blueprint: false };
  const TOKEN = "fake-push-token-0123456789-abcdefghij";

  /** FCM 대신 — 누구에게 무엇을 보냈는지 적어 둔다. */
  function recorder(invalid: string[] = []) {
    const calls: { tokens: string[]; body: string; path: string }[] = [];
    const send: Sender = async (tokens, message) => {
      calls.push({ tokens, body: message.body, path: message.path });
      return { invalid, sent: tokens.length - invalid.length };
    };
    return { calls, send };
  }

  let uid: string;
  beforeEach(async () => {
    await db.recursiveDelete(db.collection("users"));
    uid = (await auth.createUser({})).uid;
    await saveProfile(uid, { audienceType: "young_adult", lifeStages: ["college"] });
    await recordCardAction(uid, "youth-monthly-rent", "save");
  });
  afterAll(async () => {
    await db.recursiveDelete(db.collection("users"));
  });

  test("동의하지 않은 사람에게는 알림이 가지 않는다 — 설정이 없거나 모두 꺼짐", async () => {
    const { calls, send } = recorder();
    expect(await store.sendDailyNotifications(now, send)).toEqual({ users: 0, messages: 0 });

    await store.saveNotifySettings(uid, OFF, TOKEN);
    expect(await store.sendDailyNotifications(now, send)).toEqual({ users: 0, messages: 0 });
    expect(calls).toEqual([]);
  });

  test("켠 사람에게 하루 한 건 — 같은 알림은 다음 날 다시 보내지 않는다", async () => {
    const { calls, send } = recorder();
    await store.saveNotifySettings(uid, ALL, TOKEN);
    expect(await store.sendDailyNotifications(now, send)).toEqual({ users: 1, messages: 1 });
    expect(calls).toEqual([{ tokens: [TOKEN], body: "청년월세 지원 신청이 5월 29일에 마감돼요", path: "/card/youth-monthly-rent" }]);

    await store.sendDailyNotifications(new Date("2026-05-28T10:00:00+09:00"), send);
    expect(calls).toHaveLength(1);
  });

  test("모두 끄면 기기 토큰을 지운다", async () => {
    await store.saveNotifySettings(uid, ALL, TOKEN);
    expect((await db.collection(`users/${uid}/devices`).get()).size).toBe(1);
    expect(await store.saveNotifySettings(uid, OFF, undefined)).toMatchObject({ devices: 0 });
    expect((await db.collection(`users/${uid}/devices`).get()).size).toBe(0);
  });

  test("받지 못하는 토큰은 지운다", async () => {
    const { send } = recorder([TOKEN]);
    await store.saveNotifySettings(uid, ALL, TOKEN);
    await store.sendDailyNotifications(now, send);
    expect((await db.collection(`users/${uid}/devices`).get()).size).toBe(0);
  });

  describe("청사진 점검 알림 (B5)", () => {
    // 박사 견본을 2026-10 출발로 — 학자금대출 칸이 2026-10에 놓이고, 그 회차(2026-07-01 ~ 11-17 18시)가 이틀 남은 날.
    const created = new Date("2026-10-01T03:00:00Z");
    const closing = new Date("2026-11-15T10:00:00+09:00");
    const BLUEPRINT_ONLY = { ...OFF, blueprint: true };

    async function withBlueprint() {
      const { createBlueprint } = await import("@/lib/server/blueprint-store");
      const { id } = await createBlueprint(uid, { pathId: "phd-stem", anchor: "2026-10", kind: "degree", title: "이공계 박사", stage: "undergrad" }, created);
      return id;
    }

    test("켠 사람의 청사진에 넣은 정책 마감을 청사진 화면으로 알린다 — 목표·메모는 싣지 않는다", async () => {
      await withBlueprint();
      const { calls, send } = recorder();
      await store.saveNotifySettings(uid, BLUEPRINT_ONLY, TOKEN);
      await store.sendDailyNotifications(closing, send);
      expect(calls).toHaveLength(1);
      expect(calls[0].body).toContain("취업 후 상환 학자금대출 신청이 11월 17일에 마감돼요");
      expect(calls[0].body).not.toContain("이공계 박사");
      expect(calls[0].path).toBe("/plan");
    });

    test("청사진 알림을 켜지 않았으면 청사진으로는 보내지 않는다", async () => {
      await withBlueprint();
      const { calls, send } = recorder();
      await store.saveNotifySettings(uid, { ...OFF, updates: true }, TOKEN);
      await store.sendDailyNotifications(closing, send);
      expect(calls).toEqual([]);
    });

    test("화면에서 닫은 점검은 알리지 않는다", async () => {
      const id = await withBlueprint();
      const ref = db.doc(`users/${uid}/blueprints/${id}`);
      const loan = ((await ref.get()).data()!.placements as { id: string; policyId: string }[]).find((p) => p.policyId === "income-contingent-loan")!;
      await ref.update({ ackedChecks: [`window-closing:${loan.id}:2026학년도 2학기`] });
      const { calls, send } = recorder();
      await store.saveNotifySettings(uid, BLUEPRINT_ONLY, TOKEN);
      await store.sendDailyNotifications(closing, send);
      expect(calls.map((c) => c.body).join(" ")).not.toContain("취업 후 상환 학자금대출 신청이");
    });
  });

  test("계정을 지우면 설정과 토큰도 함께 지워진다", async () => {
    const { deleteUserData } = await import("@/lib/server/store");
    await store.saveNotifySettings(uid, ALL, TOKEN);
    await deleteUserData(uid, "account");
    expect((await db.doc(`users/${uid}/notify/settings`).get()).exists).toBe(false);
    expect((await db.collection(`users/${uid}/devices`).get()).size).toBe(0);
  });
});
