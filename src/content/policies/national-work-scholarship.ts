import type { PolicyInput } from "../schema";

/*
 * 국가근로장학금 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 대학생 경로의 생활비 칸 (청사진 설계 9.3). 2026-10-08 작성 — 원문 대조 기록은 docs/source-check-2026-10-08.md.
 * 지원구간·성적 기준은 한국장학재단 원문을 열지 못해 2024년 정책브리핑 기사에 기댄다 — 편집자가 재단 원문으로 확인할 것.
 * verified는 편집자가 원문을 직접 확인한 뒤 바꾼다. 그때까지 초안이다.
 */
export const nationalWorkScholarship = {
  id: "national-work-scholarship",
  publishStatus: "draft",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college"],

  name: "국가근로장학금",
  summary: "대학생이 교내·교외 기관에서 일하고 시간당 장학금을 받는다. 소득구간이 낮을수록 먼저 뽑힌다.",

  sources: [
    {
      id: "kosaf-faq",
      title: "국가근로장학금 FAQ",
      url: "https://www.kosaf.go.kr/ko/scholarnf.do?pg=scholarship05_04_09p",
      publisher: "한국장학재단",
      type: "official",
      license: "link-only",
    },
    {
      id: "kosaf-selection",
      title: "국가근로장학금 선발기준",
      url: "https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_04_04",
      publisher: "한국장학재단",
      type: "official",
      license: "link-only",
    },
    {
      id: "kosaf-schedule",
      title: "국가근로장학금 (신청 일정)",
      url: "https://www.kosaf.go.kr/ko/scholar.do?pg=scholarship05_04_01&ttab1=5",
      publisher: "한국장학재단",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-reporter-2024-08-16",
      title: "돈도 벌고, 경험도 쌓고! 국가근로장학금 신청해요.",
      url: "https://www.korea.kr/news/reporterView.do?newsId=148932480",
      publisher: "대한민국 정책브리핑 정책기자단",
      publishedAt: "2024-08-16",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "who",
      text: "학자금 지원 9구간 이하이고 직전 학기 성적이 C0(100점 만점에 70점) 수준 이상인 대학 재학생이 신청할 수 있다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["korea-reporter-2024-08-16"],
    },
    {
      id: "wage-2026",
      text: "2026년 1학기 기준 시급은 교내근로 10,320원, 교외근로 12,790원이다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["kosaf-faq"],
    },
    {
      id: "hours",
      text: "하루 최대 8시간, 학기 중에는 월 최대 80시간, 방학 중에는 주 최대 40시간까지 일할 수 있다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["kosaf-faq"],
    },
    {
      id: "every-semester",
      text: "학기별로 운영되므로 매 학기 새로 신청해야 한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["kosaf-faq"],
    },
    {
      id: "priority",
      text: "학적·성적·소득 요건을 갖춘 학생 가운데 대학이 자체 기준으로 대학별 배정 예산 안에서 뽑는다. 소득 4구간 이하(기초생활수급자·차상위 포함)가 1순위, 5~6구간이 2순위, 7~8구간이 3순위다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["kosaf-selection"],
    },
    {
      id: "rounds-2026-2",
      text: "2026년 2학기 1차 신청은 2026년 5월 22일부터 6월 22일까지였다. 2차 신청과 추가 신청기간을 둘지는 대학마다 다르다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["kosaf-schedule"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년 2학기 1차",
        startAt: "2026-05-22T09:00:00+09:00",
        endAt: "2026-06-22T18:00:00+09:00",
        note: "한국장학재단 누리집·앱에서 신청. 매 학기 새로 신청한다.",
        sourceIds: ["kosaf-schedule"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 학기마다 차수별로 신청한다.
  planning: {
    roles: ["funding"],
    recurrence: { kind: "rounds", note: "학기별·차수별 신청", claimIds: ["every-semester", "rounds-2026-2"] },
    stages: ["undergrad"],
  },

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PolicyInput;
