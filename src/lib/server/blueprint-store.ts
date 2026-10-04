import { randomUUID } from "node:crypto";

import { findPath } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { db } from "@/lib/firebase/admin";
import { Refusal } from "@/lib/guard/refusal";
import {
  applyChanges,
  BlueprintRejection,
  checkAnchor,
  checkHorizon,
  nextAckedChecks,
  type BlueprintAckInput,
  type BlueprintCreateInput,
  type BlueprintPatchInput,
} from "@/lib/blueprint/apply";
import { anchorRange, emptyBlueprint, materialize, pathHorizonYear } from "@/lib/blueprint/materialize";
import { MAX_ACTIVE_BLUEPRINTS, type Blueprint, type Version } from "@/lib/blueprint/model";
import { currentMonth } from "@/lib/blueprint/month";
import type { Profile } from "@/lib/user-state";

/*
 * 청사진 쓰기 (청사진 설계 6.2). 규칙은 lib/blueprint/apply의 순수 함수에 있고, 여기서는
 * 트랜잭션으로 읽고 → 적용하고 → 지금 모습과 REV 기록을 함께 쓴다. 둘이 어긋나는 일이 없다.
 */

const userRef = (uid: string) => db.doc(`users/${uid}`);
const blueprints = (uid: string) => db.collection(`users/${uid}/blueprints`);
const versionRef = (uid: string, id: string, rev: number) => blueprints(uid).doc(id).collection("versions").doc(String(rev));

/** 청사진에 놓을 수 있는 항목 — 앱에 보이는 것(운영에서는 공개)만. */
const visiblePolicies = () => new Map(POLICIES.map((policy) => [policy.id, policy]));

/** Firestore는 undefined를 받지 않는다. 지운 선택 필드(undefined)를 빼고 쓴다 — 데이터는 모두 평범한 JSON이다. */
const compact = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const REJECTION_STATUS: Record<BlueprintRejection["code"], number> = {
  "unknown-path": 404,
  "unknown-policy": 404,
  "unknown-placement": 404,
  "unknown-milestone": 404,
  "too-many-placements": 400,
  "too-many-milestones": 400,
  "invalid-range": 400,
  "invalid-horizon": 400,
  "invalid-transition": 400,
  "no-change": 409,
};

async function rejectionsAsRefusals<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof BlueprintRejection) throw new Refusal(REJECTION_STATUS[error.code], error.code);
    throw error;
  }
}

/**
 * 만들기 — REV.1. 청년만 (청사진 설계 10장 — 청소년 진학 청사진은 기기 저장 모드로 나중에).
 * 활성 청사진은 MAX_ACTIVE_BLUEPRINTS개까지. 기준 달은 오늘이다.
 */
export async function createBlueprint(uid: string, input: BlueprintCreateInput, now = new Date()): Promise<Blueprint> {
  return rejectionsAsRefusals(() =>
    db.runTransaction(async (tx) => {
      const user = await tx.get(userRef(uid));
      if (!user.exists) throw new Refusal(403, "profile-required");
      if ((user.data() as Profile).audienceType !== "young_adult") throw new Refusal(403, "youth-not-supported");
      const active = await tx.get(blueprints(uid).where("status", "==", "active").limit(MAX_ACTIVE_BLUEPRINTS));
      if (active.size >= MAX_ACTIVE_BLUEPRINTS) throw new Refusal(409, "active-exists");

      const id = blueprints(uid).doc().id.toLowerCase();
      const baseline = { asOf: currentMonth(now), stage: input.stage, ...(input.age !== undefined && { age: input.age }) };
      let blueprint: Blueprint;
      if (input.pathId) {
        const path = findPath(input.pathId);
        if (!path) throw new BlueprintRejection("unknown-path");
        // 견본의 출발 달은 사용자가 고른다 (검토 A-4). 목표 연도는 견본의 끝이 든 해보다 이를 수 없다.
        const anchor = input.anchor ?? baseline.asOf;
        checkAnchor(anchorRange(path, baseline.asOf), anchor);
        if (input.horizonYear !== undefined && input.horizonYear < pathHorizonYear(path, anchor)) throw new BlueprintRejection("invalid-horizon");
        blueprint = materialize(path, visiblePolicies(), { id, baseline, now, anchor, title: input.title, horizonYear: input.horizonYear });
      } else {
        const horizonYear = input.horizonYear ?? Number(baseline.asOf.slice(0, 4)) + 5;
        blueprint = emptyBlueprint({ id, baseline, now, goal: { kind: input.kind, title: input.title, horizonYear } });
      }
      checkHorizon(baseline.asOf, blueprint.goal.horizonYear);

      const version: Version = { rev: 1, intent: null, trigger: { kind: input.pathId ? "path" : "create" }, changes: [], createdAt: now.toISOString() };
      tx.set(blueprints(uid).doc(id), compact(blueprint));
      tx.set(versionRef(uid, id, 1), compact(version));
      return blueprint;
    }),
  );
}

/**
 * 고치기 — REV 하나. 보고 고친 REV(expectedRev)가 지금과 다르면 거절한다 — 다른 기기의 수정을 덮지 않는다.
 */
export async function updateBlueprint(uid: string, input: BlueprintPatchInput, now = new Date()): Promise<Blueprint> {
  return rejectionsAsRefusals(() =>
    db.runTransaction(async (tx) => {
      const ref = blueprints(uid).doc(input.id);
      const snapshot = await tx.get(ref);
      const prev = snapshot.data() as Blueprint | undefined;
      if (!prev || prev.status !== "active") throw new Refusal(404, "unknown-blueprint");
      if (prev.rev !== input.expectedRev) throw new Refusal(409, "stale-rev");

      const { next, changes } = applyChanges(prev, input.ops, { policies: visiblePolicies(), now, newId: () => randomUUID().slice(0, 8) });
      const version: Version = { rev: next.rev, intent: input.intent || null, trigger: input.trigger ?? { kind: "user" }, changes, createdAt: now.toISOString() };
      tx.set(ref, compact(next));
      tx.set(versionRef(uid, input.id, next.rev), compact(version));
      return next;
    }),
  );
}

/**
 * 점검 알림 닫기 (청사진 설계 5.1). 계획을 바꾸지 않으므로 REV도, 수정 시각도 건드리지 않는다 — ackedChecks만.
 * 지금 계산되지 않는 옛 키는 걷어 낸다(nextAckedChecks).
 */
export async function ackChecks(uid: string, input: BlueprintAckInput) {
  return db.runTransaction(async (tx) => {
    const ref = blueprints(uid).doc(input.id);
    const snapshot = await tx.get(ref);
    const blueprint = snapshot.data() as Blueprint | undefined;
    if (!blueprint || blueprint.status !== "active") throw new Refusal(404, "unknown-blueprint");
    const ackedChecks = nextAckedChecks(blueprint.ackedChecks, input.keys, input.live);
    tx.update(ref, { ackedChecks });
    return { ackedChecks };
  });
}

/** 보관 — 지우지 않고 내린다. 새 청사진을 만들 수 있게 된다. 영구히 지우려면 내 기록의 "청사진 지우기"(deleteUserData scope=blueprints). */
export async function archiveBlueprint(uid: string, id: string, now = new Date()) {
  await db.runTransaction(async (tx) => {
    const ref = blueprints(uid).doc(id);
    const snapshot = await tx.get(ref);
    if (!snapshot.exists || snapshot.get("status") !== "active") throw new Refusal(404, "unknown-blueprint");
    tx.update(ref, { status: "archived", updatedAt: now.toISOString() });
  });
  return { id };
}
