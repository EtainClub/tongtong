import { FieldValue } from "firebase-admin/firestore";

import { CARDS } from "@/content/cards";
import { db } from "@/lib/firebase/admin";
import { aggregate } from "@/lib/stats";
import type { CardState } from "@/lib/user-state";

/**
 * cardStats를 처음부터 다시 계산한다 (Cloud Scheduler → /api/cron/rollup).
 *
 * 임통은 원장 + 증분 롤업이다. 통통은 매번 전량을 다시 센다 — 사용자가 적은 지금은 이쪽이
 * 단순하고, 무엇보다 삭제·동의 철회가 다음 실행에 저절로 반영된다(되돌릴 원장이 없다).
 * 읽기 비용이 사용자 × 카드 수에 비례하므로, 하루 읽기가 무료 할당(5만)을 넘보면
 * 임통 방식(원장 + prev 델타)으로 옮긴다 — 설계 검토 문서 4.4.
 */
export async function rollupCardStats(): Promise<{ states: number; cards: number }> {
  const snapshot = await db.collectionGroup("cardStates").get();
  const stats = aggregate(
    CARDS.map((c) => c.id),
    snapshot.docs.map((doc) => doc.data() as CardState),
  );

  const batch = db.batch();
  for (const stat of stats) {
    batch.set(db.doc(`cardStats/${stat.cardId}`), { ...stat, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  return { states: snapshot.size, cards: stats.length };
}
