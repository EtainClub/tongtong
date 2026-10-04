import type { PolicyInput } from "../schema";

/*
 * 국가장학금 Ⅰ유형 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 박사 경로의 학부 학비 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-2026-10-04.md) 뒤 공개.
 * 대학원생 대상 여부는 원문에 없어 적지 않았다.
 */
export const nationalScholarship = {
  id: "national-scholarship",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college"],

  name: "국가장학금 Ⅰ유형",
  summary: "소득구간에 따라 대학생 등록금을 지원하는 장학금. 기초·차상위 가구는 등록금 전액, 9구간은 연 100만 원이다.",

  sources: [
    {
      id: "korea-2025-11-20",
      title: "대학 국가장학금 신청 개시…8구간 이하 '셋째 이상'엔 전액 지원",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148955036",
      publisher: "교육부(정책브리핑)",
      publishedAt: "2025-11-20",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "amount",
      text: "2026년 국가장학금 Ⅰ유형은 기초·차상위 가구 대학생에게 등록금 전액을, 1~3구간은 연 600만 원, 4~6구간은 연 440만 원, 7~8구간은 연 360만 원, 9구간은 연 100만 원을 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-11-20"],
    },
    {
      id: "multi-child",
      text: "8구간 이하 다자녀 가구의 셋째 이상 대학생은 등록금 전액을 지원받을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-11-20"],
    },
    {
      id: "who",
      text: "입학 예정자를 포함한 신입생, 재학생, 복학생, 편입생, 재입학생 등 모든 대학생이 신청할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-11-20"],
    },
    {
      id: "rounds",
      text: "한국장학재단 누리집과 앱에서 신청한다. 2026학년도 1학기 1차 신청은 2025년 11월 20일부터 12월 26일까지였다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-11-20"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026학년도 1학기 1차",
        startAt: "2025-11-20T09:00:00+09:00",
        endAt: "2025-12-26T18:00:00+09:00",
        note: "한국장학재단 누리집·앱에서 신청.",
        sourceIds: ["korea-2025-11-20"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 차수별 신청(1차) 근거가 있어 회차로 둔다.
  planning: {
    roles: ["funding"],
    recurrence: { kind: "rounds", note: "차수별 신청 — 2026학년도 1학기 1차", claimIds: ["rounds"] },
    stages: ["undergrad"],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
