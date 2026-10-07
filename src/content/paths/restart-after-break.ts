import type { PathInput } from "../path-schema";

/*
 * 쉬었던 청년의 다시 시작 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 한동안 일·학업·훈련 없이 쉬던 때(0개월)에 회복 프로그램부터 시작해, 구직 활동(6) → 첫 일자리(15) → 1년 근속(27)을 가정한다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const restartAfterBreak = {
  id: "restart-after-break",
  publishStatus: "published",
  goalKind: "career",
  title: "쉬었던 청년의 다시 시작 — 회복에서 첫 일자리까지",
  summary: "한동안 쉬었다면 자신감 회복 프로그램부터 시작해 구직 활동과 첫 일자리, 일하며 모으는 저축까지 차근차근 놓았어요.",
  startStage: "graduated_unemployed",

  milestones: [
    { id: "restart", label: "다시 시작", offsetMonths: 0, stage: "graduated_unemployed" },
    { id: "job-search", label: "구직 활동 시작", offsetMonths: 6 },
    { id: "job", label: "첫 일자리", offsetMonths: 15, stage: "employed" },
    { id: "one-year", label: "1년 근속", offsetMonths: 27 },
  ],

  slots: [
    { id: "challenge", policyId: "youth-challenge", milestoneId: "restart", fromOffset: 0, toOffset: 5, role: "safety", why: "참여수당을 받으며 자신감을 되찾고 구직 의욕을 다시 세우는 프로그램부터 한다." },
    { id: "employment-support", policyId: "national-employment-support", milestoneId: "job-search", fromOffset: 6, toOffset: 11, role: "safety", why: "구직을 시작하면 상담·훈련 연계와 구직촉진수당으로 이어 간다." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "job-search", fromOffset: 6, toOffset: 14, role: "skill", why: "일할 분야의 훈련을 카드로 듣는다." },
    { id: "work", policyId: "work-experience", milestoneId: "job-search", fromOffset: 8, toOffset: 11, role: "experiment", why: "짧은 인턴·프로젝트로 일하는 감각을 먼저 되찾는다." },
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "job", fromOffset: 15, toOffset: 38, role: "employment", why: "중소기업에 들어가면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "job", fromOffset: 15, role: "living", why: "출퇴근 교통비 일부를 돌려받는다." },
    { id: "savings", policyId: "youth-tomorrow-savings", milestoneId: "job", fromOffset: 15, toOffset: 50, role: "asset", why: "소득이 낮은 가구라면 일하는 동안 매달 정부 지원금이 더해지는 저축을 시작한다." },
  ],

  caveats: [
    {
      id: "challenge-target",
      text: "청년도전지원사업 구직단념청년 유형은 18~34세로, 신청일 전 6개월 이상 취업·교육·훈련 이력이 없고 상담원 문답표 점수가 21점 이상(30점 만점)이어야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "tomorrow-savings-conditions",
      text: "청년내일저축계좌 지원금을 받으려면 저축 기간 동안 일을 계속하고, 금융교육 10시간을 이수하고, 자금사용계획서를 내야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
  ],
  sources: [
    {
      id: "youth-up",
      title: "청년도전지원사업 안내",
      url: "https://youth-up.kr/challenge-info",
      publisher: "고용노동부 청년도전지원사업",
      type: "official",
      license: "link-only",
    },
    {
      id: "mohw-2026-recruit",
      title: "월 10만 원씩 3년 모으면 1,440만 원 받는다 '청년내일저축계좌' 신규 모집",
      url: "https://www.mohw.go.kr/board.es?mid=a10503010100&bid=0027&act=view&list_no=1490402&tag=&nPage=1",
      publisher: "보건복지부",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PathInput;
