import type { PolicyInput } from "../schema";

/*
 * 예비창업패키지 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 창업 경로의 법인 설립 전 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-2026-10-04.md) 뒤 공개.
 * 사업화 자금 금액은 출처마다 달라(최대 1억 원 / 약 4천만 원) 적지 않았다 — 공고문 첨부를 열어 확인한 뒤 claim으로 더한다.
 */
export const preStartupPackage = {
  id: "pre-startup-package",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "startup",
  lifeStages: ["startup"],

  name: "예비창업패키지",

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
  ],

  claims: [
    {
      id: "who",
      text: "신청자 이름의 사업자등록증이 없고 법인의 법률상 대표권도 없는 예비창업자가 신청할 수 있다. 2026년 공고의 기준일은 1월 22일이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-03-03"],
    },
    {
      id: "support",
      text: "사업화 자금과 창업 프로그램을 지원한다. 중소벤처기업부 소관이고 창업진흥원이 수행한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-03-03"],
    },
    {
      id: "period-2026",
      text: "2026년 모집 접수는 3월 6일부터 3월 24일까지였다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bizinfo-2026-03-03"],
    },
  ],

  policy: {
    history: [],
    applications: [
      { label: "2026년", startAt: "2026-03-06", endAt: "2026-03-24", note: "K-Startup 누리집에서 온라인 신청.", sourceIds: ["bizinfo-2026-03-03"] },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 나이 조건은 원문에 없다.
  planning: {
    roles: ["startup"],
    stages: ["founder_pre"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
