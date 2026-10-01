import type { CardExperienceInput } from "../schema";

/*
 * 09. 청년내일저축계좌
 *
 * 원 컨셉의 게임("누구에게 필요한 정책일까")은 정답이 이름에 거의 드러나 자명했다.
 * "월 10만 원을 3년 넣으면?"으로 바꿨다 — 360만 원이 1,440만 원이 되는 것이 이 정책의 반전이다.
 * 원 컨셉의 "차상위 지원 규모 2만 → 2만 5천 명 확대"는 확인한 복지부 자료에서 "2만 5천 명 모집"까지만 확인됐다.
 */
export const youthTomorrowSavings = {
  policyId: "youth-tomorrow-savings",
  publishStatus: "published",

  hook: "내가 저축하면 정부도 같이 적립한다?",
  shorts: [
    "일은 하고 있지만",
    "돈 모으기가 쉽지 않은 저소득 청년.",
    "이들을 위한 자산형성 제도가 있습니다.",
    "내가 매달 저축하면",
    "정부가 지원금을 더 얹어 줍니다.",
    "3년 뒤, 얼마가 될까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "big-support", label: "정부 지원이 크다" }, // deposit, total
    { id: "needed", label: "형편이 어려운 청년에게 필요하다" }, // target
    { id: "hard-conditions", label: "일을 계속해야 해서 유지가 어렵다" }, // conditions, cp-reasons
    { id: "dropout", label: "중도에 해지하는 사람이 많다" }, // cp-dropout
    { id: "pause-longer", label: "적립을 멈출 수 있는 기간이 늘었다" }, // pause
  ],

  game: {
    type: "guess_amount",
    question: "월 10만 원씩 3년 넣으면, 만기에 얼마가 될까?",
    premise: "본인 저축 10만 원 × 36개월 = 360만 원. 이자는 빼고 봅니다.",
    min: 3_600_000,
    max: 20_000_000,
    step: 100_000,
    answers: [{ label: "만기 적립금 (이자 제외)", value: 14_400_000 }],
    claimIds: ["deposit", "total"],
  },

  reveal: { claimIds: ["target", "deposit", "total", "conditions", "pause", "recruit"] },

  suggestedQuestions: ["소득 기준이 정확히 얼마야?", "일을 그만두면 어떻게 돼?", "얼마를 저축해야 해?", "지금 신청할 수 있어?"],
} satisfies CardExperienceInput;
