import type { CardExperienceInput } from "../schema";

/*
 * 청소년 02. 고교 무상교육
 *
 * 학비 0원은 그대로인데, 그 돈을 누가 내느냐가 바뀌고 있다. 학생이 내는 돈은 달라지지 않았다 —
 * 훅이 "학비를 다시 낸다"로 읽히지 않게 공개 화면에 먼저 적는다.
 * 2027년 금액은 국회 심의 전 정부 예산안이다. 예산이 확정되면 claim을 고치고 revision을 올린다.
 */
export const highSchoolFreeTuition = {
  policyId: "high-school-free-tuition",
  publishStatus: "published",

  hook: "고등학교 학비 0원, 정부가 내는 몫은 줄고 있다?",
  shorts: [
    "고등학교 입학금, 수업료, 학교운영지원비, 교과서비.",
    "2021년부터 전 학년이 내지 않습니다.",
    "그 돈은 정부와 교육청, 지방자치단체가 나눠 냅니다.",
    "그런데 정부가 내는 몫이 달라지고 있습니다.",
    "앞으로는 누가 낼까요?",
  ],
  // docs/shorts/high-school-free-tuition.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "Yl_7c6JaGPU" },

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "no-tuition", label: "학비 걱정 없이 학교에 다닐 수 있다" }, // covers
    { id: "gov-should-pay", label: "무상교육은 정부가 책임져야 한다" }, // cp-shift
    { id: "offices-can-pay", label: "교육청 예산으로도 감당할 수 있다" }, // phase-down
    { id: "uncertain", label: "2028년부터가 불안하다" }, // law-2025
    { id: "private-excluded", label: "일부 사립학교는 빠져 있다" }, // covers
  ],

  game: {
    type: "before_after",
    question: "고교 무상교육에 정부가 내는 돈이 더 많은 쪽은?",
    before: { label: "2026년", detail: "국가 증액교부금 5,785억 원. 전체 비용의 30%." },
    after: { label: "2027년 정부 예산안", detail: "3,044억 원. 전체 비용의 15%. 국회 심의 전이에요." },
    answer: "before",
    claimIds: ["share-2026", "budget-2027"],
  },

  reveal: { claimIds: ["covers", "saving", "law-2025", "share-2026", "budget-2027", "phase-down"] },

  suggestedQuestions: ["학생이 내는 돈도 바뀌어?", "2028년에는 어떻게 돼?", "교육청은 어디서 돈을 내?"],
} satisfies CardExperienceInput;
