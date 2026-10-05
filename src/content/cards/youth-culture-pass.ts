import type { CardExperienceInput } from "../schema";

/*
 * 07. 청년문화예술패스
 *
 * 2026년 대상은 2006·2007년생뿐인데 훅은 청년 전체처럼 읽힌다 — 첫 단계를 출생연도 확인으로 둔다.
 * 원 컨셉의 예산 나누기 게임(budget)은 사실을 공개하지 않아 이번에는 넣지 않았다.
 *
 * 2027년 예산안에 대상이 19~34세로 넓어진다. 예산이 확정되면 claim을 고치고 revision을 올린다 —
 * 저장한 사용자에게 "새 정보"가 뜨는 첫 실제 사례가 된다 (M3).
 * 도서 구매 확대는 정책기자단 기사로만 확인돼 출처 이름에 드러냈다.
 */
export const youthCulturePass = {
  policyId: "youth-culture-pass",
  publishStatus: "published",

  hook: "공연·영화·책에 최대 20만 원?",
  shorts: [
    "공연.",
    "전시.",
    "영화.",
    "그리고 이제는 책까지.",
    "19~20세 청년에게 문화비를 지원합니다. 사는 곳에 따라 금액이 다릅니다.",
    "나도 받을 수 있을까요?",
  ],
  // docs/shorts/youth-culture-pass.md 대본으로 만든 영상 (2026-10-05 등록).
  video: { youtubeId: "Abzn1zYFk2Q" },

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "culture-chance", label: "문화생활을 해 볼 계기가 된다" }, // uses, books
    { id: "narrow-target", label: "대상이 두 나이뿐이다" }, // target
    { id: "few-places", label: "지방에는 쓸 곳이 부족하다" }, // cp-usage
    { id: "unused", label: "많이 쓰이지 않고 남는다" }, // cp-usage
    { id: "wider-next", label: "대상을 넓히는 방향이 좋다" }, // budget-2027
  ],

  // 금액은 비교하지 않는다 — 2027년 안은 국비 기준이라 2026년 지원액과 같은 잣대가 아니다. 대상 범위만 묻는다.
  game: {
    type: "before_after",
    question: "받을 수 있는 사람이 더 많은 쪽은?",
    before: { label: "2026년 청년문화예술패스", detail: "2006·2007년생만. 수도권 15만 원, 비수도권 20만 원." },
    after: { label: "2027년 청년문화패스 (예산안)", detail: "19~34세 모든 청년. 국비 수도권 10만 원, 비수도권 15만 원. 국회 심의 전이에요." },
    answer: "after",
    claimIds: ["target", "amount", "budget-2027"],
  },

  reveal: { claimIds: ["target", "amount", "uses", "books", "deadline", "budget-2027"] },

  suggestedQuestions: ["왜 수도권과 비수도권 금액이 달라?", "책은 어디서 살 수 있어?", "사용 기한은?", "내년에는 누가 받을 수 있어?"],
} satisfies CardExperienceInput;
