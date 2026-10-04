import { PLACEMENT_STATUS_LABELS, PLAN_STAGE_LABELS } from "@/features/labels";
import { formatMonth, policyName } from "@/features/plan/Timeline";
import type { Change, PlacementStatus, Trigger } from "@/lib/blueprint/model";

/*
 * REV 기록의 문장 (청사진 설계 7.7). diffBlueprint가 남긴 변경을 그대로 읽는다 — LLM 없이.
 * 숫자로 "변화량"을 요약하지 않는다. 메모 내용은 다시 보이지 않는다 — "메모 바뀜"까지만.
 */

export const TRIGGER_LABELS: Record<Trigger["kind"], string> = {
  create: "만들기",
  path: "견본에서",
  user: "직접",
  check: "점검",
  ai: "AI 제안",
};

const s = (value: unknown) => (typeof value === "string" ? value : "");
const month = (value: unknown) => (typeof value === "string" ? formatMonth(value) : "없음");
const period = (from: unknown, to: unknown) => (typeof to === "string" && to !== from ? `${month(from)}–${month(to)}` : month(from));

/**
 * 변경 하나의 문장. placementPolicy는 배치 id → 정책 id (지금 청사진 기준). 이미 뺀 배치는 찾지 못한다 — 그때는 "뺀 정책".
 */
export function changeText(change: Change, placementPolicy: (placementId: string) => string | undefined): string {
  const before = change.before ?? {};
  const after = change.after ?? {};
  const name = () => {
    const policyId = placementPolicy(change.targetId);
    return policyId ? policyName(policyId) : "뺀 정책";
  };

  switch (change.op) {
    case "add":
      return `넣음 — ${policyName(s(after.policyId))} ${period(after.from, after.to)}`;
    case "remove":
      return `뺌 — ${policyName(s(before.policyId))} ${period(before.from, before.to)}`;
    case "move": {
      const parts = [
        "from" in after && `시작 ${month(before.from)} → ${month(after.from)}`,
        "to" in after && `끝 ${month(before.to)} → ${month(after.to)}`,
        "milestoneId" in after && "이정표 연결 바뀜",
      ].filter(Boolean);
      return `${name()} — ${parts.join(", ")}`;
    }
    case "status":
      return `${name()} — ${PLACEMENT_STATUS_LABELS[before.status as PlacementStatus]} → ${PLACEMENT_STATUS_LABELS[after.status as PlacementStatus]}`;
    case "note":
      return `${name()} — 메모 ${after.note ? "바뀜" : "지움"}`;
    case "basis":
      return `${name()} — 바뀐 내용(v${after.policyVersion})을 보고 그대로 둠`;
    case "milestone": {
      if (!change.before) return `이정표 넣음 — ${s(after.label)} ${month(after.at)}`;
      if (!change.after) return `이정표 지움 — ${s(before.label)}`;
      const parts = [
        "label" in after && `이름 ${s(before.label)} → ${s(after.label)}`,
        "at" in after && `${month(before.at)} → ${month(after.at)}`,
        "stage" in after && `단계 → ${after.stage ? PLAN_STAGE_LABELS[after.stage as keyof typeof PLAN_STAGE_LABELS] : "그대로"}`,
      ].filter(Boolean);
      return `이정표 고침 — ${parts.join(", ")}`;
    }
    case "goal": {
      const parts = ["title" in after && `목표 → ${s(after.title)}`, "horizonYear" in after && `목표 연도 ${before.horizonYear} → ${after.horizonYear}`].filter(Boolean);
      return parts.join(", ");
    }
  }
}

/** 한 줄 요약 — 사용자가 남긴 말이 있으면 그것, 없으면 상태가 아닌 첫 변경, 그것도 없으면 상태 변경 수. */
export function versionSummary(intent: string | null, changes: Change[], placementPolicy: (placementId: string) => string | undefined): string {
  if (intent) return intent;
  const main = changes.find((c) => c.op !== "status");
  if (main) return changeText(main, placementPolicy) + (changes.length > 1 ? ` 외 ${changes.length - 1}건` : "");
  if (changes.length > 0) return `상태 변경 ${changes.length}건`;
  return "청사진을 만들었어요";
}
