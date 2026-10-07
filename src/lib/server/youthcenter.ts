import { classify, normalize, queryCodes, type RegionalPolicy, type YouthcenterPolicy } from "@/lib/regional";
import { Refusal } from "@/lib/guard/refusal";

/*
 * 온통청년 청년정책 API 중계 (docs/regional-benefits-review.md R1).
 *
 * 인증키(YOUTHCENTER_API_KEY)는 서버에만 있다. 지역 하나에 전국 정책까지 700–900건이 오므로
 * 여기서 지역 정책만 골라 화면 모양으로 바꿔 돌려준다. 같은 지역은 하루 동안 서버 메모리에 둔다 —
 * 인스턴스마다 따로라 하루 호출은 많아야 (지역 수 × 인스턴스 수)다. 사용자 정보는 보내지 않는다.
 */

const ENDPOINT = "https://www.youthcenter.go.kr/go/ythip/getPlcy";
/**
 * 한 번에 받는 건수. 지역 하나가 전국 정책 포함 700–900건이라 한 번이면 다 온다(2026-10 확인: 1,000건 요청 → 717건, 2.8MB, 2초 안팎).
 * 쪽을 나눠 한꺼번에 부르면 온통청년이 거절한다(짧은 시간의 여러 요청) — 그래서 큰 쪽 하나를, 코드마다 차례로.
 */
const PAGE_SIZE = 1000;
/** 한 지역에 이보다 많으면 데이터가 이상한 것이다 — 끝없이 넘기지 않는다. */
const MAX_PAGES = 3;
const TTL_MS = 24 * 60 * 60 * 1000;

type Page = { totCount: number; list: YouthcenterPolicy[] };

async function fetchPage(zipCd: string, pageNum: number, attempt = 1): Promise<Page> {
  const key = process.env.YOUTHCENTER_API_KEY;
  if (!key) throw new Refusal(503, "regional-unavailable");
  const url = `${ENDPOINT}?apiKeyNm=${encodeURIComponent(key)}&pageNum=${pageNum}&pageSize=${PAGE_SIZE}&rtnType=json&zipCd=${zipCd}`;
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20_000) }).catch(() => null);
  const json = response ? ((await response.json().catch(() => null)) as { result?: { pagging?: { totCount?: number }; youthPolicyList?: YouthcenterPolicy[] } } | null) : null;
  if (!response?.ok || !json?.result) {
    // 한 번만 다시 — 잠깐 쉬었다가.
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return fetchPage(zipCd, pageNum, attempt + 1);
    }
    throw new Refusal(502, "regional-upstream");
  }
  return { totCount: json.result.pagging?.totCount ?? 0, list: json.result.youthPolicyList ?? [] };
}

/** zipCd 하나의 전체 목록 — 대개 첫 쪽에 다 있다. 넘치면 다음 쪽을 차례로. */
async function fetchAll(zipCd: string): Promise<YouthcenterPolicy[]> {
  const first = await fetchPage(zipCd, 1);
  const list = [...first.list];
  const pages = Math.min(MAX_PAGES, Math.ceil(first.totCount / PAGE_SIZE));
  for (let page = 2; page <= pages; page++) list.push(...(await fetchPage(zipCd, page)).list);
  return list;
}

const cache = new Map<string, { at: number; value: Promise<RegionalPolicy[]> }>();

/** 내 지역 청년 정책 — 시·도 전체 정책과(시·군·구를 골랐으면) 그 시·군·구만의 정책. 하루 캐시. */
export function regionalPolicies(sido: string, sigungu?: string, now = Date.now()): Promise<RegionalPolicy[]> {
  const key = `${sido}:${sigungu ?? ""}`;
  const hit = cache.get(key);
  if (hit && now - hit.at < TTL_MS) return hit.value;
  const value = load(sido, sigungu);
  cache.set(key, { at: now, value });
  // 실패한 응답은 두지 않는다 — 다음 요청이 다시 부른다.
  value.catch(() => cache.delete(key));
  return value;
}

async function load(sido: string, sigungu?: string): Promise<RegionalPolicy[]> {
  const codes = queryCodes(sido, sigungu);
  // 일반구가 있는 시(수원시는 넷)는 코드마다 — 한꺼번에 부르지 않고 차례로.
  const lists: YouthcenterPolicy[] = [];
  for (const code of codes) lists.push(...(await fetchAll(code)));
  const byId = new Map<string, RegionalPolicy>();
  for (const policy of lists) {
    if (byId.has(policy.plcyNo)) continue;
    const scope = classify(policy, sido, codes, Boolean(sigungu));
    if (scope) byId.set(policy.plcyNo, normalize(policy, scope));
  }
  return [...byId.values()];
}
