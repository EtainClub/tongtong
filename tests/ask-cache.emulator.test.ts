import { afterAll, describe, expect, test } from "vitest";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

(enabled ? describe : describe.skip)("ask cache (emulator)", async () => {
  const { db } = await import("@/lib/firebase/admin");
  const { ASK_CACHE_TTL_MS, readAskCache, writeAskCache } = await import("@/lib/server/ask-cache");
  const answer = { grounded: true, answer: "근거에 따르면 …", claimIds: ["age"] };

  afterAll(async () => {
    await db.recursiveDelete(db.collection("aiCache"));
  });

  test("7일 안에는 답을 돌려주고, 지나면 없는 것으로 본다", async () => {
    const at = new Date("2026-10-01T00:00:00Z");
    await writeAskCache("k1", answer, "claude-haiku-4-5", at);
    expect(await readAskCache("k1", new Date(at.getTime() + ASK_CACHE_TTL_MS - 1000))).toEqual(answer);
    expect(await readAskCache("k1", new Date(at.getTime() + ASK_CACHE_TTL_MS + 1000))).toBeNull();
    expect(await readAskCache("missing", at)).toBeNull();
  });
});
