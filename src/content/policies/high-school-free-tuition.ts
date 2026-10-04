import type { PolicyInput } from "../schema";

/*
 * 청소년 02. 고교 무상교육 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/high-school-free-tuition.ts에 있다 (청사진 설계 2장).
 */
export const highSchoolFreeTuition = {
  id: "high-school-free-tuition",
  publishStatus: "published",

  audience: ["youth"],
  category: "education",
  lifeStages: [],

  name: "고교 무상교육",
  summary: "고등학교 입학금·수업료·학교운영지원비·교과서비를 지원한다. 국가가 내는 몫은 줄어들고 있다.",

  sources: [
    {
      id: "korea-2021-02-28",
      title: "새학기부터 고교도 전면 무상교육…초중고 무상교육 완성",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148884480",
      publisher: "교육부 (대한민국 정책브리핑)",
      publishedAt: "2021-02-28",
      type: "official",
      license: "link-only",
    },
    {
      id: "edupress-2025-08-04",
      title: "고교 무상교육 국비지원 3년 연장 .. '47.5% 이내' 갈등 불씨 될 듯",
      url: "https://www.edupress.kr/news/articleView.html?idxno=21009",
      publisher: "에듀프레스",
      publishedAt: "2025-08-04",
      type: "press",
      license: "link-only",
    },
    {
      id: "mt-2026-04-20",
      title: "고교 무상교육 국비 축소 우려에…교육부 \"안정 추진\" 진화",
      url: "https://www.mt.co.kr/policy/2026/04/20/2026042014375817414",
      publisher: "머니투데이",
      publishedAt: "2026-04-20",
      type: "press",
      license: "link-only",
    },
    {
      id: "edpl-2026-09-03",
      title: "고교생은 느는데, 내년 무상교육 국비 '반토막'",
      url: "https://www.edpl.co.kr/news/articleView.html?idxno=21444",
      publisher: "교육플러스",
      publishedAt: "2026-09-03",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "covers",
      text: "고등학교 입학금·수업료·학교운영지원비·교과서비를 지원하고, 2021년부터 고1~고3 전 학년이 대상이다. 학비를 학교장이 정하는 일부 사립학교는 빠진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2021-02-28"],
    },
    {
      id: "saving",
      text: "전면 시행 때 학생 약 124만 명이 1인당 연 160만 원 정도의 학비 부담을 덜었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2021-02-28"],
    },
    {
      id: "law-2025",
      text: "2025년 8월 4일 국회는 '국가는 고교 무상교육 경비 중 47.5% 이내의 금액을 교부해야 한다'는 법 개정안을 통과시켰다. 이 특례는 2027년까지다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["edupress-2025-08-04"],
    },
    {
      id: "share-2026",
      text: "정부가 내는 몫은 47.5%에서 2026년 30%로 낮아졌다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mt-2026-04-20"],
    },
    {
      id: "budget-2027",
      text: "2026년 국가 증액교부금은 5,785억 원, 2027년 정부 예산안은 3,044억 원이다. 정부 몫은 30%에서 15%로 줄어든다. 국회 심의 전 예산안이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["edpl-2026-09-03"],
    },
    {
      id: "phase-down",
      text: "기획예산처의 2027년 예산안 편성지침에는 고교 무상교육 국비 지원을 점차 줄이고 일몰을 검토하겠다는 내용이 담겼다. 교육부는 안정적으로 추진하겠다고 밝혔다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mt-2026-04-20"],
    },
  ],

  counterpoints: [
    {
      id: "cp-shift",
      text: "고등학생 수는 늘어나는데 국비는 절반으로 줄어, 무상교육을 약속만 하고 비용은 교육청 재정으로 넘기는 셈이라는 비판이 나왔다.",
      assertionType: "CLAIM",
      assertedBy: "전국교직원노동조합 관계자",
      verified: true,
      sourceIds: ["edpl-2026-09-03"],
    },
    {
      id: "cp-47",
      text: "'47.5% 이내'라는 표현 때문에 정부가 몫을 줄일 수 있게 돼 중앙정부와 교육청 사이 갈등이 생길 수 있다는 우려가 법 통과 때부터 나왔다.",
      assertionType: "INTERPRETATION",
      assertedBy: "에듀프레스 보도",
      verified: true,
      sourceIds: ["edupress-2025-08-04"],
    },
  ],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
