import type { AssertionType, Card, LifeStage, PlacementRole, Planning, PlanStage } from "@/content/schema";
import type { Certainty } from "@/lib/blueprint/certainty";
import type { PlacementStatus } from "@/lib/blueprint/model";
import type { ApplicationState } from "@/lib/policy-state";
import type { RevisitReason } from "@/lib/revisit";
import type { z } from "zod";

export const LIFE_STAGE_LABELS: Record<z.infer<typeof LifeStage>, string> = {
  college: "대학생",
  job_seeking: "취업 준비",
  employed: "첫 직장",
  living_alone: "자취",
  military: "군복무·전역",
  startup: "창업",
  housing: "주거",
  asset_building: "자산 모으기",
};

export const CATEGORY_LABELS: Record<Card["category"], string> = {
  asset: "자산",
  housing: "주거",
  employment: "일자리",
  startup: "창업",
  transport: "교통",
  culture: "문화",
  education: "교육",
};

/** 주제 페이지의 한 줄 설명 (/topics/{topic}). */
export const CATEGORY_DESCRIPTIONS: Record<Card["category"], string> = {
  asset: "저축·계좌처럼 돈을 모으는 데 보태는 정책",
  housing: "월세·청약처럼 사는 곳에 관한 정책",
  employment: "일자리·일경험·취업을 돕는 정책",
  startup: "창업을 준비하고 시작하는 데 보태는 정책",
  transport: "교통비를 돌려주는 정책",
  culture: "공연·전시·책 같은 문화생활을 돕는 정책",
  education: "학비·공부·자격·연구를 돕는 정책",
};

export const APPLICATION_LABELS: Record<ApplicationState, string> = {
  upcoming: "신청 예정",
  open: "신청 중",
  closed: "신청 마감",
};

/** 청사진에서 정책이 하는 일 (청사진 설계 4.3). */
export const PLACEMENT_ROLE_LABELS: Record<z.infer<typeof PlacementRole>, string> = {
  funding: "학비·생활비",
  housing: "주거",
  asset: "자산",
  skill: "역량·자격",
  experiment: "일경험·창업 실험",
  startup: "창업 준비·운영",
  employment: "취업·근속",
  living: "교통·문화",
  safety: "공백기 안전망",
};

/** 학적·단계 (청사진 설계 4.4). */
export const PLAN_STAGE_LABELS: Record<z.infer<typeof PlanStage>, string> = {
  undergrad: "학부",
  grad_master: "석사 과정",
  grad_phd: "박사 과정",
  leave_of_absence: "휴학",
  graduated_unemployed: "졸업·구직",
  employed: "직장",
  founder_pre: "창업 준비(사업자 등록 전)",
  founder_early: "창업 초기",
  military: "군복무",
};

/** 배치 상태 (청사진 설계 4.3). 색이 아니라 글자로 말한다. */
export const PLACEMENT_STATUS_LABELS: Record<PlacementStatus, string> = {
  planned: "계획",
  ready: "신청 준비",
  applied: "신청함",
  active: "받는 중",
  done: "끝남",
  missed: "놓침",
  dropped: "뺌",
  ineligible: "대상 아님",
};

/** 시간의 확실성 (청사진 설계 5.3). */
export const CERTAINTY_LABELS: Record<Certainty, string> = {
  confirmed: "확정",
  expected: "예상",
  undetermined: "미정",
};

/** 언제 다시 열리나. 근거가 없으면(recurrence 없음) "공고 확인"으로 쓴다. */
export const RECURRENCE_LABELS: Record<NonNullable<Planning["recurrence"]>["kind"], string> = {
  once: "한 번만 열려요",
  annual: "해마다 열려요",
  rounds: "회차별로 모집해요",
  always: "언제든 신청해요",
};

/** FACT는 표식을 달지 않는다. 나머지는 누구의 말인지 드러낸다. */
export const ASSERTION_LABELS: Partial<Record<AssertionType, string>> = {
  CLAIM: "주장",
  INTERPRETATION: "통통 해석",
  OPINION: "의견",
};

const dateFormat = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Seoul" });
const shortDateFormat = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" });
export const formatDate = (ms: number) => dateFormat.format(ms);
export const formatShortDate = (ms: number) => shortDateFormat.format(ms);
export const formatWon = (value: number) => `${value.toLocaleString("ko-KR")}원`;

/** 다시 볼 이유를 짧게. 개정이 있으면 그게 먼저다. */
export function revisitLabel(reason: RevisitReason): string {
  return reason.kind === "updated" ? `새 정보 +${reason.revisions.length}` : `${reason.days}일 지남`;
}

/** 만 원 단위로 떨어지면 "250만 원", 아니면 formatWon. 게임 안내처럼 큰 금액을 짧게 적을 때. */
export const formatManwon = (value: number) => (value !== 0 && value % 10_000 === 0 ? `${(value / 10_000).toLocaleString("ko-KR")}만 원` : formatWon(value));

/** 숫자 끝 글자의 받침 여부 — 영(0)·일·삼·육·칠·팔은 받침이 있다. */
const DIGIT_HAS_BATCHIM = [true, true, false, true, false, false, true, true, true, false];

/**
 * "…이에요" / "…예요". 끝 글자에 받침이 있으면 이에요.
 * 닫는 따옴표·괄호는 건너뛰고 본다. 한글·숫자가 아닌 끝(%, 영문)은 예요로 둔다.
 */
export function eyo(word: string): string {
  const last = word.replace(/["'”’)\]\s]+$/, "").at(-1) ?? "";
  const code = last.charCodeAt(0);
  const hasBatchim = code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : /\d/.test(last) ? DIGIT_HAS_BATCHIM[Number(last)] : false;
  return `${word}${hasBatchim ? "이에요" : "예요"}`;
}
