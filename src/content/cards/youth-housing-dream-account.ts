import type { CardInput } from "../schema";

/*
 * 04. 청년주택드림청약통장
 *
 * 원 컨셉의 "추가 반전"(청년주택드림대출)은 다른 정책이고 대상 연령도 다르다 — 이 카드에서 뺐다.
 * 대출은 따로 카드로 만들고 links로 잇는다 (검토 문서 6장).
 * 원 컨셉의 "월 2만 원부터"는 확인한 공식 자료에 없어 "최대 100만 원"만 적었다.
 */
export const youthHousingDreamAccount = {
  id: "youth-housing-dream-account",
  publishStatus: "draft",
  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["employed", "housing", "asset_building"],

  shortTitle: "청년주택드림청약통장",
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

  sources: [
    {
      id: "nhuf-product",
      title: "청년 주택드림 청약통장 상품안내",
      url: "https://nhuf.molit.go.kr/FP/FP07/FP0701/FP07010301.jsp",
      publisher: "주택도시기금 (국토교통부)",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-launch",
      title: "이거 하나면 목돈 생기고 주택 청약도…청년주택드림청약통장 21일 출시",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148926066",
      publisher: "국토교통부 (대한민국 정책브리핑)",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "age",
      text: "만 19세 이상 34세 이하가 가입할 수 있고, 병역 기간은 최대 6년까지 인정된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
    },
    {
      id: "income",
      text: "연소득 5천만 원 이하의 근로·사업·기타소득자로, 소득세 신고·납부 등이 증빙돼야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
    },
    {
      id: "no-house",
      text: "무주택자만 가입할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
    },
    {
      id: "deposit",
      text: "매달 최대 100만 원까지 넣을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-launch"],
    },
    {
      id: "rate",
      text: "2년 이상 가입하면 무주택 기간(최대 10년)에 대해 연 4.5%(세전·단리)가 적용된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
    },
    {
      id: "tax",
      text: "2년 이상 가입하면 이자소득 합계 500만 원, 원금 연 600만 원 한도로 비과세된다. 납입금액의 40%까지 소득공제도 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product", "korea-launch"],
    },
    {
      id: "auto-switch",
      text: "기존 청년우대형청약저축 가입자는 따로 신청하지 않아도 청년주택드림청약통장으로 자동 전환됐다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-launch"],
    },
  ],

  counterpoints: [],

  game: {
    type: "yes_no",
    question: "연소득이 딱 5천만 원이라면 가입할 수 있을까?",
    answer: true,
    note: "연소득 5천만 원 이하까지 가입할 수 있어요. 소득세 신고·납부 등으로 소득이 증빙돼야 해요.",
    claimIds: ["income"],
  },

  reveal: { claimIds: ["age", "income", "no-house", "deposit", "rate", "tax"] },

  suggestedQuestions: ["이미 청약통장이 있으면?", "금리는 얼마야?", "군대 다녀오면 나이 계산은?", "세금 혜택은?"],

  policy: {
    history: [
      {
        date: "2024-02-21",
        kind: "introduced",
        summary: "기존 청년우대형청약저축의 대상과 지원을 넓혀 새로 출시했다.",
        sourceIds: ["korea-launch"],
      },
    ],
    applications: [],
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
