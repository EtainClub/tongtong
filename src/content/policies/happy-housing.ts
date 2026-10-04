import type { PolicyInput } from "../schema";

/*
 * 행복주택(청년 계층) — 정책 항목(사실). 카드 없음.
 *
 * 청사진 공통 주거 칸 (청사진 설계 9.3 "청년 공공주택"). 2026-10-04 원문 대조(docs/source-check-housing-2026-10-04.md) 뒤 공개.
 * 자산·자동차 기준 금액은 LH(2억 5,100만·4,542만)와 마이홈(2023년 기준 2억 9,900만·3,683만)이 달라 적지 않았다.
 * 모집은 단지별 공고라 recurrence를 두지 않는다 — 청사진은 미정으로 그린다.
 */
export const happyHousing = {
  id: "happy-housing",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["living_alone", "housing", "job_seeking", "employed"],

  name: "행복주택 (청년)",
  summary: "만 19~39세 무주택 청년이 시중 시세의 60~80% 임대료로 최대 6년 살 수 있는 공공임대주택.",

  sources: [
    {
      id: "lh-qualify",
      title: "임대가이드 — 행복주택 입주자격",
      url: "https://apply.lh.or.kr/lhapply/cm/cntnts/cntntsView.do?cntntsId=1201391&mi=1201663",
      publisher: "한국토지주택공사 (LH청약플러스)",
      type: "official",
      license: "link-only",
    },
    {
      id: "myhome-guide",
      title: "행복주택 입주자격 (마이홈 공공주택 안내)",
      url: "https://www.myhome.go.kr/html/guide/QulifyGuideType5.html",
      publisher: "국토교통부 마이홈",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "청년 계층은 만 19세 이상 만 39세 이하이면서 혼인 중이 아닌 무주택자다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["lh-qualify", "myhome-guide"],
    },
    {
      id: "income",
      text: "세대 월평균 소득이 전년도 도시근로자 가구원수별 월평균 소득의 100% 이하여야 한다. 1인 가구는 120%, 2인 가구는 110% 이하다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["lh-qualify"],
    },
    {
      id: "asset",
      text: "총자산과 자동차가액 기준도 따로 충족해야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["lh-qualify", "myhome-guide"],
    },
    {
      id: "newcomer",
      text: "청년 계층에는 사회초년생 구분이 있고, 소득이 있는 업무에 종사한 기간이 모두 합쳐 5년 이내여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["lh-qualify"],
    },
    {
      id: "rent",
      text: "임대료는 공급대상자별로 시중 시세의 60~80%다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["myhome-guide"],
    },
    {
      id: "duration",
      text: "2년 단위로 계약하고, 기간이 끝날 때 입주자격을 다시 확인해 갱신한다. 대학생·청년은 최대 6년 살 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["myhome-guide"],
    },
  ],

  policy: { history: [], applications: [] },

  planning: {
    roles: ["housing"],
    age: { min: 19, max: 39, claimIds: ["target"] },
    durationMonths: { value: 72, claimIds: ["duration"] },
  },

  revisions: [{ version: 1, date: "2026-10-04", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
