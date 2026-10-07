import { CITY_GU, findSido, REGIONS } from "@/content/regions";
import type { Card } from "@/content/schema";

/*
 * 우리 지역 청년 정책 — 온통청년 청년정책 API의 공식 데이터를 그대로 옮긴다 (docs/regional-benefits-review.md R1).
 *
 * 통통이 원문과 대조한 정책 항목이 아니다 — 화면은 늘 "통통이 확인하지 않았어요"를 붙이고, 청사진·카드에 넣지 않는다.
 * 자격을 판정하지 않는다: 나이·소득 조건으로 거르지 않고, 있는 그대로 보여 준다.
 * 이 파일은 순수 함수 — 응답을 고르고(classify) 화면 모양으로 바꾼다(normalize). 부르는 일은 lib/server/youthcenter.
 */

/** 온통청년 응답의 정책 한 줄 — 쓰는 필드만. 모두 문자열로 온다. */
export type YouthcenterPolicy = {
  plcyNo: string;
  plcyNm: string;
  plcyExplnCn?: string;
  plcySprtCn?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  sprtTrgtMinAge?: string;
  sprtTrgtMaxAge?: string;
  aplyYmd?: string;
  aplyPrdSeCd?: string;
  bizPrdEndYmd?: string;
  bizPrdEtcCn?: string;
  aplyUrlAddr?: string;
  refUrlAddr1?: string;
  refUrlAddr2?: string;
  sprvsnInstCdNm?: string;
  rgtrInstCdNm?: string;
  rgtrUpInstCdNm?: string;
  rgtrHghrkInstCdNm?: string;
  zipCd?: string;
  lastMdfcnDt?: string;
};

export type RegionalPolicy = {
  id: string;
  name: string;
  /** 한 줄 설명(정책 설명, 없으면 지원 내용 앞부분). 공식 문장 그대로. */
  summary: string;
  /** 온통청년 대분류 다섯 가운데 하나(일자리·주거·교육·직업훈련·금융·복지·문화·참여·기반), 모르면 적힌 그대로. */
  category: string;
  /** 중분류 — 적힌 그대로(겹친 것만 하나로). */
  subcategory: string;
  /** 지원 대상 나이 — 공식 데이터에 적힌 그대로. 0은 그쪽 끝이 적혀 있지 않다('제한 없음' 자리 채움 값 포함). */
  age: { min: number; max: number } | null;
  apply: { kind: "period"; start: string; end: string } | { kind: "always" } | { kind: "unknown" };
  url: string | null;
  agency: string;
  updatedAt: string | null;
  /** 시·도 전체 정책인가, 고른 시·군·구만의 정책인가. */
  scope: "sido" | "district";
};

/** 시·도 이름 → 코드. 행정구역 개편 전 이름도 받는다(등록기관 이름이 옛 이름으로 남아 있다). */
const SIDO_ALIASES: readonly (readonly [string, string])[] = [
  ...REGIONS.map((s) => [s.name, s.code] as const),
  ["광주광역시", "12"],
  ["전라남도", "12"],
  ["강원도", "51"],
  ["전라북도", "52"],
];
export function sidoOfAgency(name: string | undefined): string | null {
  const trimmed = name?.trim() ?? "";
  return SIDO_ALIASES.find(([alias]) => trimmed.startsWith(alias))?.[1] ?? null;
}

/**
 * 지역을 물을 때 넣을 zipCd들. 시·군·구를 고르면 그 코드(일반구가 있는 시면 일반구 코드들),
 * 시·도만 고르면 그 시·도의 아무 시·군·구 하나 — 시·도 전체 정책은 모든 시·군·구 코드에 걸려 있다.
 */
export function queryCodes(sido: string, sigungu?: string): string[] {
  if (sigungu) return [...(CITY_GU[sigungu] ?? [sigungu])];
  const first = findSido(sido)?.districts[0]?.[0];
  if (!first) return [`${sido}110`]; // 세종처럼 시·군·구가 없는 시·도
  return [CITY_GU[first]?.[0] ?? first];
}

/**
 * 내 지역 정책인가 — zipCd가 모두 내 시·도 안에 있어야 한다(여러 시·도에 걸치면 전국 정책).
 * 등록기관의 시·도가 다르면 데이터가 섞인 것이라 뺀다(예: 서울 목록의 목포시 정책).
 * 시·도만 골랐으면 시·도 전체 정책만 남긴다 — 다른 시·군·구만의 정책이 섞이지 않게.
 */
export function classify(policy: YouthcenterPolicy, sido: string, codes: readonly string[], districtChosen: boolean): RegionalPolicy["scope"] | null {
  const zips = (policy.zipCd ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
  if (zips.length === 0 || !zips.every((code) => code.startsWith(sido))) return null;
  const agencySido = sidoOfAgency(policy.rgtrHghrkInstCdNm) ?? sidoOfAgency(policy.rgtrUpInstCdNm) ?? sidoOfAgency(policy.rgtrInstCdNm);
  if (agencySido && agencySido !== sido) return null;
  // 세종처럼 시·군·구가 없는 시·도는 코드 하나가 곧 시·도 전체다.
  if (!findSido(sido)?.districts.length) return "sido";
  const district = zips.every((code) => codes.includes(code));
  if (district && !districtChosen) return null;
  return district ? "district" : "sido";
}

const clean = (text: string | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

/**
 * 분야 — 지자체마다 같은 분류를 다르게 적는다("교육"과 "교육･직업훈련", "복지문화"와 "금융･복지･문화",
 * "교육･직업훈련,교육･직업훈련"처럼 겹친 값). 온통청년 대분류 다섯으로 모은다. 모르는 값은 그대로 둔다.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  일자리: "일자리",
  주거: "주거",
  교육: "교육·직업훈련",
  "교육·직업훈련": "교육·직업훈련",
  복지문화: "금융·복지·문화",
  "금융·복지·문화": "금융·복지·문화",
  참여권리: "참여·기반",
  "참여·기반": "참여·기반",
};
/**
 * 통통 주제 → 온통청년 큰 분야. 주제 화면의 "우리 지역 청년 정책" 링크가 이 분야를 골라 둔 채 연다.
 * 창업은 온통청년에서 일자리 아래(중분류 "창업")라 일자리로. 교통은 맞는 분야가 없다.
 */
export const TOPIC_REGIONAL_CATEGORY: Record<Card["category"], string | null> = {
  asset: "금융·복지·문화",
  housing: "주거",
  employment: "일자리",
  startup: "일자리",
  transport: null,
  culture: "금융·복지·문화",
  education: "교육·직업훈련",
};

/** 신청이 끝나지 않은 정책 수 — 진입 링크의 "N개". 분야를 주면 그 분야만. */
export function liveCount(policies: readonly RegionalPolicy[], today: string, category?: string | null): number {
  return policies.filter((policy) => (!category || policy.category === category) && applyState(policy, today) !== "closed").length;
}

export function mainCategory(lclsfNm: string | undefined): string {
  const first = clean(lclsfNm).replaceAll("･", "·").split(",")[0]?.trim() ?? "";
  return CATEGORY_ALIASES[first] ?? first;
}
const ymd = (text: string) => (/^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : null);
const httpUrl = (text: string | undefined) => {
  const url = clean(text);
  return /^https?:\/\/\S+$/.test(url) ? url : null;
};

export function normalize(policy: YouthcenterPolicy, scope: RegionalPolicy["scope"]): RegionalPolicy {
  const [start, end] = clean(policy.aplyYmd)
    .split("~")
    .map((part) => ymd(part.trim()));
  const always = policy.aplyPrdSeCd === "0057002" || /상시|연중|수시/.test(clean(policy.bizPrdEtcCn));
  // 1세·99세·100세는 '제한 없음'을 뜻하는 자리 채움 값이라 적혀 있지 않은 것으로 본다.
  const rawMin = Number(policy.sprtTrgtMinAge) || 0;
  const rawMax = Number(policy.sprtTrgtMaxAge) || 0;
  const min = rawMin <= 1 ? 0 : rawMin;
  const max = rawMax >= 99 ? 0 : rawMax;
  const summary = clean(policy.plcyExplnCn) || clean(policy.plcySprtCn);
  return {
    id: policy.plcyNo,
    name: clean(policy.plcyNm),
    summary: summary.length > 140 ? `${summary.slice(0, 139)}…` : summary,
    category: mainCategory(policy.lclsfNm),
    subcategory: [...new Set(clean(policy.mclsfNm).replaceAll("･", "·").split(",").map((part) => part.trim()).filter(Boolean))].join(", "),
    age: min || max ? { min, max } : null,
    apply: start && end ? { kind: "period", start, end } : always ? { kind: "always" } : { kind: "unknown" },
    url: httpUrl(policy.aplyUrlAddr) ?? httpUrl(policy.refUrlAddr1) ?? httpUrl(policy.refUrlAddr2),
    agency: clean(policy.sprvsnInstCdNm) || clean(policy.rgtrInstCdNm),
    updatedAt: /^\d{4}-\d{2}-\d{2}/.test(clean(policy.lastMdfcnDt)) ? clean(policy.lastMdfcnDt).slice(0, 10) : null,
    scope,
  };
}

export type ApplyState = "open" | "upcoming" | "always" | "closed" | "unknown";

/** 신청 상태 — 날짜(KST, YYYY-MM-DD)로 계산한다. 저장하지 않는다. */
export function applyState(policy: RegionalPolicy, today: string): ApplyState {
  if (policy.apply.kind !== "period") return policy.apply.kind;
  if (today < policy.apply.start) return "upcoming";
  if (today > policy.apply.end) return "closed";
  return "open";
}
