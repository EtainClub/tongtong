import type { CardExperienceInput } from "../schema";

/*
 * 청소년 03. AI 디지털교과서 → AI 교육자료
 *
 * 2025년 1학기에 교과서로 들어왔다가 한 학기 만에 교육자료가 됐다. 쓸지는 학교가 정한다.
 * 교과서 지위를 지키려던 쪽(당시 교육부)과 격하를 이끈 쪽의 말을 모두 CLAIM으로 두고 누구의 말인지 밝힌다.
 * 2026년 선도학교 수(1,900개)는 교육부 업무계획 PDF에서 원문을 확인하지 못해 싣지 않았다.
 */
export const aiLearningMaterials = {
  policyId: "ai-learning-materials",
  publishStatus: "published",

  hook: "AI 교과서, 이제 학교가 안 써도 된다?",
  shorts: [
    "2025년 봄, 교실에 AI 디지털교과서가 들어왔습니다.",
    "태블릿으로 푸는 교과서.",
    "그런데 한 학기 만에 법이 바뀌었습니다.",
    "지금은 '교과서'가 아닙니다.",
    "그럼 누가 쓸지를 정할까요?",
  ],
  // docs/shorts/ai-learning-materials.md 대본으로 만든 영상 (2026-10-04 등록).
  video: { youtubeId: "Kj3ulidRJmU" },

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "school-choice", label: "학교가 고를 수 있어 좋다" }, // law-change
    { id: "rushed", label: "준비 없이 급하게 들어왔다" }, // adoption-drop
    { id: "cost-gap", label: "학교 형편에 따라 차이가 날 수 있다" }, // cp-ministry
    { id: "little-used", label: "실제로는 잘 쓰이지 않았다" }, // cp-usage
    { id: "ai-needed", label: "AI 교육은 필요하다" }, // cp-ministry
  ],

  game: {
    type: "yes_no",
    question: "지금 모든 학교가 AI 디지털교과서를 써야 할까?",
    answer: false,
    note: "2025년 8월 법이 바뀌어 교과서가 아니라 교육자료가 됐어요. 쓸지는 학교가 정해요.",
    claimIds: ["law-change"],
  },

  reveal: { claimIds: ["introduced", "law-change", "adoption-drop", "funding"] },

  suggestedQuestions: ["왜 교육자료로 바뀌었어?", "우리 학교는 쓸 수 있어?", "쓰는 데 돈이 들어?"],
} satisfies CardExperienceInput;
