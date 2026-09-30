import type { CardInput } from "../schema";

/*
 * 03. 모두의카드 (K-패스)
 *
 * 원 컨셉의 "월 15회 이상 이용" 조건은 2026년 국토부 안내에서 확인되지 않았다 — 넣지 않았다.
 * 기준금액 50% 인하는 "9월 이용분까지"라 validUntil로 둔다. 10월부터 화면에 "기준일 지남"이 뜬다.
 * 게임은 사용자가 이미 아는 숫자(월 교통비)로 환급액을 맞힌다 — 비율이 돈으로 바뀌는 순간이 반전.
 */
export const everyoneTransitCard = {
  id: "everyone-transit-card",
  publishStatus: "published",
  audience: ["young_adult"],
  category: "transport",
  lifeStages: ["college", "job_seeking", "employed"],

  shortTitle: "모두의카드",
  hook: "매일 타는 지하철·버스비를 돌려받는다?",
  shorts: [
    "버스와 지하철.",
    "어차피 매달 쓰는 교통비인데,",
    "청년이라면 교통비 일부를 돌려받을 수 있습니다.",
    "청년 기본 환급률은 30%.",
    "타는 시간대를 바꾸면 더 커지기도 합니다.",
    "내 한 달 교통비라면 얼마나 돌려받을까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "real-refund", label: "교통비를 꽤 돌려받는다" }, // calc-120k
    { id: "off-peak", label: "시차 이용 혜택이 좋다" }, // off-peak
    { id: "complex", label: "유형과 기준이 복잡하다" }, // flat-types, half-price
    { id: "budget-risk", label: "예산이 모자라면 줄어든다" }, // cp-budget
  ],

  sources: [
    {
      id: "korea-2026-02-02",
      title: "'청년'을 위한 모두의 카드",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148958934",
      publisher: "국토교통부 (대한민국 정책브리핑)",
      publishedAt: "2026-02-02",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-half-price",
      title: "'모두의 카드' 9월까지 더 돌려받는다…환급 기준액 50% 인하",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148962910",
      publisher: "국토교통부 (대한민국 정책브리핑)",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-2026-09-28",
      title: "모두의카드 '출퇴근 시차시간 환급' 12월까지 연장…내년 예산 반영",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148972677",
      publisher: "국토교통부 (대한민국 정책브리핑)",
      publishedAt: "2026-09-28",
      type: "official",
      license: "link-only",
    },
    {
      id: "khan-2024-10-06",
      title: "K-패스 예산 바닥난다…알뜰교통카드 '환급 대란' 재현되나",
      url: "https://www.khan.co.kr/article/202410061449001",
      publisher: "경향신문",
      publishedAt: "2024-10-06",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "만 19~34세 청년은 청년 유형으로 적용받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "basic-rate",
      text: "기본형은 쓴 교통비의 일정 비율을 돌려주는 정률 환급이고, 청년 유형의 환급률은 30%다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "flat-types",
      text: "일반형·플러스형은 기준금액을 넘게 쓴 만큼을 돌려주는 방식이다. 청년 기준금액은 지역에 따라 다르다(수도권 5.5~9만 원, 일반 지방권 5~8.5만 원 등).",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "half-price",
      text: "일반형·플러스형의 환급 기준금액이 50% 인하돼, 수도권 청년 기준 일반형 2만 5천 원·플러스형 4만 5천 원이 적용된다. 9월 이용분까지다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-half-price", "korea-2026-09-28"],
      validUntil: "2026-09-30",
    },
    {
      id: "off-peak",
      text: "출퇴근 혼잡시간 전후(오전 5시 30분~6시 30분·9~10시, 오후 4~5시·7~8시)에 타면 정률 환급률이 30%p 올라, 청년은 60%를 돌려받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-half-price"],
    },
    {
      id: "off-peak-extended",
      text: "출퇴근 시차시간 인센티브는 올해 말까지 연장 운영되고, 정부는 2027년 예산안에 관련 예산을 반영했다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-09-28"],
    },
    {
      id: "register",
      text: "K-패스 앱이나 홈페이지에서 회원가입하고 카드를 등록해야 환급받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "calc-120k",
      text: "한 달 교통비가 12만 원이면 기본형 30%로 3만 6천 원을 돌려받는다. 모두 시차시간에 탔다면 60%로 7만 2천 원이다. 통통의 단순 계산이며, 실제로는 일반형·플러스형 조건과 지역 기준금액에 따라 달라진다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["korea-2026-02-02", "korea-half-price"],
    },
  ],

  counterpoints: [
    {
      id: "cp-budget",
      text: "환급은 정해진 국비·지방비 예산 안에서 나간다. 2024년 K-패스는 예산 1,584억 원 가운데 5~8월에만 63%를 썼고, 국토교통부는 추가 투입이 없으면 감액 지급이 불가피하다고 밝혔다. 앞선 알뜰교통카드는 2022~2023년 예산이 모자라 환급금을 줄여 지급했다(평균 9.5%, 경북 최대 25.4%).",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2024-10-06"],
    },
  ],

  game: {
    type: "guess_amount",
    question: "한 달 교통비가 12만 원이라면, 얼마를 돌려받을까?",
    premise: "청년, 기본형(정률 환급) 기준. 시차시간 인센티브는 따로 봅니다.",
    min: 0,
    max: 120_000,
    step: 1_000,
    answers: [
      { label: "기본형 30%", value: 36_000 },
      { label: "모두 시차시간에 탔다면 60%", value: 72_000 },
    ],
    claimIds: ["basic-rate", "off-peak", "calc-120k"],
  },

  reveal: { claimIds: ["basic-rate", "calc-120k", "off-peak", "off-peak-extended", "flat-types", "half-price", "register"] },

  suggestedQuestions: ["출퇴근 시간을 바꾸면 왜 더 받지?", "일반형이랑 플러스형은 뭐가 달라?", "기준금액 인하는 언제까지야?", "어떻게 신청해?"],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
