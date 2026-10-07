import type { PathInput } from "../path-schema";

/*
 * 이공계 석사 → 연구개발 취업 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 학부 4학년(0개월) → 석사 입학(12) → 석사 졸업·구직(36) → 첫 직장(42) → 첫 직장 2년차(66)를 가정한다. 석사 기간은 학교마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목·견본의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const masterToIndustry = {
  id: "master-to-industry",
  publishStatus: "published",
  goalKind: "career",
  title: "이공계 석사 → 연구개발 취업 — 학부 4학년부터",
  summary: "석사 2년 동안의 등록금·생활비를 받치고, 졸업 뒤 구직과 첫 직장의 저축까지 이어지게 놓았어요.",
  startStage: "undergrad",

  milestones: [
    { id: "senior", label: "학부 4학년", offsetMonths: 0, stage: "undergrad" },
    { id: "master", label: "석사 입학", offsetMonths: 12, stage: "grad_master" },
    { id: "graduate", label: "석사 졸업·구직", offsetMonths: 36, stage: "graduated_unemployed" },
    { id: "job", label: "첫 직장", offsetMonths: 42, stage: "employed" },
    { id: "second-year", label: "첫 직장 2년차", offsetMonths: 66 },
  ],

  slots: [
    { id: "scholarship", policyId: "national-scholarship", milestoneId: "senior", fromOffset: 0, toOffset: 11, role: "funding", why: "학부 마지막 해 등록금 부담을 던다." },
    { id: "loan", policyId: "income-contingent-loan", fromOffset: 0, toOffset: 35, role: "funding", why: "장학금으로 모자라는 등록금을 학부와 석사 내내 빌릴 수 있다 — 갚아야 하는 돈이다." },
    { id: "stipend", policyId: "stem-research-stipend", milestoneId: "master", fromOffset: 12, toOffset: 35, role: "funding", why: "참여 대학이면 석사 기간 매달 최저 생활비가 보장된다." },
    { id: "bk21", policyId: "bk21-four", milestoneId: "master", fromOffset: 12, toOffset: 35, role: "funding", why: "BK21 교육연구단에 참여하면 연구장학금을 받는다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "master", fromOffset: 12, toOffset: 35, role: "housing", why: "대학원 근처로 옮겨 월세를 낼 때." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "master", fromOffset: 24, toOffset: 41, role: "skill", why: "졸업이 1년 안으로 들어오면 카드를 받아 산업 실무 훈련을 듣는다." },
    { id: "work", policyId: "work-experience", milestoneId: "graduate", fromOffset: 36, toOffset: 41, role: "experiment", why: "졸업 직후 기업 프로젝트로 연구실 밖 일을 겪어 본다." },
    { id: "employment-support", policyId: "national-employment-support", milestoneId: "graduate", fromOffset: 36, toOffset: 41, role: "safety", why: "구직이 길어지면 상담·훈련 연계와 구직촉진수당으로 버틴다." },
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "job", fromOffset: 42, toOffset: 65, role: "employment", why: "중소·중견 연구소에 들어가면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "job", fromOffset: 42, toOffset: 77, role: "asset", why: "월급이 생기면 3년 동안 모아 종잣돈을 만든다." },
  ],

  caveats: [
    {
      id: "bk21-period",
      text: "4단계 BK21은 세계적 수준의 연구중심대학 육성을 목표로 2020년 9월부터 2027년 8월까지 7년 동안 진행된다.",
      assertionType: "FACT",
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
    {
      id: "learning-card-students",
      text: "졸업까지 남은 수업연한이 2년 이상인 대학·대학원 재학생과 고등학교 1~2학년생은 내일배움카드 발급 대상에서 빠진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
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
    {
      id: "work24-issue",
      title: "국민내일배움카드 발급안내",
      url: "https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do",
      publisher: "고용노동부 (고용24)",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PathInput;
