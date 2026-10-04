import type { PathInput } from "../path-schema";

/*
 * 졸업 뒤 첫 취업 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 학부 4학년(0개월) → 졸업(6) → 첫 직장(18) → 첫 직장 3년차(54)를 가정한다. 구직 기간은 사람마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다.
 * 2026-10-04 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const jobAfterGraduation = {
  id: "job-after-graduation",
  publishStatus: "published",
  goalKind: "career",
  title: "졸업 뒤 첫 취업 — 학부 4학년부터",
  summary: "졸업 전 역량 쌓기부터 구직 기간의 안전망, 첫 직장 뒤 주거와 저축까지 순서대로 놓았어요.",
  startStage: "undergrad",

  milestones: [
    { id: "senior", label: "학부 4학년", offsetMonths: 0, stage: "undergrad" },
    { id: "graduate", label: "졸업", offsetMonths: 6, stage: "graduated_unemployed" },
    { id: "job", label: "첫 직장", offsetMonths: 18, stage: "employed" },
    { id: "third-year", label: "첫 직장 3년차", offsetMonths: 54 },
  ],

  slots: [
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "senior", fromOffset: 0, toOffset: 17, role: "skill", why: "졸업이 1년 안으로 들어오면 카드를 받아 직무 훈련을 시작할 수 있다." },
    { id: "exam-fee", policyId: "exam-fee-support", milestoneId: "senior", fromOffset: 0, toOffset: 17, role: "skill", why: "지원 직무에 필요한 기술자격을 졸업 전후로 따 둔다." },
    { id: "work", policyId: "work-experience", milestoneId: "graduate", fromOffset: 6, toOffset: 11, role: "experiment", why: "졸업 직후 인턴·프로젝트로 일을 한 번 겪어 보고 지원서에 쓸 경험을 만든다." },
    { id: "employment-support", policyId: "national-employment-support", milestoneId: "graduate", fromOffset: 6, toOffset: 17, role: "safety", why: "구직이 길어지면 상담·훈련 연계와 구직촉진수당으로 공백기를 버틴다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "graduate", fromOffset: 6, toOffset: 29, role: "housing", why: "구직이나 첫 직장 때문에 따로 나와 월세를 낼 때." },
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "job", fromOffset: 18, toOffset: 41, role: "employment", why: "중소기업에 들어가면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "job", fromOffset: 18, role: "living", why: "출퇴근 교통비 일부를 돌려받는다." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "job", fromOffset: 18, toOffset: 53, role: "asset", why: "월급이 생기면 3년 동안 모아 다음 집 보증금의 종잣돈을 만든다." },
    { id: "jeonse", policyId: "youth-jeonse-loan", milestoneId: "job", fromOffset: 30, toOffset: 54, role: "housing", why: "재직 1년이 넘으면 월세에서 전세로 옮길 보증금을 빌린다 — 갚아야 하는 돈이다." },
  ],

  caveats: [
    {
      id: "learning-card-students",
      text: "내일배움카드는 졸업까지 남은 수업연한이 2년 이상인 재학생은 받을 수 없다. 그래서 이 견본은 졸업 1년 전부터 칸을 둔다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "jeonse-new-hire",
      text: "청년 버팀목 전세대출은 재직 1년 미만이면 한도가 2천만 원 이하로 제한될 수 있어, 이 견본은 첫 직장 1년 뒤에 칸을 둔다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "jeonse-duplicate",
      text: "청년 버팀목 전세대출은 다른 전세자금대출이나 주택담보대출을 이미 쓰고 있으면 받을 수 없다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
  ],
  sources: [
    {
      id: "work24-issue",
      title: "국민내일배움카드 발급안내",
      url: "https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do",
      publisher: "고용노동부 (고용24)",
      type: "official",
      license: "link-only",
    },
    {
      id: "nhuf",
      title: "청년전용 버팀목전세자금 (상품안내)",
      url: "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp",
      publisher: "국토교통부 주택도시기금",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-04", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PathInput;
