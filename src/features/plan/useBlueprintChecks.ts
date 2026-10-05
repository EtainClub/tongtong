"use client";

import { useMemo, useState } from "react";

import { findCard } from "@/content/cards";
import { PATHS } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import { checkBlueprint, openChecks, type Check } from "@/lib/blueprint/check";
import type { Blueprint } from "@/lib/blueprint/model";
import { useUserData } from "@/lib/firebase/user-data";

/*
 * 청사진 점검 — 열 때마다 계산한다(청사진 설계 5.1). /plan과 내 기록의 "점검할 것 N"이 같은 값을 쓴다.
 * all은 닫은 것까지 전부(닫기 요청의 live 키), open은 아직 닫지 않은 것.
 */

const policyMap = new Map(POLICIES.map((policy) => [policy.id, policy]));
const pathMap = new Map(PATHS.map((path) => [path.id, path]));
const hasCard = (policyId: string) => Boolean(findCard(policyId));

export function useBlueprintChecks(blueprint: Blueprint | null, now?: Date): { all: Check[]; open: Check[] } {
  const data = useUserData();
  const [fallbackNow] = useState(() => new Date());
  const at = now ?? fallbackNow;
  const completedCards = useMemo(() => new Set([...data.states.values()].filter((s) => s.completedAt).map((s) => s.cardId)), [data.states]);
  const all = useMemo(
    () => (blueprint ? checkBlueprint(blueprint, { policies: policyMap, paths: pathMap, hasCard, completedCards, now: at }) : []),
    [blueprint, completedCards, at],
  );
  return { all, open: blueprint ? openChecks(all, blueprint.ackedChecks) : [] };
}
