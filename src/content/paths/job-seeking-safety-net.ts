import type { PathInput } from "../path-schema";

/*
 * 졸업 뒤 구직 1년 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 이미 졸업하고 구직을 시작한 때(0개월)부터 첫 직장(12) → 첫 직장 2년차(24)를 가정한다. 구직 기간은 사람마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const jobSeekingSafetyNet = {
  id: "job-seeking-safety-net",
  publishStatus: "published",
  goalKind: "career",
  title: "졸업 뒤 구직 1년 — 안전망부터",
  summary: "이미 졸업해 구직 중이라면, 수당·훈련·일경험으로 공백기를 버티고 첫 직장 뒤 저축까지 이어지게 놓았어요.",
  startStage: "graduated_unemployed",

  milestones: [
    { id: "start", label: "구직 시작", offsetMonths: 0, stage: "graduated_unemployed" },
    { id: "job", label: "첫 직장", offsetMonths: 12, stage: "employed" },
    { id: "second-year", label: "첫 직장 2년차", offsetMonths: 24 },
  ],

  slots: [
    { id: "employment-support", policyId: "national-employment-support", milestoneId: "start", fromOffset: 0, toOffset: 5, role: "safety", why: "구직을 시작하자마자 상담·훈련 연계와 구직촉진수당으로 생활을 받친다." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "start", fromOffset: 0, toOffset: 11, role: "skill", why: "지원할 직무에 맞는 훈련을 카드로 듣는다." },
    { id: "exam-fee", policyId: "exam-fee-support", milestoneId: "start", fromOffset: 0, toOffset: 11, role: "skill", why: "직무에 필요한 기술자격 응시료를 줄인다." },
    { id: "work", policyId: "work-experience", milestoneId: "start", fromOffset: 3, toOffset: 8, role: "experiment", why: "인턴·프로젝트로 지원서에 쓸 경험을 만든다." },
    { id: "rent", policyId: "youth-monthly-rent", fromOffset: 0, toOffset: 23, role: "housing", why: "구직이나 첫 직장 때문에 따로 나와 월세를 낼 때." },
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "job", fromOffset: 12, toOffset: 35, role: "employment", why: "중소기업에 들어가면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "job", fromOffset: 12, role: "living", why: "출퇴근 교통비 일부를 돌려받는다." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "job", fromOffset: 12, toOffset: 47, role: "asset", why: "월급이 생기면 3년 동안 모아 종잣돈을 만든다." },
  ],

  caveats: [
    {
      id: "employment-support-type1",
      text: "국민취업지원제도 Ⅰ유형(요건심사형)은 15~69세 구직자 중 중위소득 60% 이하, 재산 4억 원 이하(15~34세 청년은 5억 원 이하)이면서 최근 2년 안에 100일 또는 800시간 이상 일한 경험이 있는 사람이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "learning-card-copay",
      text: "내일배움카드 훈련은 훈련과정 직종의 평균 취업률, 근로장려금 수급 여부, 국민취업지원제도 참여 유형 등에 따라 정부승인 훈련비의 0~55%를 본인이 낸다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
  ],
  sources: [
    {
      id: "gov24",
      title: "국민취업지원제도 (정부24 서비스 상세)",
      url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/149200005007",
      publisher: "고용노동부 (정부24)",
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
