import { afterAll, beforeEach, describe, expect, test } from "vitest";

import { CARDS } from "@/content/cards";
import { cardVersion } from "@/content/schema";
import type { JudgmentInput } from "@/lib/judgment";
import type { CardState } from "@/lib/user-state";

// `pnpm test:emulator`가 Firestore·Auth 에뮬레이터를 띄우고 변수를 넣는다. 없으면 건너뛴다.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST);

(enabled ? describe : describe.skip)("server store (emulator)", async () => {
  // 에뮬레이터가 없을 때 Admin SDK를 초기화하지 않도록 안에서 불러온다.
  const { auth, db } = await import("@/lib/firebase/admin");
  const store = await import("@/lib/server/store");

  const card = CARDS.find((c) => c.id === "youth-job-leap")!;
  const base = { cardId: card.id, cardVersion: cardVersion(card), sessionId: "session-0001" } as const;
  const trust: JudgmentInput = { ...base, axis: "trust", phase: "initial", value: 2 };
  const opinion: JudgmentInput = { ...base, axis: "opinion", phase: "final", value: 4, reasonCodes: [] };
  const read = async (uid: string) => (await db.doc(`users/${uid}/cardStates/${card.id}`).get()).data() as CardState | undefined;

  let uid: string;
  beforeEach(async () => {
    uid = (await auth.createUser({})).uid;
  });
  afterAll(async () => {
    await db.recursiveDelete(db.collection("users"));
    await db.recursiveDelete(db.collection("corrections"));
  });

  test("판단이 카드 상태 문서에 쌓이고, 재시도는 한 번만 반영된다", async () => {
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [], consentOpinion: true });
    await store.recordJudgment(uid, trust);
    const retry = await store.recordJudgment(uid, trust);
    expect(retry.duplicate).toBe(true);
    await store.recordJudgment(uid, opinion);

    const state = await read(uid);
    expect(state?.judgments.map((j) => j.axis)).toEqual(["trust", "opinion"]);
    expect(state?.completedAt).toBeTruthy();
  });

  test("동의 없는 정책 평가는 403으로 거절한다", async () => {
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [] });
    await expect(store.recordJudgment(uid, opinion)).rejects.toMatchObject({ status: 403, reason: "consent-required" });
    expect(await read(uid)).toBeUndefined();
  });

  test("옛 버전·없는 카드는 거절한다", async () => {
    await expect(store.recordJudgment(uid, { ...trust, cardVersion: base.cardVersion + 1 })).rejects.toMatchObject({ status: 409 });
    await expect(store.recordJudgment(uid, { ...trust, cardId: "no-such-card" })).rejects.toMatchObject({ status: 404 });
  });

  test("청소년 트랙은 아직 받지 않는다", async () => {
    await expect(store.saveProfile(uid, { audienceType: "youth", lifeStages: [] })).rejects.toMatchObject({ status: 400, reason: "youth-track-closed" });
  });

  test("동의를 철회하면 저장된 정책 평가만 지운다", async () => {
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [], consentOpinion: true });
    await store.recordJudgment(uid, trust);
    await store.recordJudgment(uid, opinion);
    const profile = await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [], consentOpinion: false });

    expect(profile.consent.opinion).toBeNull();
    expect((await read(uid))?.judgments.map((j) => j.axis)).toEqual(["trust"]);
  });

  test("동의를 다시 저장해도 처음 동의 시각을 지킨다", async () => {
    const first = await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [], consentOpinion: true });
    const again = await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: ["housing"], consentOpinion: true });
    const untouched = await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [] });
    expect(again.consent.opinion).toBe(first.consent.opinion);
    expect(untouched.consent.opinion).toBe(first.consent.opinion);
  });

  test("저장·넘기기", async () => {
    await store.recordCardAction(uid, card.id, "save");
    await store.recordCardAction(uid, card.id, "pass");
    expect(await read(uid)).toMatchObject({ saved: true, lastSeenVersion: cardVersion(card) });
    expect((await read(uid))?.passedAt).toBeTruthy();
  });

  test("판단 기록 삭제와 계정 삭제", async () => {
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: [] });
    await store.recordJudgment(uid, trust);

    await store.deleteUserData(uid, "judgments");
    expect(await read(uid)).toBeUndefined();
    expect((await db.doc(`users/${uid}`).get()).exists).toBe(true);

    await store.deleteUserData(uid, "account");
    expect((await db.doc(`users/${uid}`).get()).exists).toBe(false);
    await expect(auth.getUser(uid)).rejects.toThrow();
  });

  test("관심 주제는 저장되고, 동의만 바꿀 때는 그대로 남는다", async () => {
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: ["college"], interests: ["housing", "culture"] });
    await store.saveProfile(uid, { audienceType: "young_adult", lifeStages: ["college"], consentOpinion: true });
    expect((await db.doc(`users/${uid}`).get()).get("interests")).toEqual(["housing", "culture"]);
  });

  test("정정 요청은 카드 판과 함께 접수되고, 계정을 지우면 함께 지워진다", async () => {
    const claimId = card.claims[0].id;
    const { id } = await store.recordCorrection(uid, { cardId: card.id, claimId, body: "금액이 공고문과 달라요.", contact: "a@example.com" });
    const saved = (await db.doc(`corrections/${id}`).get()).data();
    expect(saved).toMatchObject({ uid, cardId: card.id, cardVersion: cardVersion(card), claimId, status: "open" });

    await expect(store.recordCorrection(uid, { cardId: card.id, claimId: "no-such-claim", body: "없는 근거를 가리킨다" })).rejects.toMatchObject({ status: 400 });

    await store.deleteUserData(uid, "account");
    expect((await db.doc(`corrections/${id}`).get()).exists).toBe(false);
  });
});
