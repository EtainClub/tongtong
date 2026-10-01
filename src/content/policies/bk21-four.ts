import type { PolicyInput } from "../schema";

/*
 * 4단계 BK21 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 박사 경로의 대학원 생활비 칸 (청사진 설계 9.3). 초안 — claim은 원문 대조 전이다.
 * 4단계는 2027년 8월에 끝난다 — 박사 경로 대부분이 그 뒤라 견본의 caveat가 이 점을 적는다.
 */
export const bk21Four = {
  id: "bk21-four",
  publishStatus: "draft",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college"],

  name: "4단계 BK21",

  sources: [
    {
      id: "nrf-bk21four",
      title: "4단계 두뇌한국21 사업 소개",
      url: "https://bk21four.nrf.re.kr/sub01/sub111/list.do",
      publisher: "한국연구재단",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "period",
      text: "4단계 BK21은 세계적 수준의 연구중심대학 육성을 목표로 2020년 9월부터 2027년 8월까지 7년 동안 진행된다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["nrf-bk21four"],
    },
    {
      id: "unit",
      text: "대학의 교육연구단(팀)을 선정해 지원하고, 그 교육연구단에 참여한 대학원생이 연구장학금을 받는다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["nrf-bk21four"],
    },
    {
      id: "stipend",
      text: "대학원생 연구장학금 지급 기준액은 석사 월 100만 원, 박사 월 160만 원, 박사수료생 월 130만 원이다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["nrf-bk21four"],
    },
  ],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4). 교육연구단 단위라 개인 신청 회차가 없다.
  planning: {
    roles: ["funding"],
    stages: ["grad_master", "grad_phd"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
