import { FieldValue } from "firebase-admin/firestore";

import { findCard } from "@/content/cards";
import { findPolicy } from "@/content/policies";
import { cardVersion } from "@/content/schema";
import type { CorrectionInput } from "@/lib/correction";
import { auth, db } from "@/lib/firebase/admin";
import { Refusal } from "@/lib/guard/refusal";
import type { JudgmentInput } from "@/lib/judgment";
import {
  applyCardAction,
  applyJudgment,
  nextProfile,
  ProfileRejection,
  JudgmentRejection,
  withoutOpinions,
  type CardAction,
  type CardState,
  type Profile,
  type ProfileInput,
} from "@/lib/user-state";

/*
 * Firestore 쓰기 계층. 규칙은 lib/user-state.ts의 apply* 함수에 있고, 여기서는
 * 트랜잭션으로 읽고 → 적용하고 → 쓴다. 판단 요청은 사용자 자신의 문서 두 개만 건드린다 —
 * 공용 통계 문서에 쓰지 않는다. 집계는 M3의 롤업이 한다 (검토 문서 4.5).
 */

const userRef = (uid: string) => db.doc(`users/${uid}`);
const stateRef = (uid: string, cardId: string) => db.doc(`users/${uid}/cardStates/${cardId}`);

function requireCard(cardId: string) {
  const card = findCard(cardId);
  if (!card) throw new Refusal(404, "unknown-card");
  return card;
}

const REJECTION_STATUS: Record<JudgmentRejection["code"], number> = {
  "stale-version": 409,
  "axis-disabled": 400,
  "consent-required": 403,
  "no-final-yet": 409,
  "too-many": 429,
  "unknown-reason": 400,
};

export async function recordJudgment(uid: string, input: JudgmentInput): Promise<{ state: CardState; duplicate: boolean }> {
  const card = requireCard(input.cardId);
  try {
    return await db.runTransaction(async (tx) => {
      const [user, current] = await tx.getAll(userRef(uid), stateRef(uid, card.id));
      const result = applyJudgment(current.exists ? (current.data() as CardState) : null, input, {
        currentVersion: cardVersion(card),
        flow: card.flow,
        consented: typeof user.get("consent.opinion") === "string",
        reasonIds: card.reasonOptions.map((reason) => reason.id),
        now: new Date(),
      });
      if (!result.duplicate) tx.set(stateRef(uid, card.id), { ...result.state, updatedAt: FieldValue.serverTimestamp() });
      return result;
    });
  } catch (error) {
    if (error instanceof JudgmentRejection) throw new Refusal(REJECTION_STATUS[error.code], error.code);
    throw error;
  }
}

export async function recordCardAction(uid: string, cardId: string, action: CardAction): Promise<CardState> {
  const card = requireCard(cardId);
  return db.runTransaction(async (tx) => {
    const current = await tx.get(stateRef(uid, card.id));
    const next = applyCardAction(current.exists ? (current.data() as CardState) : null, card.id, action, cardVersion(card), new Date());
    tx.set(stateRef(uid, card.id), { ...next, updatedAt: FieldValue.serverTimestamp() });
    return next;
  });
}

/**
 * 프로필 저장. 규칙은 lib/user-state의 nextProfile — 청소년은 만 14세 이상만, 정책 평가 저장 동의는 받지 않는다.
 * 동의 철회(consentOpinion: false)는 저장된 정책 평가를 함께 지운다.
 */
export async function saveProfile(uid: string, input: ProfileInput): Promise<Profile> {
  const previousDoc = await userRef(uid).get();
  const previous = previousDoc.exists ? (previousDoc.data() as Profile) : null;
  let profile: Profile;
  try {
    profile = nextProfile(previous, input, new Date());
  } catch (error) {
    if (error instanceof ProfileRejection) throw new Refusal(400, error.code);
    throw error;
  }
  await userRef(uid).set(
    {
      ...profile,
      // merge는 빠진 필드를 남겨 둔다 — 지역을 지웠으면 문서에서도 지운다.
      ...(previous?.region && !profile.region ? { region: FieldValue.delete() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
      ...(previousDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  if (previous?.consent.opinion && profile.consent.opinion === null) await deleteOpinions(uid);
  return profile;
}

async function deleteOpinions(uid: string) {
  const states = await userRef(uid).collection("cardStates").get();
  const withOpinion = states.docs.filter((doc) => (doc.data() as CardState).judgments.some((j) => j.axis === "opinion"));
  for (let offset = 0; offset < withOpinion.length; offset += 450) {
    const batch = db.batch();
    for (const doc of withOpinion.slice(offset, offset + 450)) batch.set(doc.ref, withoutOpinions(doc.data() as CardState));
    await batch.commit();
  }
}

/**
 * 내 기록 삭제 (검토 문서 9장). judgments는 판단 기록만, blueprints는 청사진만(보관한 것과 REV 기록까지, 청사진 검토 A-10),
 * account는 계정까지.
 * 집계는 아직 없으므로(M3) 남는 흔적이 없다. 롤업이 생기면 여기서 재계산 큐에 넣는다 — 임통 account/delete.
 */
export async function deleteUserData(uid: string, scope: "judgments" | "blueprints" | "account") {
  if (scope === "account") {
    await db.recursiveDelete(userRef(uid));
    // 정정 요청에는 연락처가 있을 수 있다 — 계정과 함께 지운다.
    const corrections = await db.collection("corrections").where("uid", "==", uid).get();
    await Promise.all(corrections.docs.map((doc) => doc.ref.delete()));
    await auth.deleteUser(uid);
    return { scope };
  }
  await db.recursiveDelete(userRef(uid).collection(scope === "blueprints" ? "blueprints" : "cardStates"));
  return { scope };
}

/**
 * 정정 요청을 접수한다. 운영자만 본다 — 보안 규칙이 클라이언트 읽기·쓰기를 모두 막는다.
 * 사실은 정책 항목에 있으므로 항목을 기준으로 받는다 — 카드가 없는 항목(정책 페이지)에서도 보낼 수 있다.
 * 필드 이름 cardId·cardVersion은 그대로 둔다. 항목 id와 카드 id는 같고, 카드 버전이 곧 항목 버전이다.
 */
export async function recordCorrection(uid: string, input: CorrectionInput) {
  const policy = findPolicy(input.cardId);
  if (!policy) throw new Refusal(404, "unknown-card");
  if (input.claimId && ![...policy.claims, ...policy.counterpoints].some((claim) => claim.id === input.claimId)) {
    throw new Refusal(400, "unknown-claim");
  }
  const ref = await db.collection("corrections").add({
    uid,
    cardId: policy.id,
    cardVersion: cardVersion(policy),
    claimId: input.claimId ?? null,
    body: input.body,
    contact: input.contact || null,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
}
