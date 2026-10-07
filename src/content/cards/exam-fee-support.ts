import type { CardExperienceInput } from "../schema";

/*
 * 05. 국가기술자격 응시료 지원
 *
 * 원 컨셉은 근거 문장에 "1인당 총 3회"라고 적었지만, 공단 안내는 "1인당 연간 3회"다.
 * 훅 질문("1년에 몇 번까지?")이 맞고 컨셉의 사실 문장이 틀렸다.
 *
 * 2026-10-08: 연령·횟수·예산 claim을 2026년 Q-Net 첨부(PDF)로 바꾸고, 비판·한계(대상 종목 — 제2차 청년정책
 * 기본계획이 스스로 넓히겠다고 한 범위)를 넣어 공개했다 (docs/source-check-exam-fee-2026-10-08.md).
 */
export const examFeeSupport = {
  policyId: "exam-fee-support",
  publishStatus: "published",

  hook: "자격증 시험비를 절반만 낸다?",
  shorts: [
    "취업 준비하면서",
    "자격증 시험 몇 번 봤나요?",
    "청년이라면",
    "국가기술자격 시험 응시료를 50% 지원받을 수 있습니다.",
    "하지만 무제한은 아닙니다.",
    "1년에 몇 번까지 가능할까요?",
  ],
  // docs/shorts/exam-fee-support.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "RyOEl2HjlH8" },

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 양쪽 방향을 고루. 근거 claim을 줄 끝에 적는다.
  reasonOptions: [
    { id: "lower-cost", label: "시험비 부담을 덜어 자격증 준비를 돕는다" }, // rate
    { id: "easy-to-use", label: "따로 신청하지 않아도 접수할 때 바로 적용된다" }, // auto-apply
    { id: "narrow-scope", label: "한국산업인력공단 시험만 돼서 대상 종목이 좁다" }, // cp-scope
    { id: "budget-cutoff", label: "예산이 떨어지면 남은 횟수가 있어도 못 받는다" }, // budget
  ],

  game: {
    type: "slider",
    question: "1년에 몇 번까지 지원받을 수 있을까?",
    premise: "2026년 안내 기준이에요.",
    min: 1,
    max: 10,
    step: 1,
    unit: "회",
    answer: 3,
    claimIds: ["count"],
  },

  reveal: { claimIds: ["rate", "count", "age", "auto-apply", "no-show", "budget", "continued-2026"] },

  suggestedQuestions: ["기사시험도 돼?", "이미 시험을 봤다면 소급돼?", "어디서 신청해?", "2026년 나이 기준은?"],
} satisfies CardExperienceInput;
