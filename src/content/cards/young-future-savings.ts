import type { CardInput } from "../schema";

/*
 * 01. 청년미래적금
 *
 * 원 컨셉의 게임(4지선다)은 정답이 숏츠 문장과 같아 읽기만 하면 맞혔다.
 * 금액 맞히기로 바꿨다 — "6~12%"라는 비율이 3년 뒤 실제 얼마인지가 이 카드의 반전이다.
 *
 * 원문에 없어서 비워 둔 것:
 *   - 우대형(12%) 적용 조건 → AI 질문 "6%와 12%는 누구에게?"에 답할 수 없다. 자료를 찾아 claim으로 추가할 것
 *   - 1차 모집·제도 도입 날짜 → policy.history
 */
export const youngFutureSavings = {
  id: "young-future-savings",
  publishStatus: "published",
  audience: ["young_adult"],
  category: "asset",
  lifeStages: ["college", "job_seeking", "employed", "asset_building"],

  shortTitle: "청년미래적금",
  hook: "매달 50만 원씩 3년. 정부가 돈을 더 얹어준다고?",
  shorts: [
    "청년이 매달 최대 50만 원을 저축하면",
    "정부가 납입액의 일정 비율을 더 넣어주는 적금이 있습니다.",
    "기간은 3년.",
    "정부 기여금에 이자소득 비과세까지.",
    "그런데 누구나 같은 금액을 받는 건 아닙니다.",
    "나는 얼마나 받을 수 있을까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "government-match", label: "정부 기여금이 도움이 된다" }, // match-rate, calc-36m
    { id: "tax-free", label: "비과세 혜택이 크다" }, // tax-free
    { id: "small-deposit", label: "적게 넣으면 받는 돈도 적다" }, // cp-low-deposit
    { id: "hard-to-keep", label: "3년 동안 유지하기 어렵다" }, // cp-dropout
    { id: "low-income-rate", label: "소득이 낮은 청년에게 더 보태야 한다" }, // cp-low-income-rate
  ],

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

  game: {
    type: "guess_amount",
    question: "3년 동안 정부가 얹어주는 돈은 모두 얼마일까?",
    premise: "매달 50만 원 × 36개월 = 원금 1,800만 원. 이자는 빼고 계산합니다.",
    min: 0,
    max: 5_000_000,
    step: 100_000,
    answers: [
      { label: "일반형 6%", value: 1_080_000 },
      { label: "우대형 12%", value: 2_160_000 },
    ],
    claimIds: ["match-rate", "calc-36m"],
  },

  reveal: { claimIds: ["match-rate", "calc-36m", "deposit", "age", "income"] },

  suggestedQuestions: [
    "나는 가입할 수 있어?",
    "6%와 12%는 누구에게 적용돼?",
    "청년도약계좌와 뭐가 달라?",
    "3년 동안 실제 얼마를 모을 수 있어?",
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

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
