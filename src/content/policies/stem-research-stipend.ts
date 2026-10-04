import type { PolicyInput } from "../schema";

/*
 * 이공계 연구생활장려금 (한국형 스타이펜드) — 정책 항목(사실). 카드 없음.
 *
 * 청사진 박사 경로의 대학원 생활비 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-2026-10-04.md) 뒤 공개.
 * 기준금액은 "더 주는 돈"이 아니라 최저 보장액이다 — floor claim이 그 차이를 적는다.
 * 2026년 참여 대학 수는 보도 자료다. 정부 원문으로 바꿀 수 있으면 바꾼다.
 */
export const stemResearchStipend = {
  id: "stem-research-stipend",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college"],

  name: "이공계 연구생활장려금",

  sources: [
    {
      id: "korea-2025-02-11",
      title: "이공계 석·박사 '연구생활장려금' 받는다…올해 30개 대학·5만 명",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148939468",
      publisher: "과학기술정보통신부(정책브리핑)",
      publishedAt: "2025-02-11",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-2025-07-01",
      title: "이공계 대학원생 최소생활 보장…'연구생활장려금' 지급 시작",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148945240",
      publisher: "과학기술정보통신부(정책브리핑)",
      publishedAt: "2025-07-01",
      type: "official",
      license: "link-only",
    },
    {
      id: "etoday-2026-09-03",
      title: "석사 월 80만원·박사 110만원 보장…이공계 연구생활장려금 48개 대학 확대",
      url: "https://www.etoday.co.kr/news/view/2621431",
      publisher: "이투데이",
      publishedAt: "2026-09-03",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "base",
      text: "참여 대학의 이공계 대학원생에게 매달 기준금액 이상을 보장한다. 기준금액은 석사과정 월 80만 원, 박사과정 월 110만 원이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-07-01"],
    },
    {
      id: "floor",
      text: "따로 더 주는 돈이 아니다. 산학협력단이 주던 R&D 인건비 같은 학생지원금과 합쳐 최저 지급액을 보장하고, 대학별로 모자라는 만큼을 정부가 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-02-11"],
    },
    {
      id: "who",
      text: "참여 요건을 갖춘 대학에서 연구 활동 중인 이공계 전일제 대학원생이 대상이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-02-11"],
    },
    {
      id: "scale-2026",
      text: "2026년 하반기에 5개 대학이 새로 참여해 참여 대학은 48곳, 대상 대학원생은 약 5만 5천 명이 됐다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["etoday-2026-09-03"],
    },
    {
      id: "period",
      text: "2025년부터 2033년까지 9년간 모두 9,790억 원을 들인다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-07-01"],
    },
  ],

  policy: {
    history: [{ date: "2025-07-01", kind: "introduced", summary: "연구생활장려금 지급 시작", sourceIds: ["korea-2025-07-01"] }],
    applications: [],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 대학 단위 사업이라 개인 신청 회차가 없다.
  // 사업 기간은 "2033년까지"(period) — 달이 적혀 있지 않아 그해 끝(12월)으로 둔다.
  planning: {
    roles: ["funding"],
    stages: ["grad_master", "grad_phd"],
    endsAt: { month: "2033-12", claimIds: ["period"] },
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
