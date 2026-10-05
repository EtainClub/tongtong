import type { CardExperienceInput } from "../schema";

/*
 * 02. 청년월세 지원
 *
 * 원 컨셉의 4지선다는 B만 조건에 맞아 정답이 자명했다. 바로 "나도 돼?"로 간다.
 *
 * 2026년 신청은 5/29에 끝났다. 카드는 그래도 유효하다 — 제도를 알고 다음 신청을
 * 기다리는 것도 정보다. 화면의 "마감" 표시는 저장된 상태가 아니라 날짜에서 나온다.
 */
export const youthMonthlyRent = {
  policyId: "youth-monthly-rent",
  publishStatus: "published",

  hook: "월세 최대 480만 원을 지원받을 수 있다?",
  shorts: [
    "자취하는 청년이라면 주목.",
    "부모와 따로 사는 19~34세 무주택 청년 중 일정 조건을 충족하면",
    "매월 최대 20만 원.",
    "최대 24개월.",
    "계산하면 최대 480만 원입니다.",
    "그런데 나는 대상일까요?",
  ],
  // docs/shorts/youth-monthly-rent.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "H9lIjlx3-rw" },

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "eases-rent", label: "월세 부담을 실제로 덜어 준다" }, // amount, max-total
    { id: "strict-income", label: "소득 기준이 너무 엄격하다" }, // cp-strict-income
    { id: "once-in-life", label: "생애 한 번뿐이라 아쉽다" }, // amount
    { id: "no-deposit", label: "보증금·관리비는 빠져 있다" }, // excluded
    { id: "limited-quota", label: "뽑는 인원이 정해져 있다" }, // quota
  ],

  game: {
    type: "eligibility",
    question: "나도 받을 수 있을까?",
    steps: [
      {
        id: "birth",
        question: "1991~2007년생인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "apart",
        question: "부모님과 따로 살고 있나요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "no-house",
        question: "내 이름으로 된 집이 없나요?",
        answers: [
          { label: "네, 없어요", outcome: "pass" },
          { label: "있어요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "income",
        question: "내 가구 소득이 기준 중위소득 60% 이하이고, 부모님 가구는 100% 이하인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
          { label: "잘 모르겠어요", outcome: "unknown" },
        ],
        claimIds: ["income"],
      },
    ],
  },

  reveal: { claimIds: ["amount", "max-total", "excluded", "income", "quota"] },

  suggestedQuestions: [
    "소득 기준은?",
    "보증금이 높으면 안 돼?",
    "월세가 15만 원이면 20만 원을 받나?",
    "지금도 신청할 수 있어?",
  ],
} satisfies CardExperienceInput;
