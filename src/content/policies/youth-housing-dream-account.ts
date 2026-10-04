import type { PolicyInput } from "../schema";

/*
 * 04. 청년주택드림청약통장 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-housing-dream-account.ts에 있다 (청사진 설계 2장).
 */
export const youthHousingDreamAccount = {
  id: "youth-housing-dream-account",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["employed", "housing", "asset_building"],

  name: "청년주택드림청약통장",
  summary: "무주택 청년의 청약통장. 2년 이상 가입하면 연 4.5% 금리와 비과세·소득공제를 받는다.",

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
    {
      id: "news1-2026-01-19",
      title: "지난해 청년주택드림대출 서울 실행 0건…\"구조적 한계 존재\"",
      url: "https://www.news1.kr/realestate/general/6043215",
      publisher: "뉴스1",
      publishedAt: "2026-01-19",
      type: "press",
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

  // 국토교통부 제출 자료를 인용한 보도 (docs/source-check-housing-2026-10-04.md). 대출 조건은 소개하지 않는다 — 다른 정책이다.
  counterpoints: [
    {
      id: "cp-loan-rarely-executed",
      text: "청약통장 가입자가 당첨 뒤 쓰는 청년주택드림대출은 2025년 4~11월 전국에서 13건(32억 원)이 실행돼, 같은 기간 신청 185건(422억 원)보다 크게 적었고 서울에서는 한 건도 없었다. 국토교통부는 심사를 마치고 입주를 기다리는 경우가 있어 실행이 점차 늘 것이라고 설명했다.",
      assertionType: "CLAIM",
      assertedBy: "국토교통부 제출 자료(문진석 의원실), 뉴스1 보도(2026-01-19)",
      verified: true,
      sourceIds: ["news1-2026-01-19"],
    },
  ],

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

  // 청사진 계획 정보 (청사진 설계 4.4). 병역 기간 인정(최대 6년)은 점검이 아직 보지 않는다.
  planning: {
    roles: ["housing", "asset"],
    age: { min: 19, max: 34, claimIds: ["age"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
