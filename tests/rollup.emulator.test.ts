import { describe, expect, test } from "vitest";

import { CARDS } from "@/content/cards";
import { MIN_PUBLIC, type CardStat } from "@/lib/stats";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

(enabled ? describe : describe.skip)("rollup (emulator)", async () => {
  const { db } = await import("@/lib/firebase/admin");
  const { rollupCardStats } = await import("@/lib/server/rollup");

  const seed = async (users: number, cardId: string, value: number) => {
    const batch = db.batch();
    for (let i = 0; i < users; i++) {
      batch.set(db.doc(`users/rollup-${cardId}-${i}/cardStates/${cardId}`), {
        cardId,
        judgments: [{ axis: "opinion", phase: "final", value, cardVersion: 1, sessionId: `s-${i}-xxxx`, reasonCodes: [], at: "2026-09-29T00:00:00.000Z" }],
      });
    }
    await batch.commit();
  };
  const stat = async (cardId: string) => (await db.doc(`cardStats/${cardId}`).get()).data() as CardStat;

  test("사용자 전체의 카드 상태를 모아 카드마다 한 문서를 쓴다. 작은 수는 쓰지 않는다", async () => {
    await seed(MIN_PUBLIC, "youth-job-leap", 4);
    await seed(3, "youth-monthly-rent", 2);

    const result = await rollupCardStats();
    expect(result.cards).toBe(CARDS.length);

    expect((await stat("youth-job-leap")).opinion).toEqual({
      n: MIN_PUBLIC,
      distribution: { "1": 0, "2": 0, "3": 0, "4": MIN_PUBLIC, "5": 0, unknown: 0 },
    });
    expect((await stat("youth-monthly-rent")).opinion).toBeNull();
  });

  test("지워진 기록은 다음 실행에서 빠진다", async () => {
    await db.recursiveDelete(db.collection("users"));
    await rollupCardStats();
    expect((await stat("youth-job-leap")).opinion).toBeNull();
  });
});
