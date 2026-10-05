import type { CardExperienceInput } from "../schema";

/*
 * 08. 청년도전지원사업
 *
 * 원 컨셉의 UX 원칙을 tone으로 남긴다 — AI 따져보기 프롬프트에도 그대로 들어간다.
 * 원 컨셉의 게임("어떤 지원부터 필요할까?")은 정답이 없어 객관식이 될 수 없다.
 * "나도 참여할 수 있을까?"로 바꾸고, 구직단념 판정(상담 문답)은 "잘 모르겠어요"로 받는다.
 * 사업 안내 사이트에 기준 연도가 적혀 있지 않아 금액 claim에 연도를 붙이지 않았다.
 */
export const youthChallenge = {
  policyId: "youth-challenge",
  publishStatus: "published",

  hook: "6개월 이상 쉬었다면, 오히려 받을 수 있는 취업지원이 있다?",
  shorts: [
    "일도, 교육도, 직업훈련도 하지 않은 시간이",
    "길어졌다면.",
    "다시 시작하려는 청년을 위해",
    "상담, 자신감 회복, 진로 탐색 프로그램이 있습니다.",
    "프로그램을 마치면 참여수당도 있습니다.",
    "지금 다시 시작한다면, 무엇이 필요할까요?",
  ],
  // docs/shorts/youth-challenge.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "4G-XeEnOTcA" },

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 양쪽 방향을 고루. 근거 claim을 줄 끝에 적는다.
  reasonOptions: [
    { id: "restart-help", label: "쉬던 청년이 다시 시작하는 데 도움이 된다" }, // purpose
    { id: "allowance-helps", label: "참여수당이 생활에 보탬이 된다" }, // programs
    { id: "no-job-outcome", label: "취업으로 이어지지 않아도 수당을 준다" }, // cp-allowance-without-job
    { id: "narrow-target", label: "6개월 이상 쉬어야 해서 대상이 좁다" }, // target
  ],

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

  tone: "쉬었던 시간을 문제나 결함으로 표현하지 않는다. '지금 다시 시작한다면 무엇이 필요할까'의 관점으로 말한다.",
} satisfies CardExperienceInput;
