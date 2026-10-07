import type { PathInput } from "../path-schema";

/*
 * 직장 다니다 창업 — 경로 견본 (청사진 설계 9.5, goalKind startup).
 *
 * 직장에 다니는 때(0개월) → 퇴사·창업 준비(18) → 사업자 등록(24) → 창업 3년차(60)를 가정한다.
 * 예비창업패키지는 사업자를 먼저 내면 쓸 수 없다 — 퇴사 뒤 사업자 등록 전에 칸을 둔다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목·견본의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const jobToStartup = {
  id: "job-to-startup",
  publishStatus: "published",
  goalKind: "startup",
  title: "직장 다니다 창업 — 퇴사 전후 순서대로",
  summary: "회사에 다니며 실력과 종잣돈을 쌓고, 퇴사 뒤 사업자를 내기 전과 낸 뒤에 쓸 수 있는 정책을 순서대로 놓았어요.",
  startStage: "employed",

  milestones: [
    { id: "employed", label: "직장 다니는 중", offsetMonths: 0, stage: "employed" },
    { id: "pre", label: "퇴사 — 사업자 등록 전", offsetMonths: 18, stage: "founder_pre" },
    { id: "founded", label: "사업자 등록·법인 설립", offsetMonths: 24, stage: "founder_early" },
    { id: "third-year", label: "창업 3년차", offsetMonths: 60 },
  ],

  slots: [
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "employed", fromOffset: 0, toOffset: 17, role: "skill", why: "창업할 분야에 필요한 기술을 회사에 다니며 카드로 배운다." },
    { id: "savings", policyId: "young-future-savings", milestoneId: "employed", fromOffset: 0, toOffset: 17, role: "asset", why: "월급이 있을 때 창업 초기 생활비가 될 돈을 모은다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "employed", fromOffset: 0, toOffset: 17, role: "living", why: "출퇴근 교통비 일부를 돌려받는다." },
    { id: "pre-startup", policyId: "pre-startup-package", milestoneId: "pre", fromOffset: 18, toOffset: 23, role: "startup", why: "사업자를 내기 전에 사업화 자금과 창업 프로그램을 받는다." },
    { id: "academy", policyId: "youth-startup-academy", milestoneId: "founded", fromOffset: 24, toOffset: 35, role: "startup", why: "창업 3년 안에 입교해 자금과 공간·코칭을 받는다." },
    { id: "tax", policyId: "youth-startup-tax-relief", milestoneId: "founded", fromOffset: 24, toOffset: 83, role: "startup", why: "첫 소득이 난 해부터 5년 동안 세금을 줄인다." },
  ],

  caveats: [
    {
      id: "order",
      text: "예비창업패키지는 사업자등록증도 법인 대표권도 없는 사람만 신청할 수 있다. 사업자를 먼저 내면 이 칸은 쓸 수 없다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["bizinfo-2026-03-03"],
    },
    {
      id: "survival",
      text: "2018년에 생긴 기업 가운데 5년 뒤까지 살아남은 곳은 36.4%다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mods-2025-10-23"],
    },
    {
      id: "academy-age",
      text: "청년창업사관학교는 39세 이하이면서 창업한 지 3년 이내인 대표자가 대상이다. 경험창업자는 39세 이하, 창업 7년 이내 대표자까지 신청할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-01-30"],
    },
  ],
  sources: [
    {
      id: "bizinfo-2026-03-03",
      title: "2026년 예비창업패키지 예비창업자 모집 수정 공고 (중소벤처기업부 공고 제2026-143호)",
      url: "https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000119019",
      publisher: "중소벤처기업부(기업마당)",
      publishedAt: "2026-03-03",
      type: "official",
      license: "link-only",
    },
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
      id: "bizinfo-2026-01-30",
      title: "2026년 창업성공패키지(청년창업사관학교) 기본과정 입교생 모집 공고 (제2026-60호)",
      url: "https://bizinfo.go.kr/sii/siia/selectSIIA200Detail.do?pblancId=PBLN_000000000118036",
      publisher: "중소벤처기업부(기업마당)",
      publishedAt: "2026-01-30",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PathInput;
