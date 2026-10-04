import type { PathInput } from "../path-schema";

/*
 * 이공계 박사 진학 — 경로 견본 (청사진 설계 9.5).
 *
 * 학부 3학년(0개월) → 석사 입학(24) → 박사 진학(48) → 박사 학위(96)를 가정한다. 석·박사 기간은 학교마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다.
 * 2026-10-04 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const phdStem = {
  id: "phd-stem",
  publishStatus: "published",
  goalKind: "degree",
  title: "이공계 박사 진학 — 학부 3학년부터",
  summary: "학부 등록금부터 석·박사 기간 생활비까지, 박사 학위를 받을 때까지 쓸 수 있는 정책을 순서대로 놓았어요.",
  startStage: "undergrad",

  milestones: [
    { id: "junior", label: "학부 3학년", offsetMonths: 0, stage: "undergrad" },
    { id: "master", label: "석사 입학", offsetMonths: 24, stage: "grad_master" },
    { id: "phd", label: "박사 진학", offsetMonths: 48, stage: "grad_phd" },
    { id: "degree", label: "박사 학위", offsetMonths: 96 },
  ],

  slots: [
    { id: "scholarship", policyId: "national-scholarship", milestoneId: "junior", fromOffset: 0, toOffset: 23, role: "funding", why: "학부 남은 두 해의 등록금 부담을 던다." },
    { id: "loan", policyId: "income-contingent-loan", fromOffset: 0, toOffset: 95, role: "funding", why: "장학금으로 모자라는 등록금을 학부와 대학원 내내 빌릴 수 있다." },
    { id: "exam-fee", policyId: "exam-fee-support", milestoneId: "junior", fromOffset: 6, role: "skill", why: "졸업 전에 전공 관련 기술자격을 따 둔다." },
    { id: "work", policyId: "work-experience", milestoneId: "junior", fromOffset: 12, role: "experiment", why: "석사 지원 전에 연구실 밖 일을 한 번 겪어 본다." },
    { id: "stipend", policyId: "stem-research-stipend", milestoneId: "master", fromOffset: 24, toOffset: 95, role: "funding", why: "참여 대학이면 석·박사 기간 매달 최저 생활비가 보장된다." },
    { id: "bk21", policyId: "bk21-four", milestoneId: "master", fromOffset: 24, toOffset: 47, role: "funding", why: "BK21 교육연구단에 참여하면 연구장학금을 받는다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "master", fromOffset: 24, toOffset: 47, role: "housing", why: "대학원 근처로 옮겨 월세를 낼 때." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "master", fromOffset: 24, toOffset: 59, role: "asset", why: "장려금 일부를 3년 동안 모아 박사 기간 비상금을 만든다." },
  ],

  caveats: [
    {
      id: "bk21-ends",
      text: "4단계 BK21 사업 기간은 2027년 8월까지다. 박사 과정 중간에 끝날 수 있어, 그 뒤 칸은 후속 사업이 생겨야 쓸 수 있다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["nrf-bk21four"],
    },
    {
      id: "stipend-floor",
      text: "연구생활장려금 기준금액은 따로 더 받는 돈이 아니라 R&D 인건비 등과 합친 최저 보장액이고, 참여 대학의 전일제 대학원생만 대상이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-02-11"],
    },
  ],
  sources: [
    {
      id: "nrf-bk21four",
      title: "4단계 두뇌한국21 사업 소개",
      url: "https://bk21four.nrf.re.kr/sub01/sub111/list.do",
      publisher: "한국연구재단",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-2025-02-11",
      title: "이공계 석·박사 '연구생활장려금' 받는다…올해 30개 대학·5만 명",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148939468",
      publisher: "과학기술정보통신부(정책브리핑)",
      publishedAt: "2025-02-11",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PathInput;
