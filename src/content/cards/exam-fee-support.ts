import type { CardExperienceInput } from "../schema";

/*
 * 05. 국가기술자격 응시료 지원
 *
 * 원 컨셉은 근거 문장에 "1인당 총 3회"라고 적었지만, 공단 안내는 "1인당 연간 3회"다.
 * 훅 질문("1년에 몇 번까지?")이 맞고 컨셉의 사실 문장이 틀렸다.
 *
 * 2026년 세부 기준은 Q-net 공고의 첨부 문서에만 있어 확인하지 못했다. 연령·횟수 claim은
 * 2025년 안내를 근거로 두고 그 사실을 문장에 적었다 — 편집자가 2026년 첨부로 교체할 것.
 */
export const examFeeSupport = {
  policyId: "exam-fee-support",
  publishStatus: "draft",

  hook: "자격증 시험비를 절반만 낸다?",
  shorts: [
    "취업 준비하면서",
    "자격증 시험 몇 번 봤나요?",
    "청년이라면",
    "국가기술자격 시험 응시료를 50% 지원받을 수 있습니다.",
    "하지만 무제한은 아닙니다.",
    "1년에 몇 번까지 가능할까요?",
  ],

  flow: { trust: true, opinion: true },

  game: {
    type: "slider",
    question: "1년에 몇 번까지 지원받을 수 있을까?",
    premise: "2025년 안내 기준이에요.",
    min: 1,
    max: 10,
    step: 1,
    unit: "회",
    answer: 3,
    claimIds: ["count"],
  },

  reveal: { claimIds: ["rate", "count", "age", "budget", "continued-2026"] },

  suggestedQuestions: ["기사시험도 돼?", "이미 시험을 봤다면 소급돼?", "어디서 신청해?", "2026년 나이 기준은?"],
} satisfies CardExperienceInput;
