import { PLAN_STAGE_LABELS } from "@/features/labels";
import { formatMonth, policyName } from "@/features/plan/Timeline";
import type { Check, FixId } from "@/lib/blueprint/check";

/*
 * 점검 문장 (청사진 설계 7.5). 판정하지 않는다 — 나이·단계는 "다를 수 있어요", 신청은 "공고로 확인"까지만(원칙 3).
 * 정책 이름은 따로 굵게 보이고, 여기서는 그 뒤의 말만 만든다 — 조사(은/는)를 이름에 붙이지 않으려고.
 */

export type CheckText = { message: string; detail?: string; link?: { href: string; label: string; external?: boolean } };

const date = (value: unknown) => (typeof value === "string" ? formatMonth(value.slice(0, 7)) + (value.length >= 10 ? `.${value.slice(8, 10)}` : "") : "");

export function checkText(check: Check): CheckText {
  const d = check.data;
  switch (check.kind) {
    case "policy-updated":
      return { message: `내용이 바뀌었어요 (v${d.from} → v${d.to}). 계획을 그대로 둘지 정해 주세요.`, detail: String(d.summary ?? "") };
    case "policy-withdrawn":
      return { message: "지금 통통에서 볼 수 없는 정책이에요. 공식 안내로 확인하세요." };
    case "policy-ended":
      return { message: `${date(d.date)}에 끝난 정책이에요.` };
    case "program-ending":
      return {
        message: d.startsAfter
          ? `사업이 ${formatMonth(String(d.endsAt))}까지로 되어 있는데, 그 뒤에 놓였어요.`
          : `사업이 ${formatMonth(String(d.endsAt))}까지로 되어 있어요 — 그 뒤는 이어질지 알 수 없어요.`,
      };
    case "window-open":
      return {
        message: `${d.label} 신청 중이에요 — ${d.daysLeft}일 남았어요.`,
        ...(d.url ? { link: { href: String(d.url), label: "신청처 ↗", external: true } } : {}),
      };
    case "window-closing":
      return {
        message: `${d.label} 신청이 ${d.daysLeft === 0 ? "오늘 마감돼요" : `${d.daysLeft}일 뒤 마감돼요`}.`,
        ...(d.url ? { link: { href: String(d.url), label: "신청처 ↗", external: true } } : {}),
      };
    case "window-missed":
      return { message: `${d.label} 신청이 끝났어요. 신청했다면 상태를 바꿔 주세요.` };
    case "schedule-confirmed":
      return { message: `${d.label} 일정이 나왔어요 (${date(d.startAt)}–${date(d.endAt)}). 그 회차로 맞출까요?` };
    case "age-limit": {
      const bound = d.over ? `만 ${d.max}세 이하` : `만 ${d.min}세 이상`;
      return { message: `그때는 나이 조건(${bound})에 ${d.certain ? "맞지 않아요" : "맞지 않을 수 있어요 — 생일에 따라 달라요"}.` };
    }
    case "stage-mismatch":
      return { message: `그때 단계(${PLAN_STAGE_LABELS[d.stage as keyof typeof PLAN_STAGE_LABELS] ?? d.stage})가 대상과 다를 수 있어요. 시점을 확인해 주세요.` };
    case "missing-prerequisite":
      return { message: `그 전에 ${policyName(String(d.requires))}이(가) 먼저 있어야 할 수 있어요.` };
    case "exclusive-overlap":
      return { message: `${policyName(String(d.otherPolicyId))}과(와) 함께 받을 수 없는데 기간이 겹쳐요.` };
    case "card-available":
      return { message: "카드로 따져볼 수 있어요.", link: { href: `/card/${check.policyId}`, label: "따져보기 ◆" } };
    case "path-updated":
      return { message: `가져온 견본(${d.title})이 바뀌었어요. 내 청사진은 그대로예요.` };
  }
}

export function fixLabel(check: Check, id: FixId): string {
  const d = check.data;
  switch (id) {
    case "accept":
      return "이대로 둘게요";
    case "remove":
      return check.kind === "exclusive-overlap" ? `${policyName(String(check.policyId))} 빼기` : "청사진에서 빼기";
    case "remove-other":
      return `${policyName(String(d.otherPolicyId))} 빼기`;
    case "trim":
      return `${formatMonth(String(d.endsAt))}까지로 줄이기`;
    case "ready":
      return "신청 준비로";
    case "missed":
      return "놓침으로";
    case "next-round":
      return "다음 해로 미루기";
    case "move-to-round":
      return "그 회차로 맞추기";
  }
}
