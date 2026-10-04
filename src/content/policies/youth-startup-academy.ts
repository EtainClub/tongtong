import type { PolicyInput } from "../schema";

/*
 * 청년창업사관학교 (창업성공패키지) — 정책 항목(사실). 카드 없음.
 *
 * 청사진 창업 경로의 창업 초기 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-2026-10-04.md) 뒤 공개.
 * 공고는 "39세 이하"라고만 적어 만 나이인지 알 수 없다 — planning.age로 옮기지 않는다.
 */
export const youthStartupAcademy = {
  id: "youth-startup-academy",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "startup",
  lifeStages: ["startup"],

  name: "청년창업사관학교",
  summary: "39세 이하 초기 창업 대표자에게 사업화 자금(평균 7천만 원)과 창업공간·교육·코칭을 지원한다.",

  sources: [
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

  claims: [
    {
      id: "who",
      text: "39세 이하이면서 창업한 지 3년 이내인 대표자가 대상이다. 경험창업자는 39세 이하, 창업 7년 이내 대표자까지 신청할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-01-30"],
    },
    {
      id: "support",
      text: "사업화 자금을 평균 7천만 원, 최대 1억 원 지원하고 창업공간·교육·코칭·기술지원 같은 창업 프로그램을 제공한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-01-30"],
    },
    {
      id: "operator",
      text: "중소벤처기업부 소관이고 중소벤처기업진흥공단이 수행한다. K-Startup 누리집에서 온라인으로 신청한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-01-30"],
    },
    {
      id: "period-2026",
      text: "2026년 기본과정 입교생 모집은 1월 30일부터 2월 13일까지였다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-01-30"],
    },
  ],

  policy: {
    history: [],
    applications: [
      { label: "2026년 기본과정", startAt: "2026-01-30", endAt: "2026-02-13", note: "K-Startup 누리집에서 온라인 신청.", sourceIds: ["bizinfo-2026-01-30"] },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4).
  planning: {
    roles: ["startup"],
    stages: ["founder_early"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
