import type { PolicyInput } from "../schema";

/*
 * 청년창업중소기업 세액감면 (조세특례제한법 6조) — 정책 항목(사실). 카드 없음.
 *
 * 청사진 창업 경로의 창업 초기 칸 (청사진 설계 9.3). 초안 — claim은 원문 대조 전이다.
 * 청년 요건(대표자 나이 등)은 대통령령에 있고, 2026년 이후 창업의 감면율은 법이 따로 정한다 —
 * 둘 다 원문(시행령·법 6조 해당 항)을 열어 숫자를 확인하기 전에는 적지 않는다.
 */
export const youthStartupTaxRelief = {
  id: "youth-startup-tax-relief",
  publishStatus: "draft",

  audience: ["young_adult"],
  category: "startup",
  lifeStages: ["startup"],

  name: "청년창업중소기업 세액감면",

  sources: [
    {
      id: "law-tax-6",
      title: "조세특례제한법 제6조(창업중소기업 등에 대한 세액감면) — 시행 2026. 9. 18.",
      url: "https://www.law.go.kr/LSW//lsLawLinkInfo.do?chrClsCd=010202&lsId=001584&lsJoLnkSeq=900239530&print=print",
      publisher: "국가법령정보센터",
      type: "legislative",
      license: "public",
    },
  ],

  claims: [
    {
      id: "period",
      text: "창업 후 처음 소득이 생긴 과세연도와 그다음 과세연도부터 4년 안에 끝나는 과세연도까지, 모두 5년 동안 법인세나 소득세를 감면한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["law-tax-6"],
    },
    {
      id: "rate-2025",
      text: "2025년 12월 31일 이전에 창업한 청년창업중소기업은 수도권과밀억제권역 밖이면 세액의 100%, 안이면 50%를 감면받는다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["law-tax-6"],
    },
    {
      id: "rate-2026",
      text: "2026년 1월 1일 이후에 창업한 경우에는 2025년까지와 다른 감면 규정이 따로 적용된다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["law-tax-6"],
    },
    {
      id: "youth-rule",
      text: "어떤 기업이 청년창업중소기업인지(대표자 나이 등)는 대통령령으로 정한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["law-tax-6"],
    },
  ],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4). 신청 회차가 아니라 세금 신고 때 적용받는다.
  planning: {
    roles: ["startup"],
    durationMonths: { value: 60, claimIds: ["period"] },
    stages: ["founder_early"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
