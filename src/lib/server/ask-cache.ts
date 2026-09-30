import { db } from "@/lib/firebase/admin";
import type { AskAnswer } from "@/lib/ask/grounding";

/** 답에는 오늘 날짜 기준(신청 중·마감)이 섞일 수 있어 오래 두지 않는다. */
export const ASK_CACHE_TTL_MS = 7 * 86_400_000;

/**
 * aiCache/{열쇠} — 답과 만든 시각만. 질문 원문도, 누가 물었는지도 남기지 않는다.
 * 보안 규칙이 클라이언트 읽기·쓰기를 모두 막는다.
 */
export async function readAskCache(key: string, now = new Date()): Promise<AskAnswer | null> {
  const snapshot = await db.doc(`aiCache/${key}`).get();
  if (!snapshot.exists) return null;
  const createdAt = Date.parse(snapshot.get("createdAt") as string);
  if (!(now.getTime() - createdAt < ASK_CACHE_TTL_MS)) return null;
  return snapshot.get("answer") as AskAnswer;
}

export async function writeAskCache(key: string, answer: AskAnswer, model: string, now = new Date()) {
  await db.doc(`aiCache/${key}`).set({ answer, model, createdAt: now.toISOString() });
}
