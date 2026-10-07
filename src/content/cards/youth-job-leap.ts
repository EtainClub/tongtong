import type { CardExperienceInput } from "../schema";

/*
 * 10. 청년일자리도약장려금
 *
 * 이름에서 오는 오해("청년에게 주는 돈")를 게임이 푸는 카드.
 * 정답이 지역에 따라 갈린다 — 수도권은 회사만, 비수도권은 회사와 청년 둘 다.
 * 그래서 질문에 "비수도권"을 박았다. 수도권은 공개 화면에서 대조로 보여준다.
 */
export const youthJobLeap = {
  policyId: "youth-job-leap",
  publishStatus: "published",

  hook: "청년을 채용하면 최대 수백만 원. 그런데 돈을 받는 사람은 누구?",
  shorts: [
    "청년 일자리 정책인데",
    "정작 돈을 받는 사람이 청년이 아닐 수도 있습니다.",
    "청년일자리도약장려금.",
    "기업이 청년을 채용하면 정부가 채용 부담을 지원합니다.",
    "2026년에는 수도권과 비수도권이 나뉘었습니다.",
    "이 돈은 누구에게 가는 걸까요?",
  ],
  // docs/shorts/youth-job-leap.md 대본으로 만든 영상 (2026-10-08 등록).
  video: { youtubeId: "fo5kTfrKuyU" },

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "hiring", label: "기업이 청년을 뽑게 돕는다" }, // company-support
    { id: "regional-youth", label: "지방에 취업한 청년에게 도움이 된다" }, // youth-incentive
    { id: "money-to-company", label: "수도권에서는 돈이 기업에만 간다" }, // capital-no-youth
    { id: "weak-retention", label: "오래 다니는 효과가 약하다" }, // cp-retention
    { id: "regional-gap", label: "지역에 따라 차이가 크다" }, // youth-tiers
  ],

  game: {
    type: "sort",
    question: "청년이 받는 근속 인센티브가 많은 곳부터 순서대로 놓아 보세요.",
    items: [
      { id: "capital", label: "수도권 회사", value: "없음 — 기업만 지원" },
      { id: "general", label: "일반 비수도권 회사", value: "최대 480만 원" },
      { id: "special", label: "특별지원지역 회사", value: "최대 720만 원" },
      { id: "preferred", label: "우대지원지역 회사", value: "최대 600만 원" },
    ],
    answerOrder: ["special", "preferred", "general", "capital"],
    claimIds: ["youth-tiers", "capital-no-youth"],
  },

  reveal: { claimIds: ["company-support", "youth-incentive", "youth-tiers", "capital-no-youth"] },

  suggestedQuestions: [
    "기업만 좋은 정책 아닌가?",
    "청년에게 직접 지급되는 경우는 없어?",
    "기업이 지원금만 받고 해고하면?",
    "비수도권은 왜 더 지원하지?",
  ],
} satisfies CardExperienceInput;
