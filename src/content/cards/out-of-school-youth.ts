import type { CardInput } from "../schema";

/*
 * 청소년 05. 학교 밖 청소년 지원 (꿈드림)
 *
 * 읽는 사람이 학교 밖 청소년일 수도, 친구가 그럴 수도 있다. 낙인처럼 읽히지 않게 쓴다.
 * 실태조사의 자해·자살 수치는 싣지 않는다 — 청소년이 보는 카드이고, 판단에 필요한 사실이 아니다.
 * 모의평가 응시료 신청은 9월 30일에 끝났다(2026년). 내년 공고가 나오면 신청 기간을 새로 넣는다.
 */
export const outOfSchoolYouth = {
  id: "out-of-school-youth",
  publishStatus: "published",
  audience: ["youth"],
  category: "education",
  lifeStages: [],

  shortTitle: "학교 밖 청소년 지원",
  hook: "학교를 그만둬도 모의고사 응시료를 대준다?",
  shorts: [
    "학교를 그만둔 청소년은 한 해 18만 명이 넘습니다.",
    "학교는 떠났지만 공부와 진로는 계속됩니다.",
    "검정고시, 진학, 취업 준비.",
    "2026년에는 수능 모의평가 응시료도 새로 지원합니다.",
    "얼마를, 어떻게 받을 수 있을까요?",
  ],

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "keep-studying", label: "학교 밖에서도 공부를 이어갈 수 있다" }, // mock-exam
    { id: "one-place", label: "상담·진로·건강을 한곳에서 돕는다" }, // services
    { id: "small-support", label: "지원 금액이 작다" }, // mock-exam
    { id: "not-reaching", label: "도움이 필요한 사람에게 다 닿지 않는다" }, // cp-reach
    { id: "too-few-staff", label: "센터 인력이 부족하다" }, // cp-reach
  ],

  sources: [
    {
      id: "mogef-program",
      title: "학교 밖 청소년지원사업",
      url: "https://www.mogef.go.kr/cs/opf/cs_opf_f941.do",
      publisher: "성평등가족부",
      type: "official",
      license: "link-only",
    },
    {
      id: "mogef-2026-06-04",
      title: "성평등가족부, 학교 밖 청소년 수능 모의평가 응시료 지원",
      url: "https://www.mogef.go.kr/nw/enw/nw_enw_s001d.do?mid=mda700&bbtSn=713872",
      publisher: "성평등가족부",
      publishedAt: "2026-06-04",
      type: "official",
      license: "link-only",
    },
    {
      id: "mt-2026-09-26",
      title: "학교 밖 청소년 5년간 24% 급증했는데 \"정확한 규모 측정도 어려워\"",
      url: "https://www.mt.co.kr/policy/2026/09/26/2026092210372682254",
      publisher: "머니투데이",
      publishedAt: "2026-09-26",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "who",
      text: "학교 밖 청소년은 9~24세 가운데 입학 후 3개월 이상 결석했거나 취학 의무를 유예한 청소년, 제적·퇴학·자퇴한 청소년, 상급학교에 진학하지 않은 청소년이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mogef-program"],
    },
    {
      id: "services",
      text: "청소년지원센터 '꿈드림'이 상담, 복교·진학·검정고시 같은 교육 지원, 직업체험과 취업 지원, 생활·의료 같은 자립 지원, 건강증진 프로그램을 제공한다. 꿈드림 누리집이나 지역 센터에서 신청한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mogef-program"],
    },
    {
      id: "mock-exam",
      text: "2026년부터 6월·9월 수능 모의평가에 응시하는 학교 밖 청소년(9~24세)에게 응시료를 회당 1만 2천 원, 최대 2만 4천 원까지 전액 지원한다. 올해 신청은 6월 4일부터 9월 30일까지 청소년1388 누리집에서 받았다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mogef-2026-06-04"],
    },
    {
      id: "count",
      text: "학교 밖 청소년(6~17세)은 지난해 18만 694명으로, 2021년보다 24% 늘었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mt-2026-09-26"],
    },
  ],

  counterpoints: [
    {
      id: "cp-reach",
      text: "실태 파악에 쓰는 기관 자료는 학교 밖 청소년의 22% 정도만 담고, 지원센터가 한 해 돕는 청소년은 약 4만 명이다. 상담사 한 명이 50~60명을 맡을 만큼 인력도 부족하다는 지적이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["mt-2026-09-26"],
    },
  ],

  game: {
    type: "multiple_choice",
    question: "학교 밖 청소년이 6월·9월 수능 모의평가를 보면 응시료는?",
    options: [
      { id: "full", label: "전액 지원 (회당 1만 2천 원)" },
      { id: "half", label: "절반만 지원" },
      { id: "none", label: "지원 없음" },
    ],
    answerOptionId: "full",
    claimIds: ["mock-exam"],
  },

  reveal: { claimIds: ["who", "services", "mock-exam", "count"] },

  suggestedQuestions: ["꿈드림은 어떻게 찾아가?", "검정고시 준비도 도와줘?", "몇 살까지 받을 수 있어?"],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년 모의평가 응시료",
        startAt: "2026-06-04",
        endAt: "2026-09-30",
        url: "https://www.1388.go.kr",
        note: "청소년1388 누리집 → 서비스 신청 → 수능모의평가 응시료 신청.",
        sourceIds: ["mogef-2026-06-04"],
      },
    ],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies CardInput;
