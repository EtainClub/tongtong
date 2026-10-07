import { FieldValue } from "firebase-admin/firestore";

import { findCard } from "@/content/cards";
import { daysBetween, kstDate } from "@/lib/date";
import { db } from "@/lib/firebase/admin";
import { Refusal } from "@/lib/guard/refusal";
import type { MetricEvent } from "@/lib/metrics/events";

/*
 * 하루 한 문서(metrics/{KST 날짜})에 합계만 쌓는다. 보안 규칙이 클라이언트 읽기·쓰기를 모두 막는다.
 *   visits.first / visits.return       방문
 *   returned30                          이 날 처음 온 사람 가운데 30일 안에 다시 온 수 (코호트 날짜 문서에 올린다)
 *   cards.{cardId}.{event}              카드별 이벤트 수
 *   cards.{cardId}.game_correct|game_wrong|game_open  게임 결과
 *   gaps.{role}                         청사진 빈칸 요청 — 찾는 정책이 없다고 고른 역할
 *   regionalOpen                        우리 지역 청년 정책 목록 열람
 * 지역 정책 원문 열기는 metricsRegional/{KST 날짜}의 policies.{온통청년 정책 번호}에 따로 쌓는다.
 */
export async function recordMetric(event: MetricEvent, now = new Date()) {
  const today = kstDate(now);

  if (event.event === "visit") {
    await db.doc(`metrics/${today}`).set({ visits: { [event.first ? "first" : "return"]: FieldValue.increment(1) } }, { merge: true });
    return;
  }
  if (event.event === "returned") {
    const age = daysBetween(event.cohort, today);
    if (age < 1 || age > 30) throw new Refusal(400, "invalid-cohort");
    await db.doc(`metrics/${event.cohort}`).set({ returned30: FieldValue.increment(1) }, { merge: true });
    return;
  }

  if (event.event === "gap_request") {
    // role은 스키마의 정해진 목록이라 필드 경로에 그대로 써도 된다.
    await db.doc(`metrics/${today}`).set({ gaps: { [event.role]: FieldValue.increment(1) } }, { merge: true });
    return;
  }

  if (event.event === "regional_open") {
    await db.doc(`metrics/${today}`).set({ regionalOpen: FieldValue.increment(1) }, { merge: true });
    return;
  }
  if (event.event === "regional_policy_open") {
    // 정책 번호는 정해진 목록이 없다(모양만 검사) — 아무 번호나 와도 하루 지표 문서가 커지지 않게 따로 둔다.
    await db.doc(`metricsRegional/${today}`).set({ policies: { [event.policyId]: FieldValue.increment(1) } }, { merge: true });
    return;
  }

  // 필드 경로에 들어가는 값이다 — 아는 카드 id만 받는다.
  if (!findCard(event.cardId)) throw new Refusal(404, "unknown-card");
  const field =
    event.event === "game_done" ? (event.correct === null ? "game_open" : event.correct ? "game_correct" : "game_wrong") : event.event;
  await db.doc(`metrics/${today}`).set({ cards: { [event.cardId]: { [field]: FieldValue.increment(1) } } }, { merge: true });
}
