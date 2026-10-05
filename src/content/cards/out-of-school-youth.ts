import type { CardExperienceInput } from "../schema";

/*
 * 청소년 05. 학교 밖 청소년 지원 (꿈드림)
 *
 * 읽는 사람이 학교 밖 청소년일 수도, 친구가 그럴 수도 있다. 낙인처럼 읽히지 않게 쓴다.
 * 실태조사의 자해·자살 수치는 싣지 않는다 — 청소년이 보는 카드이고, 판단에 필요한 사실이 아니다.
 * 모의평가 응시료 신청은 9월 30일에 끝났다(2026년). 내년 공고가 나오면 신청 기간을 새로 넣는다.
 */
export const outOfSchoolYouth = {
  policyId: "out-of-school-youth",
  publishStatus: "published",

  hook: "학교를 그만둬도 모의고사 응시료를 대준다?",
  shorts: [
    "학교를 그만둔 청소년은 한 해 18만 명이 넘습니다.",
    "학교는 떠났지만 공부와 진로는 계속됩니다.",
    "검정고시, 진학, 취업 준비.",
    "2026년에는 수능 모의평가 응시료도 새로 지원합니다.",
    "얼마를, 어떻게 받을 수 있을까요?",
  ],
  // docs/shorts/out-of-school-youth.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "uKwQV9hMvRk" },

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "keep-studying", label: "학교 밖에서도 공부를 이어갈 수 있다" }, // mock-exam
    { id: "one-place", label: "상담·진로·건강을 한곳에서 돕는다" }, // services
    { id: "small-support", label: "지원 금액이 작다" }, // mock-exam
    { id: "not-reaching", label: "도움이 필요한 사람에게 다 닿지 않는다" }, // cp-reach
    { id: "too-few-staff", label: "센터 인력이 부족하다" }, // cp-reach
  ],

  game: {
    type: "multiple_choice",
    question: "학교 밖 청소년이 6월·9월 수능 모의평가를 보면 응시료는?",
    options: [
      { id: "full", label: "전액 지원 (회당 1만 2천 원)" },
      { id: "half", label: "절반만 지원" },
      { id: "none", label: "지원 없음" },
    ],
    answerOptionId: "full",
    claimIds: ["mock-exam"],
  },

  reveal: { claimIds: ["who", "services", "mock-exam", "count"] },

  suggestedQuestions: ["꿈드림은 어떻게 찾아가?", "검정고시 준비도 도와줘?", "몇 살까지 받을 수 있어?"],
} satisfies CardExperienceInput;
