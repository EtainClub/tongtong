/*
 * 정책 상태는 저장하지 않고 날짜에서 계산한다 (검토 문서 4.3).
 *
 * 상태 필드를 두면 누군가 갱신해야 하고, 갱신이 늦으면 "마감된 신청이 열려 있음"이
 * 화면에 뜬다. 날짜의 함수로 두면 크론도 필요 없고 어긋날 수도 없다.
 *
 * 날짜만 적힌 값("2026-10-16")은 한국 시간 그날 하루 전체로 읽는다.
 * 공고가 시각을 밝혔으면("09시~16시") 콘텐츠에 시각까지 적는다.
 */

const KST = "+09:00";
const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** 구간의 시작 시각. 날짜만 있으면 그날 00:00 KST. */
export function startOf(value: string): number {
  return DATE_ONLY.test(value) ? Date.parse(`${value}T00:00:00${KST}`) : Date.parse(value);
}

/** 구간의 끝 시각(포함). 날짜만 있으면 그날 23:59:59.999 KST. */
export function endOf(value: string): number {
  return DATE_ONLY.test(value) ? Date.parse(`${value}T00:00:00${KST}`) + DAY_MS - 1 : Date.parse(value);
}

export type ApplicationState = "upcoming" | "open" | "closed";

export function applicationState(app: { startAt: string; endAt: string }, now: Date): ApplicationState {
  const t = now.getTime();
  if (t < startOf(app.startAt)) return "upcoming";
  if (t > endOf(app.endAt)) return "closed";
  return "open";
}

/**
 * 카드 하나의 신청 상태 — 회차가 여럿이면 지금 열린 것, 없으면 다음 것, 없으면 마지막 것.
 * 회차가 하나도 없으면 null (상시 운영이거나 신청이 없는 정책).
 */
export function currentApplication<T extends { startAt: string; endAt: string }>(
  apps: readonly T[],
  now: Date,
): { app: T; state: ApplicationState } | null {
  if (apps.length === 0) return null;
  const sorted = [...apps].sort((a, b) => startOf(a.startAt) - startOf(b.startAt));
  const withState = sorted.map((app) => ({ app, state: applicationState(app, now) }));
  return (
    withState.find((x) => x.state === "open") ??
    withState.find((x) => x.state === "upcoming") ??
    withState[withState.length - 1]
  );
}

export type ClaimState = "current" | "expired";

export function claimState(claim: { validUntil?: string }, now: Date): ClaimState {
  if (!claim.validUntil) return "current";
  return now.getTime() > endOf(claim.validUntil) ? "expired" : "current";
}

/** 편집자가 원문을 다시 대조해야 하는가. */
export function reviewOverdue(reviewedAt: string, now: Date, maxDays = 90): boolean {
  return now.getTime() - startOf(reviewedAt) > maxDays * DAY_MS;
}
