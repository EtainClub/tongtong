import type { PolicyInput } from "../schema";

/*
 * 청소년 03. AI 디지털교과서 → AI 교육자료 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/ai-learning-materials.ts에 있다 (청사진 설계 2장).
 */
export const aiLearningMaterials = {
  id: "ai-learning-materials",
  publishStatus: "published",

  audience: ["youth"],
  category: "education",
  lifeStages: [],

  name: "AI 디지털교과서",

  sources: [
    {
      id: "khan-2025-08-04",
      title: "급히 도입해 탈난 AI 교과서 결국 '교육자료' 지위격하",
      url: "https://www.khan.co.kr/article/202508041631001",
      publisher: "경향신문",
      publishedAt: "2025-08-04",
      type: "press",
      license: "link-only",
    },
    {
      id: "unn-2025-10-24",
      title: "[2025 국감] 교육자료 격하된 AI 디지털교과서, 2학기 도입률 60% 급감",
      url: "https://news.unn.net/news/articleView.html?idxno=585404",
      publisher: "한국대학신문",
      publishedAt: "2025-10-24",
      type: "press",
      license: "link-only",
    },
    {
      id: "korea-2024-12-26",
      title: "AI 디지털교과서 관련 초중등교육법 일부개정법률안 본회의 의결에 대한 정부입장",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=156667666",
      publisher: "교육부 (대한민국 정책브리핑)",
      publishedAt: "2024-12-26",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "introduced",
      text: "AI 디지털교과서는 2025학년도 1학기에 교과서로 학교에 들어왔다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2025-08-04"],
    },
    {
      id: "law-change",
      text: "2025년 8월 4일 국회가 초중등교육법 개정안을 통과시켜 AI 디지털교과서의 지위를 '교과서'에서 '교육자료'로 바꿨다. 교과서는 학교가 반드시 채택해야 하지만, 교육자료는 학교장이 쓸지 정한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2025-08-04"],
    },
    {
      id: "adoption-drop",
      text: "국회 교육위원회 백승아 의원(더불어민주당)이 공개한 자료에 따르면, AI 디지털교과서를 쓴 학교는 2025년 1학기 4,095곳에서 2학기 1,686곳으로 약 59% 줄었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["unn-2025-10-24"],
    },
    {
      id: "funding",
      text: "교육자료가 되면서 교육청이 구독료를 지원하기 어려워졌고, 쓰려는 학교가 비용을 스스로 마련해야 하게 됐다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["unn-2025-10-24"],
    },
  ],

  counterpoints: [
    {
      id: "cp-ministry",
      text: "교육자료는 무상·의무교육 대상이 아니어서 학생·학부모 부담이 늘 수 있고, 지역과 학교 재정 형편에 따라 교육 격차가 생길 수 있다.",
      assertionType: "CLAIM",
      assertedBy: "교육부(2024년 12월, 이주호 당시 장관)",
      verified: true,
      sourceIds: ["korea-2024-12-26"],
    },
    {
      id: "cp-usage",
      text: "대다수 학교가 채택하고서도 실제로는 사용하지 않았다. 실제 사용률은 10%에 못 미쳤다.",
      assertionType: "CLAIM",
      assertedBy: "고민정 국회의원(더불어민주당)",
      verified: true,
      sourceIds: ["khan-2025-08-04"],
    },
  ],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
