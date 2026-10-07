import type { PathInput } from "../path-schema";

/*
 * 첫 직장에서 내 집 준비까지 — 경로 견본 (청사진 설계 9.3, goalKind career).
 *
 * 첫 직장 입사(0개월) → 근속 1년(12) → 전세로 옮기기(24) → 근속 5년(60)을 가정한다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const firstJobHome = {
  id: "first-job-home",
  publishStatus: "published",
  goalKind: "career",
  title: "첫 직장에서 내 집 준비까지",
  summary: "막 입사했다면 월세 지원과 저축으로 시작해 전세로 옮기고 청약을 준비하는 순서로 놓았어요.",
  startStage: "employed",

  milestones: [
    { id: "hired", label: "첫 직장 입사", offsetMonths: 0, stage: "employed" },
    { id: "one-year", label: "근속 1년", offsetMonths: 12 },
    { id: "jeonse", label: "전세로 옮기기", offsetMonths: 24 },
    { id: "five-years", label: "근속 5년", offsetMonths: 60 },
  ],

  slots: [
    { id: "job-leap", policyId: "youth-job-leap", milestoneId: "hired", fromOffset: 0, toOffset: 23, role: "employment", why: "중소기업에 들어갔다면 회사가 장려금을 받고, 비수도권이면 본인도 근속 인센티브를 받는다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "hired", fromOffset: 0, role: "living", why: "출퇴근 교통비 일부를 돌려받는다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "hired", fromOffset: 0, toOffset: 23, role: "housing", why: "전세 보증금을 모으는 동안 월세 부담을 던다." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "hired", fromOffset: 0, toOffset: 35, role: "asset", why: "월급의 일부를 3년 동안 모아 보증금의 종잣돈을 만든다." },
    { id: "dream-account", policyId: "youth-housing-dream-account", milestoneId: "hired", fromOffset: 0, toOffset: 71, role: "asset", why: "입사하자마자 청약통장을 열어 무주택 기간과 납입 기록을 쌓는다." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "one-year", fromOffset: 12, toOffset: 59, role: "skill", why: "일에 익숙해지면 다음 경력을 위한 훈련을 카드로 듣는다." },
    { id: "jeonse-loan", policyId: "youth-jeonse-loan", milestoneId: "jeonse", fromOffset: 24, toOffset: 71, role: "housing", why: "재직 1년이 넘으면 월세에서 전세로 옮길 보증금을 빌린다 — 갚아야 하는 돈이다." },
  ],

  caveats: [
    {
      id: "dream-account-income",
      text: "청년주택드림청약통장은 연소득 5천만 원 이하의 근로·사업·기타소득자로, 소득세 신고·납부 등이 증빙돼야 가입할 수 있다. 무주택자만 가입할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf-product"],
    },
    {
      id: "jeonse-no-duplicate",
      text: "청년 버팀목 전세대출은 주택도시기금 대출, 은행 전세자금대출, 주택담보대출을 이미 이용 중이면 받을 수 없고, 공공임대주택에 살고 있으면 원칙적으로 받을 수 없다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "jeonse-new-hire",
      text: "청년 버팀목 전세대출은 재직 1년 미만이면 대출한도가 2천만 원 이하로 제한될 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
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
      id: "nhuf",
      title: "청년전용 버팀목전세자금 (상품안내)",
      url: "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp",
      publisher: "국토교통부 주택도시기금",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PathInput;
