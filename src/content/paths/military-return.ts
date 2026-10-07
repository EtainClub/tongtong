import type { PathInput } from "../path-schema";

/*
 * 군 복무 뒤 복학 → 졸업·취업 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 군 복무 중(0개월) → 전역·복학(12) → 졸업(36) → 첫 직장(45) → 첫 직장 2년차(69)를 가정한다. 복무·학기 기간은 사람마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const militaryReturn = {
  id: "military-return",
  publishStatus: "published",
  goalKind: "career",
  title: "군 복무 뒤 복학 → 졸업·취업",
  summary: "복무 중에 자격을 준비하고, 복학 뒤 등록금·월세를 받치고, 졸업 뒤 구직과 첫 직장의 청약까지 이어지게 놓았어요.",
  startStage: "military",

  milestones: [
    { id: "service", label: "군 복무 중", offsetMonths: 0, stage: "military" },
    { id: "return", label: "전역·복학", offsetMonths: 12, stage: "undergrad" },
    { id: "graduate", label: "졸업", offsetMonths: 36, stage: "graduated_unemployed" },
    { id: "job", label: "첫 직장", offsetMonths: 45, stage: "employed" },
    { id: "second-year", label: "첫 직장 2년차", offsetMonths: 69 },
  ],

  slots: [
    { id: "exam-fee", policyId: "exam-fee-support", milestoneId: "service", fromOffset: 0, toOffset: 11, role: "skill", why: "복무 중 시간을 내 기술자격을 따 둔다." },
    { id: "scholarship", policyId: "national-scholarship", milestoneId: "return", fromOffset: 12, toOffset: 35, role: "funding", why: "복학생도 신청할 수 있다 — 남은 학기 등록금 부담을 던다." },
    { id: "loan", policyId: "income-contingent-loan", milestoneId: "return", fromOffset: 12, toOffset: 35, role: "funding", why: "장학금으로 모자라는 등록금을 빌릴 수 있다 — 갚아야 하는 돈이다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "return", fromOffset: 12, toOffset: 35, role: "housing", why: "복학하며 자취를 시작하면 월세 부담을 던다." },
    { id: "work", policyId: "work-experience", milestoneId: "return", fromOffset: 24, toOffset: 35, role: "experiment", why: "졸업 전 방학에 인턴·프로젝트로 일을 겪어 본다." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "return", fromOffset: 24, toOffset: 44, role: "skill", why: "졸업이 1년 안으로 들어오면 카드를 받아 직무 훈련을 시작한다." },
    { id: "employment-support", policyId: "national-employment-support", milestoneId: "graduate", fromOffset: 36, toOffset: 44, role: "safety", why: "구직이 길어지면 상담·훈련 연계와 구직촉진수당으로 버틴다." },
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "job", fromOffset: 45, toOffset: 68, role: "employment", why: "중소기업에 들어가면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "dream-account", policyId: "youth-housing-dream-account", milestoneId: "job", fromOffset: 45, toOffset: 80, role: "asset", why: "소득이 생기면 청약통장을 열어 내 집 준비를 시작한다." },
  ],

  caveats: [
    {
      id: "dream-account-military",
      text: "청년주택드림청약통장은 만 19세 이상 34세 이하가 가입할 수 있고, 병역 기간은 최대 6년까지 인정된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
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
      id: "nhuf-product",
      title: "청년 주택드림 청약통장 상품안내",
      url: "https://nhuf.molit.go.kr/FP/FP07/FP0701/FP07010301.jsp",
      publisher: "주택도시기금 (국토교통부)",
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
