import type { PathInput } from "../path-schema";

/*
 * 재학 중 창업 실험 → 졸업 후 창업 — 경로 견본 (청사진 설계 9.5).
 *
 * 학부 2학년(0개월)에 작게 시험해 보고, 졸업 즈음(24) 사업자 등록 전에 예비창업 지원을, 사업자를 낸 뒤(30)
 * 초기 창업 지원을 받는 순서를 가정한다. 예비창업패키지는 사업자를 먼저 내면 쓸 수 없다 — 순서가 중요하다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다.
 * 2026-10-04 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const startupInCollege = {
  id: "startup-in-college",
  publishStatus: "published",
  goalKind: "startup",
  title: "재학 중 창업 실험 → 졸업 후 창업",
  summary: "학교에 다니며 작게 시험해 보고, 사업자를 내기 전과 낸 뒤에 쓸 수 있는 정책을 순서대로 놓았어요.",
  startStage: "undergrad",

  milestones: [
    { id: "sophomore", label: "학부 2학년", offsetMonths: 0, stage: "undergrad" },
    { id: "pre", label: "졸업 즈음 — 사업자 등록 전", offsetMonths: 24, stage: "founder_pre" },
    { id: "founded", label: "사업자 등록·법인 설립", offsetMonths: 30, stage: "founder_early" },
    { id: "third-year", label: "창업 3년차", offsetMonths: 66 },
  ],

  slots: [
    { id: "teams", policyId: "student-startup-teams", milestoneId: "sophomore", fromOffset: 0, toOffset: 11, role: "experiment", why: "팀을 꾸려 아이디어를 작게 시험하고 멘토를 만난다." },
    { id: "work", policyId: "work-experience", milestoneId: "sophomore", fromOffset: 6, role: "experiment", why: "만들고 싶은 분야의 회사에서 일을 먼저 겪어 본다." },
    { id: "rent", policyId: "youth-monthly-rent", fromOffset: 0, toOffset: 23, role: "housing", why: "자취하며 준비하는 동안 월세 부담을 던다." },
    { id: "transit", policyId: "everyone-transit-card", fromOffset: 0, toOffset: 29, role: "living", why: "학교·작업 공간을 오가는 교통비를 돌려받는다." },
    { id: "pre-startup", policyId: "pre-startup-package", milestoneId: "pre", fromOffset: 24, toOffset: 29, role: "startup", why: "사업자를 내기 전에 사업화 자금과 창업 프로그램을 받는다." },
    { id: "academy", policyId: "youth-startup-academy", milestoneId: "founded", fromOffset: 30, toOffset: 41, role: "startup", why: "창업 3년 안에 입교해 자금과 공간·코칭을 받는다." },
    { id: "tax", policyId: "youth-startup-tax-relief", milestoneId: "founded", fromOffset: 30, toOffset: 89, role: "startup", why: "첫 소득이 난 해부터 5년 동안 세금을 줄인다." },
  ],

  caveats: [
    {
      id: "survival",
      text: "2018년에 생긴 기업 가운데 5년 뒤까지 살아남은 곳은 36.4%다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mods-2025-10-23"],
    },
    {
      id: "order",
      text: "예비창업패키지는 사업자등록증도 법인 대표권도 없는 사람만 신청할 수 있다. 사업자를 먼저 내면 이 칸은 쓸 수 없다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["bizinfo-2026-03-03"],
    },
  ],
  sources: [
    {
      id: "mods-2025-10-23",
      title: "2024년 기업생멸행정통계(잠정) 결과",
      url: "https://mods.go.kr/board.es?mid=a10301010000&bid=11469&act=view&list_no=438913",
      publisher: "국가데이터처",
      publishedAt: "2025-10-23",
      type: "statistics",
      license: "link-only",
    },
    {
      id: "bizinfo-2026-03-03",
      title: "2026년 예비창업패키지 예비창업자 모집 수정 공고 (중소벤처기업부 공고 제2026-143호)",
      url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000119019",
      publisher: "중소벤처기업부(기업마당)",
      publishedAt: "2026-03-03",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PathInput;
