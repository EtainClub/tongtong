import type { CardExperienceInput } from "../schema";

/*
 * 06. 미래내일 일경험 — 탐색 카드 (검토 문서 2.7).
 *
 * 믿을 훅도, 찬반을 물을 정책 쟁점도 약하다. 판단 단계를 끄고 "나도 참여할 수 있을까?"로 끝낸다.
 * 원 컨셉의 "직무 선택 → 관련 일경험 카드"는 직무별 공고 데이터가 있어야 한다 — 청년일경험포털 연동 뒤에.
 * 참여 청년 조건·수당은 정책브리핑 정책기자단 기사만 확인돼서 그 사실을 출처 이름에 드러냈다.
 */
export const workExperience = {
  policyId: "work-experience",
  publishStatus: "published",

  hook: "경력이 없어서 취업 못 한다면, 경력을 먼저 만들어 볼 수 있다?",
  shorts: [
    "취업 공고는 경력을 요구하고,",
    "경력을 만들려면 취업을 해야 하고.",
    "이 모순을 풀기 위한 청년 일경험 프로그램이 있습니다.",
    "기업에서 실제 직무를 해 보거나",
    "프로젝트에 참여하는 방식입니다.",
    "나도 참여할 수 있을까요?",
  ],

  flow: { trust: false, opinion: false },

  game: {
    type: "eligibility",
    question: "나도 참여할 수 있을까?",
    steps: [
      {
        id: "age",
        question: "만 15~34세인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "unemployed",
        question: "지금 취업하지 않은 상태인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
    ],
  },

  reveal: { claimIds: ["target", "types", "tour", "multiple", "allowance", "portal"] },

  suggestedQuestions: ["인턴형이랑 프로젝트형은 뭐가 달라?", "수당은 얼마야?", "여러 번 해도 돼?", "어디서 신청해?"],
} satisfies CardExperienceInput;
