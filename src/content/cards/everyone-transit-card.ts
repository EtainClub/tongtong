import type { CardExperienceInput } from "../schema";

/*
 * 03. 모두의카드 (K-패스)
 *
 * 원 컨셉의 "월 15회 이상 이용" 조건은 2026년 국토부 안내에서 확인되지 않았다 — 넣지 않았다.
 * 기준금액 50% 인하는 "9월 이용분까지"라 validUntil로 둔다. 10월부터 화면에 "기준일 지남"이 뜬다.
 * 게임은 사용자가 이미 아는 숫자(월 교통비)로 환급액을 맞힌다 — 비율이 돈으로 바뀌는 순간이 반전.
 */
export const everyoneTransitCard = {
  policyId: "everyone-transit-card",
  publishStatus: "published",

  hook: "매일 타는 지하철·버스비를 돌려받는다?",
  shorts: [
    "버스와 지하철.",
    "어차피 매달 쓰는 교통비인데,",
    "청년이라면 교통비 일부를 돌려받을 수 있습니다.",
    "청년 기본 환급률은 30%.",
    "타는 시간대를 바꾸면 더 커지기도 합니다.",
    "내 한 달 교통비라면 얼마나 돌려받을까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "real-refund", label: "교통비를 꽤 돌려받는다" }, // calc-120k
    { id: "off-peak", label: "시차 이용 혜택이 좋다" }, // off-peak
    { id: "complex", label: "유형과 기준이 복잡하다" }, // flat-types, half-price
    { id: "budget-risk", label: "예산이 모자라면 줄어든다" }, // cp-budget
  ],

  game: {
    type: "guess_amount",
    question: "한 달 교통비가 12만 원이라면, 얼마를 돌려받을까?",
    premise: "청년, 기본형(정률 환급) 기준. 시차시간 인센티브는 따로 봅니다.",
    min: 0,
    max: 120_000,
    step: 1_000,
    answers: [
      { label: "기본형 30%", value: 36_000 },
      { label: "모두 시차시간에 탔다면 60%", value: 72_000 },
    ],
    claimIds: ["basic-rate", "off-peak", "calc-120k"],
  },

  reveal: { claimIds: ["basic-rate", "calc-120k", "off-peak", "off-peak-extended", "flat-types", "half-price", "register"] },

  suggestedQuestions: ["출퇴근 시간을 바꾸면 왜 더 받지?", "일반형이랑 플러스형은 뭐가 달라?", "기준금액 인하는 언제까지야?", "어떻게 신청해?"],
} satisfies CardExperienceInput;
