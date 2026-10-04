import type { PolicyInput } from "../schema";

/*
 * 취업 후 상환 학자금대출 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 박사 경로의 학비 칸 — 학부와 대학원 모두 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-2026-10-04.md) 뒤 공개.
 * 나이 상한이 학부(만 35세)와 대학원(만 40세)에서 달라 planning.age 하나로 옮기지 않는다.
 * 생활비 대출 한도·금리·상환기준소득은 원문 페이지에 숫자가 없어 적지 않았다.
 */
export const incomeContingentLoan = {
  id: "income-contingent-loan",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college"],

  name: "취업 후 상환 학자금대출",

  sources: [
    {
      id: "kosaf-icl",
      title: "취업 후 상환 학자금대출",
      url: "https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01&ttab1=1",
      publisher: "한국장학재단",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "undergrad",
      text: "학부생은 대출 신청일 기준 만 35세 이하이고 직전 학기에 12학점 이상 이수해야 한다. 등록금 대출은 소득구간과 관계없고, 생활비 대출은 학자금 지원구간 8구간 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["kosaf-icl"],
    },
    {
      id: "grad",
      text: "대학원생은 대출 신청일 기준 만 40세 이하여야 한다. 등록금 대출은 소득구간과 관계없고, 생활비 대출은 학자금 지원구간 6구간 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["kosaf-icl"],
    },
    {
      id: "repay",
      text: "등록금과 생활비를 빌려주고, 취업 등으로 소득이 생긴 때부터 소득 수준에 따라 원금과 이자를 갚는 대출이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["kosaf-icl"],
    },
    {
      id: "period-2026-2",
      text: "2026학년도 2학기 신청은 2026년 7월 1일 오전 9시부터 11월 17일 오후 6시까지다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["kosaf-icl"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026학년도 2학기",
        startAt: "2026-07-01T09:00:00+09:00",
        endAt: "2026-11-17T18:00:00+09:00",
        url: "https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01&ttab1=1",
        note: "한국장학재단에서 신청.",
        sourceIds: ["kosaf-icl"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 빌리는 돈이다(repay) — 화면이 "갚아야 해요"를 붙인다.
  planning: {
    roles: ["funding"],
    stages: ["undergrad", "grad_master", "grad_phd"],
    repayable: { claimIds: ["repay"] },
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
