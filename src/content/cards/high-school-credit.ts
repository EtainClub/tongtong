import type { CardExperienceInput } from "../schema";

/*
 * 청소년 04. 고교학점제
 *
 * 2026년 이수 기준이 바뀌었다 — 선택과목은 출석률만, 공통과목은 그대로 출석률+학업성취율.
 * 훅 "출석만 해도"는 선택과목에만 맞는 말이라 공개 화면에서 공통과목을 바로 옆에 적는다.
 */
export const highSchoolCredit = {
  policyId: "high-school-credit",
  publishStatus: "published",

  hook: "선택과목은 출석만 해도 학점을 딴다?",
  shorts: [
    "고등학교도 대학처럼 과목을 골라 듣고 학점을 땁니다.",
    "그런데 학점을 따는 기준이 너무 어렵다는 말이 많았습니다.",
    "2026년, 기준이 바뀌었습니다.",
    "선택과목은 이제 무엇만 채우면 될까요?",
  ],
  // docs/shorts/high-school-credit.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "CaWjLf-nzX4" },

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "less-burden", label: "학생·선생님 부담이 줄었다" }, // elective-rule
    { id: "choose-freely", label: "듣고 싶은 과목을 고르기 쉬워졌다" }, // elective-rule
    { id: "learning-gap", label: "배운 것을 확인하지 않게 됐다" }, // elective-rule
    { id: "still-formal", label: "공통과목 기준은 여전히 형식적이다" }, // cp-unions
    { id: "online-helps", label: "온라인으로 다시 기회를 주는 것이 좋다" }, // online
  ],

  game: {
    type: "multiple_choice",
    question: "2026년부터 선택과목 학점을 따려면 무엇을 채워야 할까?",
    options: [
      { id: "attendance", label: "출석률만" },
      { id: "both", label: "출석률과 학업성취율 둘 다" },
      { id: "score", label: "학업성취율만" },
      { id: "none", label: "아무 조건 없음" },
    ],
    answerOptionId: "attendance",
    claimIds: ["elective-rule"],
  },

  reveal: { claimIds: ["before", "elective-rule", "common-rule", "online", "schedule"] },

  suggestedQuestions: ["공통과목과 선택과목은 뭐가 달라?", "학점을 못 따면 어떻게 돼?", "고3도 바뀐 기준이야?"],
} satisfies CardExperienceInput;
