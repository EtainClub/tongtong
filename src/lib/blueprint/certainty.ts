import type { Policy } from "@/content/schema";
import type { Placement } from "@/lib/blueprint/model";
import { monthIndex, monthOf, overlaps } from "@/lib/blueprint/month";

/*
 * 시간의 확실성 (청사진 설계 5.3). 청사진의 정직함은 이 구분에 있다 —
 * 몇 년 뒤 정책은 대부분 "예상"이나 "미정"으로 보여야 맞다. 저장하지 않고 항목에서 계산한다.
 *
 *   확정  배치가 시작하는 달이 항목의 신청 회차(applications) 안에 있다
 *   예상  다시 열린다는 근거(recurrence: annual·rounds·always)가 있다
 *   미정  근거가 없거나, 그 전에 끝난(ended) 또는 끝나기로 된(planning.endsAt) 사업이거나, 한 번만 열린다
 */

export type Certainty = "confirmed" | "expected" | "undetermined";

/** 배치가 시작하기 전에 사업이 끝나기로 되어 있는가 (검토 A-6). */
export function endsBefore(placement: Pick<Placement, "from">, policy: Policy | undefined): boolean {
  const endsAt = policy?.planning?.endsAt?.month;
  return Boolean(endsAt && monthIndex(placement.from) > monthIndex(endsAt));
}

export function certaintyOf(placement: Pick<Placement, "from" | "to">, policy: Policy | undefined): Certainty {
  if (!policy) return "undetermined";
  const ended = policy.policy.history.some((event) => event.kind === "ended" && monthIndex(event.date.slice(0, 7)) <= monthIndex(placement.from));
  if (ended || endsBefore(placement, policy)) return "undetermined";
  // 시작 달만 본다 — 8년짜리 배치의 첫 달이 이번 회차와 겹친다고 8년 전체가 확정은 아니다.
  const confirmed = policy.policy.applications.some((app) => overlaps(monthOf(app.startAt), monthOf(app.endAt), placement.from, undefined));
  if (confirmed) return "confirmed";
  const recurrence = policy.planning?.recurrence?.kind;
  return recurrence === "annual" || recurrence === "rounds" || recurrence === "always" ? "expected" : "undetermined";
}
