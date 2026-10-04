import type { CardExperienceInput } from "../schema";

/*
 * 04. 청년주택드림청약통장
 *
 * 원 컨셉의 "추가 반전"(청년주택드림대출)은 다른 정책이고 대상 연령도 다르다 — 이 카드에서 뺐다.
 * 대출은 따로 카드로 만들고 links로 잇는다 (검토 문서 6장).
 * 원 컨셉의 "월 2만 원부터"는 확인한 공식 자료에 없어 "최대 100만 원"만 적었다.
 */
export const youthHousingDreamAccount = {
  policyId: "youth-housing-dream-account",
  publishStatus: "published",

  hook: "청약통장도 청년 전용이 따로 있다?",
  shorts: [
    "집을 지금 살 생각이 없어도",
    "청약통장을 생각해 본 적 있나요?",
    "19~34세.",
    "연소득 5천만 원 이하.",
    "무주택자라면 청년 전용 청약통장에 가입할 수 있습니다.",
    "나는 가입 가능할까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 양쪽 방향을 고루. 근거 claim을 줄 끝에 적는다.
  reasonOptions: [
    { id: "rate-tax-helps", label: "연 4.5% 금리와 비과세가 도움이 된다" }, // rate, tax
    { id: "start-early", label: "무주택 청년이 일찍 청약을 준비할 수 있다" }, // age, no-house
    { id: "income-proof", label: "소득이 증빙돼야 해서 소득 없는 청년은 가입할 수 없다" }, // income
    { id: "loan-rarely-used", label: "이어지는 대출이 실제로는 거의 실행되지 않았다" }, // cp-loan-rarely-executed
  ],

  game: {
    type: "yes_no",
    question: "연소득이 딱 5천만 원이라면 가입할 수 있을까?",
    answer: true,
    note: "연소득 5천만 원 이하까지 가입할 수 있어요. 소득세 신고·납부 등으로 소득이 증빙돼야 해요.",
    claimIds: ["income"],
  },

  reveal: { claimIds: ["age", "income", "no-house", "deposit", "rate", "tax"] },

  suggestedQuestions: ["이미 청약통장이 있으면?", "금리는 얼마야?", "군대 다녀오면 나이 계산은?", "세금 혜택은?"],
} satisfies CardExperienceInput;
