import type { PolicyInput } from "../schema";

/*
 * 09. 청년내일저축계좌 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-tomorrow-savings.ts에 있다 (청사진 설계 2장).
 */
export const youthTomorrowSavings = {
  id: "youth-tomorrow-savings",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "asset",
  lifeStages: ["employed", "asset_building"],

  name: "청년내일저축계좌",

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

  // 청사진 계획 정보 (청사진 설계 4.4). 나이 조건 claim이 없어 age를 두지 않는다.
  planning: {
    roles: ["asset"],
    durationMonths: { value: 36, claimIds: ["deposit"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
