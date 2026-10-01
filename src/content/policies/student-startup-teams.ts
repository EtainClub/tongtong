import type { PolicyInput } from "../schema";

/*
 * 학생 창업유망팀 300+ — 정책 항목(사실). 카드 없음.
 *
 * 청사진 창업 경로의 재학 중 창업 실험 칸 (청사진 설계 9.3). 초안 — claim은 원문 대조 전이다.
 * 출처가 보도 하나다 — 교육부 보도자료나 u300 누리집 공고로 바꿀 수 있으면 바꾼다.
 * 현금 지원은 원문에 없다. 지원은 교육·멘토링·네트워킹·투자 연계다.
 */
export const studentStartupTeams = {
  id: "student-startup-teams",
  publishStatus: "draft",

  audience: ["youth", "young_adult"],
  category: "startup",
  lifeStages: ["college", "startup"],

  name: "학생 창업유망팀 300+",

  sources: [
    {
      id: "newsis-2026-04-08",
      title: "멘토링에 시드투자 연계까지…학생 창업가 400팀 키운다",
      url: "https://www.newsis.com/view/NISX20260407_0003581433",
      publisher: "뉴시스",
      publishedAt: "2026-04-08",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "scale",
      text: "교육부와 한국청년기업가정신재단이 2026년 학생 창업유망팀 400팀(성장트랙 360팀, 도약트랙 40팀)을 뽑는다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["newsis-2026-04-08"],
    },
    {
      id: "who",
      text: "전국 초·중·고·대학(원)생과 학교 밖 청소년이 신청할 수 있다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["newsis-2026-04-08"],
    },
    {
      id: "support",
      text: "창업교육과 일대일 멘토링, 분야별·지역별 네트워킹을 지원하고, 우수팀에는 시드투자 연계와 국제 신기술 박람회 참여 기회를 준다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["newsis-2026-04-08"],
    },
    {
      id: "period-2026",
      text: "2026년 접수는 4월 8일부터 27일까지 공식 누리집에서 받았다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["newsis-2026-04-08"],
    },
  ],

  policy: {
    history: [],
    applications: [
      { label: "2026년", startAt: "2026-04-08", endAt: "2026-04-27", note: "공식 누리집에서 온라인 신청.", sourceIds: ["newsis-2026-04-08"] },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4).
  planning: {
    roles: ["experiment"],
    stages: ["undergrad", "grad_master", "grad_phd"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
