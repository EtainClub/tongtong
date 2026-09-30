import type { CardInput } from "../schema";

/*
 * 08. 청년도전지원사업
 *
 * 원 컨셉의 UX 원칙을 tone으로 남긴다 — AI 따져보기 프롬프트에도 그대로 들어간다.
 * 원 컨셉의 게임("어떤 지원부터 필요할까?")은 정답이 없어 객관식이 될 수 없다.
 * "나도 참여할 수 있을까?"로 바꾸고, 구직단념 판정(상담 문답)은 "잘 모르겠어요"로 받는다.
 * 사업 안내 사이트에 기준 연도가 적혀 있지 않아 금액 claim에 연도를 붙이지 않았다.
 */
export const youthChallenge = {
  id: "youth-challenge",
  publishStatus: "draft",
  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["job_seeking"],

  shortTitle: "청년도전지원사업",
  hook: "6개월 이상 쉬었다면, 오히려 받을 수 있는 취업지원이 있다?",
  shorts: [
    "일도, 교육도, 직업훈련도 하지 않은 시간이",
    "길어졌다면.",
    "다시 시작하려는 청년을 위해",
    "상담, 자신감 회복, 진로 탐색 프로그램이 있습니다.",
    "프로그램을 마치면 참여수당도 있습니다.",
    "지금 다시 시작한다면, 무엇이 필요할까요?",
  ],

  flow: { trust: true, opinion: true },

  sources: [
    {
      id: "youth-up",
      title: "청년도전지원사업 안내",
      url: "https://youth-up.kr/challenge-info",
      publisher: "고용노동부 청년도전지원사업",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "purpose",
      text: "구직을 멈춘 청년 등의 경제활동 참여와 노동시장 복귀를 돕기 위해 자신감 회복, 구직의욕 높이기 같은 맞춤형 프로그램을 제공한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "target",
      text: "구직단념청년 유형은 18~34세로, 신청일 전 6개월 이상 취업·교육·훈련 이력이 없고 상담원 문답표 점수가 21점 이상(30점 만점)이어야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "other-groups",
      text: "자립준비청년, 청소년복지시설 입·퇴소자, 북한이탈청년 등 18~34세의 다른 대상 유형도 있고, 지자체가 인정한 청년도 참여할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "programs",
      text: "단기(5주·40시간 이상) 참여수당 50만 원, 중기(15주·120시간 이상) 150만 원, 장기(25주·200시간 이상) 250만 원이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "incentive",
      text: "중기·장기는 이수 20만 원, 구직활동 30만 원, 취업 최대 50만 원의 인센티브가 더해진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "contact",
      text: "문의는 고용노동부 고객상담센터 1350.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
  ],

  counterpoints: [],

  // 장기 과정의 최대 금액(참여수당 + 인센티브)을 나눠 본다. 합계는 programs·incentive claim에서 통통이 더한 값이다.
  game: {
    type: "budget",
    question: "장기 과정을 마치고 취업까지 하면 최대 350만 원. 어디서 얼마씩일까?",
    premise: "참여수당과 이수·구직활동·취업 인센티브를 합친 최대 금액이에요. 10만 원 단위로 나눠 보세요.",
    total: 3_500_000,
    step: 100_000,
    items: [
      { id: "allowance", label: "참여수당 (25주·200시간 이상)", actual: 2_500_000 },
      { id: "completion", label: "이수 인센티브", actual: 200_000 },
      { id: "job-search", label: "구직활동 인센티브", actual: 300_000 },
      { id: "employment", label: "취업 인센티브 (최대)", actual: 500_000 },
    ],
    claimIds: ["programs", "incentive"],
  },

  reveal: { claimIds: ["purpose", "target", "other-groups", "programs", "incentive", "contact"] },

  suggestedQuestions: ["어떤 프로그램을 해?", "참여수당은 언제 받아?", "6개월이 안 됐으면 안 돼?", "어디에 물어봐?"],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",

  tone: "쉬었던 시간을 문제나 결함으로 표현하지 않는다. '지금 다시 시작한다면 무엇이 필요할까'의 관점으로 말한다.",
} satisfies CardInput;
