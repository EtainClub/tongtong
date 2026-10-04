import type { PolicyInput } from "../schema";

/*
 * 01. 청년미래적금 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/young-future-savings.ts에 있다 (청사진 설계 2장).
 */
export const youngFutureSavings = {
  id: "young-future-savings",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "asset",
  lifeStages: ["college", "job_seeking", "employed", "asset_building"],

  name: "청년미래적금",
  summary: "청년이 3년간 매달 최대 50만 원을 넣으면 정부가 납입액의 일정 비율을 더해 주는 적금. 이자는 비과세다.",

  sources: [
    {
      id: "fsc-2026-09-16",
      title: "10월 7일부터 청년미래적금 2차 가입 신청을 받습니다.",
      url: "https://fsc.go.kr/no010101/87726",
      publisher: "금융위원회",
      publishedAt: "2026-09-16",
      type: "official",
      license: "link-only",
    },
    {
      id: "seoul-2026-09-29",
      title: "청년미래적금, 12%는 10만원도 채 못 넣는다…“저소득 지원 강화해야”",
      url: "https://www.seoul.co.kr/news/economy/2026/09/29/20260929500258",
      publisher: "서울신문 (금융위원회·서민금융진흥원 자료 인용)",
      publishedAt: "2026-09-29",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "age",
      text: "만 19~34세 청년이 가입할 수 있다. 이번 2차 모집은 1991년 11월 17일생부터 2007년 11월 27일생까지다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
    {
      id: "income",
      text: "총급여 7,500만 원 이하 소득자 또는 연매출 3억 원 이하 소상공인이면서, 가구 중위소득 200% 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
    {
      id: "deposit",
      text: "3년간 매월 최소 1천 원에서 최대 50만 원까지 자유롭게 넣을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
    {
      id: "match-rate",
      text: "정부가 가입자 납입액의 일정 비율을 기여금으로 더한다. 2026년 2차 모집의 기여율은 일반형 6%, 우대형 12%다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
    {
      id: "tax-free",
      text: "이자소득에는 세금을 매기지 않는다(비과세).",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
    {
      id: "calc-36m",
      text: "월 50만 원을 36개월 넣으면 원금은 1,800만 원이고, 정부 기여금은 일반형 108만 원·우대형 216만 원이다. 이자는 뺀 통통의 계산이다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["fsc-2026-09-16"],
    },
  ],

  // 비판·한계. 수치는 보도가 인용한 공공기관 자료, 제안은 발언자를 밝힌다.
  counterpoints: [
    {
      id: "cp-low-deposit",
      text: "8월 말 기준 가입자 138만 5천 명 가운데 한 달에 10만 원 이하로 넣는 사람이 16만 9천 명(12.2%)이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["seoul-2026-09-29"],
    },
    {
      id: "cp-dropout",
      text: "앞선 청년도약계좌에서는 월 10만 원 이하 납입자의 중도해지율이 48%로, 월 70만 원 납입자(11.1%)보다 크게 높았다. 중도에 해지하면 정부 기여금 혜택을 받지 못한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["seoul-2026-09-29"],
    },
    {
      id: "cp-low-income-rate",
      text: "소득이 낮은 청년에게는 저축액에 정부가 보태는 비율을 더 높일 필요가 있다.",
      assertionType: "CLAIM",
      verified: true,
      assertedBy: "김대성 국회입법조사처 입법조사관",
      sourceIds: ["seoul-2026-09-29"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년 2차",
        startAt: "2026-10-07",
        endAt: "2026-10-16",
        note: "10/7은 출생연도 끝자리 홀수, 10/8은 짝수, 10/12~16은 누구나. 심사 10/19~11/13, 계좌 개설 11/16~27.",
        sourceIds: ["fsc-2026-09-16"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 값마다 근거 claim을 적는다.
  planning: {
    roles: ["asset"],
    age: { min: 19, max: 34, claimIds: ["age"] },
    durationMonths: { value: 36, claimIds: ["deposit"] },
    recurrence: { kind: "rounds", note: "회차별 모집 — 2026년 2차", claimIds: ["age"] },
  },

  // 잼통이 이 정책의 출시·신청 경과를 다룬다 (2026-10-04 페이지 확인). 통통은 복제하지 않고 보낸다.
  links: { jamtong: { title: "청년미래적금 — 출시와 모집 경과", url: "https://jamtong.kr/achievement/youth-future-savings" } },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
