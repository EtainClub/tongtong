import type { CardInput } from "../schema";

/*
 * 09. 청년내일저축계좌
 *
 * 원 컨셉의 게임("누구에게 필요한 정책일까")은 정답이 이름에 거의 드러나 자명했다.
 * "월 10만 원을 3년 넣으면?"으로 바꿨다 — 360만 원이 1,440만 원이 되는 것이 이 정책의 반전이다.
 * 원 컨셉의 "차상위 지원 규모 2만 → 2만 5천 명 확대"는 확인한 복지부 자료에서 "2만 5천 명 모집"까지만 확인됐다.
 */
export const youthTomorrowSavings = {
  id: "youth-tomorrow-savings",
  publishStatus: "published",
  audience: ["young_adult"],
  category: "asset",
  lifeStages: ["employed", "asset_building"],

  shortTitle: "청년내일저축계좌",
  hook: "내가 저축하면 정부도 같이 적립한다?",
  shorts: [
    "일은 하고 있지만",
    "돈 모으기가 쉽지 않은 저소득 청년.",
    "이들을 위한 자산형성 제도가 있습니다.",
    "내가 매달 저축하면",
    "정부가 지원금을 더 얹어 줍니다.",
    "3년 뒤, 얼마가 될까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "big-support", label: "정부 지원이 크다" }, // deposit, total
    { id: "needed", label: "형편이 어려운 청년에게 필요하다" }, // target
    { id: "hard-conditions", label: "일을 계속해야 해서 유지가 어렵다" }, // conditions, cp-reasons
    { id: "dropout", label: "중도에 해지하는 사람이 많다" }, // cp-dropout
    { id: "pause-longer", label: "적립을 멈출 수 있는 기간이 늘었다" }, // pause
  ],

  sources: [
    {
      id: "mohw-2026-recruit",
      title: "월 10만 원씩 3년 모으면 1,440만 원 받는다 '청년내일저축계좌' 신규 모집",
      url: "https://www.mohw.go.kr/board.es?mid=a10503010100&bid=0027&act=view&list_no=1490402&tag=&nPage=1",
      publisher: "보건복지부",
      type: "official",
      license: "link-only",
    },
    {
      id: "khan-2026-09-18",
      title: "저소득 청년 돕는다는 '내일저축계좌'···월 10만원이 버거운 청년들은 그마저도 못 지켰다",
      url: "https://www.khan.co.kr/article/202609180600061/",
      publisher: "경향신문 (이인영 의원실 자료 인용)",
      publishedAt: "2026-09-18",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "기준 중위소득 50% 이하 가구의 일하는 청년이 대상이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
    {
      id: "deposit",
      text: "본인이 매달 10만~50만 원을 저축하면 정부가 매달 30만 원을 지원한다. 기간은 3년이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
    {
      id: "total",
      text: "월 10만 원씩 3년 저축하면 만기 적립금은 본인 저축 360만 원을 포함해 1,440만 원이고, 이자가 더해진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
    {
      id: "conditions",
      text: "지원금을 받으려면 저축 기간 동안 일을 계속하고, 금융교육 10시간을 이수하고, 자금사용계획서를 내야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
    {
      id: "pause",
      text: "2026년부터 실직·질병 같은 사정으로 적립을 멈출 수 있는 기간이 6개월에서 12개월로 늘었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
    {
      id: "recruit",
      text: "2026년 신규 모집 인원은 2만 5천 명이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mohw-2026-recruit"],
    },
  ],

  counterpoints: [
    {
      id: "cp-dropout",
      text: "2022년에 계좌를 연 4만 2,465명 가운데 8,492명(20.0%)이 중도에 해지해 정부지원금을 받지 못했다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2026-09-18"],
    },
    {
      id: "cp-reasons",
      text: "해지한 청년을 조사한 결과 81.3%가 소득·자금 문제를 이유로 들었고, 가장 많은 사유는 휴직·실직(45.3%)이었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2026-09-18"],
    },
    {
      id: "cp-flexible",
      text: "실직이나 생계 위기로 한 달 10만 원을 넣기 어려운 청년을 위해 탄력적인 납입과 고용 지원 연계를 넓혀야 한다.",
      assertionType: "CLAIM",
      verified: true,
      assertedBy: "이인영 국회의원(더불어민주당)",
      sourceIds: ["khan-2026-09-18"],
    },
  ],

  game: {
    type: "guess_amount",
    question: "월 10만 원씩 3년 넣으면, 만기에 얼마가 될까?",
    premise: "본인 저축 10만 원 × 36개월 = 360만 원. 이자는 빼고 봅니다.",
    min: 3_600_000,
    max: 20_000_000,
    step: 100_000,
    answers: [{ label: "만기 적립금 (이자 제외)", value: 14_400_000 }],
    claimIds: ["deposit", "total"],
  },

  reveal: { claimIds: ["target", "deposit", "total", "conditions", "pause", "recruit"] },

  suggestedQuestions: ["소득 기준이 정확히 얼마야?", "일을 그만두면 어떻게 돼?", "얼마를 저축해야 해?", "지금 신청할 수 있어?"],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년",
        startAt: "2026-05-04",
        endAt: "2026-05-20",
        url: "https://www.bokjiro.go.kr",
        note: "복지로 또는 행정복지센터에서 신청.",
        sourceIds: ["mohw-2026-recruit"],
      },
    ],
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
