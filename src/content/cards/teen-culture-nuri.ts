import type { CardExperienceInput } from "../schema";

/*
 * 청소년 01. 문화누리카드
 *
 * 청소년(13~18세)은 1만 원을 더 받는다는 것이 훅. 대상은 기초생활수급자·차상위 가구라
 * 모든 청소년이 받는 것이 아니다 — 공개 화면 첫 줄에 둔다.
 * 비판의 숫자는 충남 것이다(전국 통계가 아니다). 문장과 출처 이름에 드러냈다.
 */
export const teenCultureNuri = {
  policyId: "teen-culture-nuri",
  publishStatus: "published",

  hook: "청소년이면 문화생활비를 1만 원 더 준다?",
  shorts: [
    "영화, 공연, 책, 여행, 운동.",
    "1년에 한 번 충전되는 문화생활 카드가 있습니다.",
    "2026년에는 1인당 15만 원.",
    "그런데 13~18세 청소년은 조금 더 받습니다.",
    "얼마를, 누가 받을 수 있을까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "culture-gap", label: "형편 때문에 못 누리던 문화생활을 돕는다" }, // target
    { id: "teen-extra", label: "청소년을 더 챙기는 것이 좋다" }, // amount
    { id: "narrow-target", label: "받을 수 있는 사람이 좁다" }, // target
    { id: "unused", label: "다 못 쓰고 사라지는 돈이 있다" }, // cp-unused
    { id: "small-amount", label: "1년 금액이 적다" }, // amount
  ],

  game: {
    type: "guess_amount",
    question: "2026년, 기초생활수급 가구의 16살 청소년이 받는 금액은?",
    premise: "한 해 동안 쓸 수 있는 문화누리카드 지원금이에요.",
    min: 0,
    max: 300_000,
    step: 10_000,
    answers: [{ label: "13~18세 청소년", value: 160_000 }],
    claimIds: ["amount"],
  },

  reveal: { claimIds: ["target", "amount", "scale", "period", "recharge"] },

  suggestedQuestions: ["어디에 쓸 수 있어?", "우리 집이 대상인지 어떻게 알아?", "다 못 쓰면 어떻게 돼?"],
} satisfies CardExperienceInput;
