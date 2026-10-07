import { afterAll, describe, expect, test } from "vitest";

// `pnpm test:emulator`가 에뮬레이터를 띄우고 변수를 넣는다. 없으면 건너뛴다.
const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

(enabled ? describe : describe.skip)("metrics store (emulator)", async () => {
  const { db } = await import("@/lib/firebase/admin");
  const { recordMetric } = await import("@/lib/metrics/store");
  const now = new Date("2026-10-01T12:00:00+09:00");
  const read = async (date: string) => (await db.doc(`metrics/${date}`).get()).data() ?? {};

  afterAll(async () => {
    await db.recursiveDelete(db.collection("metrics"));
    await db.recursiveDelete(db.collection("metricsRegional"));
  });

  test("날짜별·카드별 합계만 쌓인다", async () => {
    await recordMetric({ event: "visit", first: true }, now);
    await recordMetric({ event: "card_open", cardId: "youth-job-leap" }, now);
    await recordMetric({ event: "card_open", cardId: "youth-job-leap" }, now);
    await recordMetric({ event: "game_done", cardId: "youth-job-leap", correct: true }, now);
    await recordMetric({ event: "game_done", cardId: "youth-job-leap", correct: null }, now);
    expect(await read("2026-10-01")).toEqual({
      visits: { first: 1 },
      cards: { "youth-job-leap": { card_open: 2, game_correct: 1, game_open: 1 } },
    });
  });

  test("재방문은 첫 방문 날짜 문서에 올리고, 30일 밖은 거절한다", async () => {
    await recordMetric({ event: "returned", cohort: "2026-09-20" }, now);
    expect((await read("2026-09-20")).returned30).toBe(1);
    await expect(recordMetric({ event: "returned", cohort: "2026-08-01" }, now)).rejects.toMatchObject({ status: 400 });
    await expect(recordMetric({ event: "returned", cohort: "2026-10-01" }, now)).rejects.toMatchObject({ status: 400 });
  });

  test("지역 목록 열람은 하루 문서에, 정책별 원문 열기는 따로 쌓인다", async () => {
    const day = new Date("2026-10-02T12:00:00+09:00");
    await recordMetric({ event: "regional_open" }, day);
    await recordMetric({ event: "regional_policy_open", policyId: "20261007005400213925" }, day);
    await recordMetric({ event: "regional_policy_open", policyId: "20261007005400213925" }, day);
    expect(await read("2026-10-02")).toEqual({ regionalOpen: 1 });
    expect((await db.doc("metricsRegional/2026-10-02").get()).data()).toEqual({ policies: { "20261007005400213925": 2 } });
  });

  test("모르는 카드는 받지 않는다 — 필드 경로에 들어가는 값이다", async () => {
    await expect(recordMetric({ event: "card_open", cardId: "a.b" }, now)).rejects.toMatchObject({ status: 404 });
  });
});
