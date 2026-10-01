import type { CardExperienceInput } from "../schema";

/*
 * 01. 청년미래적금
 *
 * 원 컨셉의 게임(4지선다)은 정답이 숏츠 문장과 같아 읽기만 하면 맞혔다.
 * 금액 맞히기로 바꿨다 — "6~12%"라는 비율이 3년 뒤 실제 얼마인지가 이 카드의 반전이다.
 *
 * 원문에 없어서 비워 둔 것:
 *   - 우대형(12%) 적용 조건 → AI 질문 "6%와 12%는 누구에게?"에 답할 수 없다. 자료를 찾아 claim으로 추가할 것
 *   - 1차 모집·제도 도입 날짜 → policy.history
 */
export const youngFutureSavings = {
  policyId: "young-future-savings",
  publishStatus: "published",

  hook: "매달 50만 원씩 3년. 정부가 돈을 더 얹어준다고?",
  shorts: [
    "청년이 매달 최대 50만 원을 저축하면",
    "정부가 납입액의 일정 비율을 더 넣어주는 적금이 있습니다.",
    "기간은 3년.",
    "정부 기여금에 이자소득 비과세까지.",
    "그런데 누구나 같은 금액을 받는 건 아닙니다.",
    "나는 얼마나 받을 수 있을까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "government-match", label: "정부 기여금이 도움이 된다" }, // match-rate, calc-36m
    { id: "tax-free", label: "비과세 혜택이 크다" }, // tax-free
    { id: "small-deposit", label: "적게 넣으면 받는 돈도 적다" }, // cp-low-deposit
    { id: "hard-to-keep", label: "3년 동안 유지하기 어렵다" }, // cp-dropout
    { id: "low-income-rate", label: "소득이 낮은 청년에게 더 보태야 한다" }, // cp-low-income-rate
  ],

  game: {
    type: "guess_amount",
    question: "3년 동안 정부가 얹어주는 돈은 모두 얼마일까?",
    premise: "매달 50만 원 × 36개월 = 원금 1,800만 원. 이자는 빼고 계산합니다.",
    min: 0,
    max: 5_000_000,
    step: 100_000,
    answers: [
      { label: "일반형 6%", value: 1_080_000 },
      { label: "우대형 12%", value: 2_160_000 },
    ],
    claimIds: ["match-rate", "calc-36m"],
  },

  reveal: { claimIds: ["match-rate", "calc-36m", "deposit", "age", "income"] },

  suggestedQuestions: [
    "나는 가입할 수 있어?",
    "6%와 12%는 누구에게 적용돼?",
    "청년도약계좌와 뭐가 달라?",
    "3년 동안 실제 얼마를 모을 수 있어?",
  ],
} satisfies CardExperienceInput;
