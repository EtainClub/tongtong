"use client";

import type { User } from "firebase/auth";
import { collection, getDocs, limit, onSnapshot, orderBy, query, startAfter, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import type { BlueprintOp, PatchTrigger } from "@/lib/blueprint/apply";
import type { Blueprint, Version } from "@/lib/blueprint/model";
import { apiFetch, ApiError, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";
import { firebaseDb } from "@/lib/firebase/client";

/*
 * 청사진 읽기·쓰기 (청사진 설계 6장). 읽기는 Firestore 구독, 쓰기는 /api/blueprint.
 * 앱 전체 구독(UserDataProvider)에 얹지 않는다 — 청사진 화면에서만 구독한다.
 */

export type ActiveBlueprint = { ready: boolean; blueprint: Blueprint | null; error: Error | null };

/** 활성 청사진 하나 (MAX_ACTIVE_BLUEPRINTS = 1). */
export function useActiveBlueprint(): ActiveBlueprint {
  const { user } = useAuth();
  const uid = user?.uid;
  const [state, setState] = useState<ActiveBlueprint>({ ready: false, blueprint: null, error: null });

  useEffect(() => {
    if (!uid) return;
    const active = query(collection(firebaseDb, "users", uid, "blueprints"), where("status", "==", "active"), limit(1));
    const stop = onSnapshot(
      active,
      (snapshot) => setState({ ready: true, blueprint: snapshot.empty ? null : (snapshot.docs[0].data() as Blueprint), error: null }),
      (error) => setState({ ready: true, blueprint: null, error }),
    );
    return () => {
      stop();
      setState({ ready: false, blueprint: null, error: null });
    };
  }, [uid]);

  return state;
}

/** REV 기록 한 쪽 — 최근 것부터 pageSize개. before를 주면 그 REV보다 앞의 것 (청사진 설계 6.1 — 기록은 길어진다). */
export async function readVersions(uid: string, blueprintId: string, before?: number, pageSize = 30): Promise<Version[]> {
  const versions = collection(firebaseDb, "users", uid, "blueprints", blueprintId, "versions");
  const page = query(versions, orderBy("rev", "desc"), ...(before !== undefined ? [startAfter(before)] : []), limit(pageSize));
  return (await getDocs(page)).docs.map((doc) => doc.data() as Version);
}

/** 내려받기용 — 보관한 것까지 모든 청사진과 REV 기록. 내 문서라 보안 규칙이 읽기를 허락한다. */
export async function readBlueprintsForExport(uid: string) {
  const blueprints = await getDocs(collection(firebaseDb, "users", uid, "blueprints"));
  return Promise.all(
    blueprints.docs.map(async (doc) => ({
      ...(doc.data() as Blueprint),
      versions: (await getDocs(collection(doc.ref, "versions"))).docs.map((v) => v.data()).sort((a, b) => a.rev - b.rev),
    })),
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  "stale-rev": "다른 곳에서 먼저 바뀌었어요. 최신 청사진을 보여 드릴게요 — 다시 해 주세요.",
  "invalid-range": "그 시점은 쓸 수 없어요. 끝이 시작보다 이르거나 목표 연도를 넘었어요.",
  "invalid-horizon": "목표 연도는 올해부터 10년 안이어야 해요.",
  "invalid-transition": "그 상태로는 바로 바꿀 수 없어요.",
  "too-many-placements": "정책은 40개까지 넣을 수 있어요.",
  "too-many-milestones": "이정표는 20개까지 둘 수 있어요.",
  "unknown-policy": "지금은 넣을 수 없는 정책이에요.",
  "active-exists": "이미 청사진이 있어요. 지금 청사진을 보관하면 새로 만들 수 있어요.",
  "youth-not-supported": "청사진은 아직 청년만 쓸 수 있어요.",
};

export const describeBlueprintError = (error: unknown) => describeError(error, "저장하지 못했어요. 다시 시도해 주세요.", ERROR_MESSAGES);

/**
 * 청사진 고치기. 보고 있는 REV를 함께 보낸다 — 그 사이 바뀌었으면 서버가 거절한다(stale-rev).
 * 바뀐 것이 없다는 거절(no-change)은 실패가 아니다 — 조용히 넘어간다.
 */
export function useBlueprintWriter(user: User | null, blueprint: Blueprint | null) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (ops: BlueprintOp[], options: { intent?: string; trigger?: PatchTrigger } = {}): Promise<boolean> => {
      if (!user || !blueprint || busy) return false;
      setBusy(true);
      setError(null);
      try {
        await apiFetch(user, "/api/blueprint", { method: "PATCH", body: { id: blueprint.id, expectedRev: blueprint.rev, ops, ...options } });
        return true;
      } catch (e) {
        if (e instanceof ApiError && e.code === "no-change") return true;
        setError(describeBlueprintError(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user, blueprint, busy],
  );

  /** 점검 알림 닫기 — REV 없이. live는 지금 계산된 점검 키 전부(옛 키를 걷어 내는 데 쓴다). */
  const ack = useCallback(
    async (keys: string[], live: string[]): Promise<boolean> => {
      if (!user || !blueprint || busy) return false;
      setBusy(true);
      setError(null);
      try {
        await apiFetch(user, "/api/blueprint", { method: "PUT", body: { id: blueprint.id, keys, live } });
        return true;
      } catch (e) {
        setError(describeBlueprintError(e));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user, blueprint, busy],
  );

  return { send, ack, busy, error, clearError: () => setError(null) };
}
