import type { PolicyInput } from "../schema";

/*
 * 주거안정장학금 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 자취하는 대학생 경로의 주거 칸 (청사진 설계 9.3). 2026-10-08 작성 — 원문 대조 기록은 docs/source-check-2026-10-08.md.
 * verified는 편집자가 원문을 직접 확인한 뒤 바꾼다. 그때까지 초안이다.
 */
export const housingStabilityScholarship = {
  id: "housing-stability-scholarship",
  publishStatus: "draft",

  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["college", "living_alone", "housing"],

  name: "주거안정장학금",
  summary: "부모님과 다른 교통권의 대학에 다니는 기초·차상위 대학생에게 월세·관리비 같은 주거비를 학기 중 월 최대 20만 원까지 실비로 준다.",

  sources: [
    {
      id: "korea-2025-11-24",
      title: "우리에겐 주거안정 장학금이 있습니다",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148955106",
      publisher: "교육부 (대한민국 정책브리핑)",
      publishedAt: "2025-11-24",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-2025-02-04",
      title: "'주거안정장학금' 첫 시행…대학생에 월 최대 20만 원 지원",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148939202",
      publisher: "교육부 (대한민국 정책브리핑)",
      publishedAt: "2025-02-04",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "who",
      text: "원거리 대학에 진학한 기초생활수급자·차상위계층 대학생이 대상이고, 만 39세 이하 미혼이어야 한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-11-24"],
    },
    {
      id: "distance",
      text: "원거리는 대학 소재지를 기준으로 부모님 주소지가 다른 교통권에 있는 경우다. 서울 캠퍼스와 경기 성남처럼 같은 수도권이면 원거리로 보지 않는다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-11-24", "korea-2025-02-04"],
    },
    {
      id: "amount",
      text: "학기 중 월 최대 20만 원, 연간 최대 240만 원을 지원한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-11-24"],
    },
    {
      id: "actual-cost",
      text: "학생이 낸 지급 요청서를 검토해 월 한도 안에서 실제로 쓴 비용(실비)을 준다. 임차료·보증금·기숙사비, 주택임차 대출 이자, 수선유지비, 수도·전기·관리비 등이 인정된다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-11-24"],
    },
    {
      id: "since",
      text: "2025학년도에 처음 시행됐다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-02-04"],
    },
    {
      id: "apply",
      text: "한국장학재단 누리집이나 모바일 앱에서 학생 본인이 직접 신청해야 한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-2025-11-24"],
    },
  ],

  policy: {
    history: [],
    applications: [],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 학기 중 지원 — 대학생 단계만.
  planning: {
    roles: ["housing"],
    age: { max: 39, claimIds: ["who"] },
    stages: ["undergrad"],
  },

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PolicyInput;
