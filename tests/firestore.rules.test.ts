import { readFile } from "node:fs/promises";

import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, test } from "vitest";

// `pnpm test:emulator`가 에뮬레이터를 띄우고 이 변수를 넣는다. 없으면 건너뛴다.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
let env: RulesTestEnvironment;

(enabled ? describe : describe.skip)("firestore.rules", () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-tongtong", // test:emulator의 --project와 같아야 한다 (singleProjectMode)
      firestore: { rules: await readFile("firestore.rules", "utf8") },
    });
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users/alice"), { audienceType: "young_adult", lifeStages: [], consent: { opinion: null } });
      await setDoc(doc(db, "users/alice/cardStates/youth-job-leap"), { cardId: "youth-job-leap", judgments: [] });
      await setDoc(doc(db, "users/alice/blueprints/bp1"), { status: "active", rev: 1 });
      await setDoc(doc(db, "users/alice/blueprints/bp1/versions/1"), { rev: 1, changes: [] });
    });
  });

  afterAll(async () => env.cleanup());

  test("자기 프로필과 카드 상태는 읽을 수 있다", async () => {
    const alice = env.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(alice, "users/alice")));
    await assertSucceeds(getDoc(doc(alice, "users/alice/cardStates/youth-job-leap")));
    await assertSucceeds(getDocs(collection(alice, "users/alice/cardStates")));
  });

  test("남의 기록은 읽을 수 없다", async () => {
    const bob = env.authenticatedContext("bob").firestore();
    const visitor = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(bob, "users/alice")));
    await assertFails(getDocs(collection(bob, "users/alice/cardStates")));
    await assertFails(getDoc(doc(visitor, "users/alice/cardStates/youth-job-leap")));
  });

  test("자기 문서라도 직접 쓸 수 없다 — 쓰기는 /api/*만", async () => {
    const alice = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(alice, "users/alice"), { consent: { opinion: "2026-09-29T00:00:00.000Z" } }));
    await assertFails(setDoc(doc(alice, "users/alice/cardStates/youth-job-leap"), { judgments: [{ axis: "opinion", value: 5 }] }));
  });

  test("청사진과 REV 기록은 자기 것만 읽고, 아무도 직접 쓰지 못한다", async () => {
    const alice = env.authenticatedContext("alice").firestore();
    const bob = env.authenticatedContext("bob").firestore();
    await assertSucceeds(getDocs(collection(alice, "users/alice/blueprints")));
    await assertSucceeds(getDoc(doc(alice, "users/alice/blueprints/bp1/versions/1")));
    await assertFails(getDoc(doc(bob, "users/alice/blueprints/bp1")));
    await assertFails(getDocs(collection(bob, "users/alice/blueprints/bp1/versions")));
    await assertFails(setDoc(doc(alice, "users/alice/blueprints/bp1"), { status: "active", rev: 99 }));
    await assertFails(setDoc(doc(alice, "users/alice/blueprints/bp1/versions/2"), { rev: 2, changes: [] }));
  });

  test("집계는 누구나 읽지만 아무도 쓰지 못한다", async () => {
    const visitor = env.unauthenticatedContext().firestore();
    const alice = env.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(visitor, "cardStats/youth-job-leap")));
    await assertFails(setDoc(doc(alice, "cardStats/youth-job-leap"), { opinion: null }));
  });

  test("그 밖의 경로는 모두 닫혀 있다", async () => {
    const alice = env.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, "aiCache/x")));
    await assertFails(getDoc(doc(alice, "metrics/2026-10-01")));
    await assertFails(setDoc(doc(alice, "metrics/2026-10-01"), { visits: { first: 999 } }));
    await assertFails(getDoc(doc(alice, "aiCache/x")));
    await assertFails(getDoc(doc(alice, "corrections/x")));
    await assertFails(setDoc(doc(alice, "corrections/x"), { uid: "alice", body: "직접 쓰면 안 된다" }));
    await assertFails(setDoc(doc(alice, "anything/else"), { x: 1 }));
  });
});
