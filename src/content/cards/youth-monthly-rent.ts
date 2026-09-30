import type { CardInput } from "../schema";

/*
 * 02. 청년월세 지원
 *
 * 원 컨셉의 4지선다는 B만 조건에 맞아 정답이 자명했다. 바로 "나도 돼?"로 간다.
 *
 * 2026년 신청은 5/29에 끝났다. 카드는 그래도 유효하다 — 제도를 알고 다음 신청을
 * 기다리는 것도 정보다. 화면의 "마감" 표시는 저장된 상태가 아니라 날짜에서 나온다.
 */
export const youthMonthlyRent = {
  id: "youth-monthly-rent",
  publishStatus: "published",
  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["living_alone", "housing", "job_seeking", "college"],

  shortTitle: "청년월세 지원",
  hook: "월세 최대 480만 원을 지원받을 수 있다?",
  shorts: [
    "자취하는 청년이라면 주목.",
    "부모와 따로 사는 19~34세 무주택 청년 중 일정 조건을 충족하면",
    "매월 최대 20만 원.",
    "최대 24개월.",
    "계산하면 최대 480만 원입니다.",
    "그런데 나는 대상일까요?",
  ],

  flow: { trust: true, opinion: true },

  // 정책 평가 이유 — 근거 claim을 옆에 적는다. 긍정·부정을 섞어 고정 순서로.
  reasonOptions: [
    { id: "eases-rent", label: "월세 부담을 실제로 덜어 준다" }, // amount, max-total
    { id: "strict-income", label: "소득 기준이 너무 엄격하다" }, // cp-strict-income
    { id: "once-in-life", label: "생애 한 번뿐이라 아쉽다" }, // amount
    { id: "no-deposit", label: "보증금·관리비는 빠져 있다" }, // excluded
    { id: "limited-quota", label: "뽑는 인원이 정해져 있다" }, // quota
  ],

  sources: [
    {
      id: "bokjiro-2026-03-20",
      title: "2026년 청년월세 지원 신청 안내",
      url: "https://m.bokjiro.go.kr/ssis-tem/cms/mob/customer/notice/1309500_1155.html",
      publisher: "복지로",
      publishedAt: "2026-03-20",
      type: "official",
      license: "link-only",
    },
    {
      id: "seoulpn-2023-06-20",
      title: "청년월세 지원받기 ‘바늘구멍’… 수도권 지자체 예산 30%도 못 써",
      url: "https://go.seoul.co.kr/news/newsView.php?id=20230620002002",
      publisher: "서울신문 서울Pn",
      publishedAt: "2023-06-20",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "부모와 따로 사는 19~34세 무주택 청년이 대상이다. 2026년 신청 가능 출생연도는 1991~2007년생이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "income",
      text: "부모님 가구(원가구)는 기준 중위소득 100% 이하, 청년 본인 가구는 기준 중위소득 60% 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "amount",
      text: "실제로 내는 월세 가운데 최대 월 20만 원을, 최대 24개월(회) 지원한다. 생애 한 번만 받을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "excluded",
      text: "임차보증금과 관리비 등은 지원하지 않는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "max-total",
      text: "월 20만 원 × 24개월, 받을 수 있는 최대 금액은 480만 원이다. 월세가 20만 원보다 적으면 그만큼 줄어든다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "quota",
      text: "2026년 신규 수혜자는 전국 6만 명을 모집할 예정이며, 지역마다 선정 인원이 다르다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
  ],

  counterpoints: [
    {
      id: "cp-strict-income",
      text: "2023년 청년월세 특별지원 때 수도권 지자체 상당수가 예산의 30%도 쓰지 못했다(서울 29%). 신청자 다수가 소득 기준에 맞지 않아 탈락했는데, 청년 본인 소득 기준(중위소득 60%)이 최저임금 월급보다 낮아 일하는 청년은 사실상 받기 어렵다는 지적이었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["seoulpn-2023-06-20"],
    },
  ],

  game: {
    type: "eligibility",
    question: "나도 받을 수 있을까?",
    steps: [
      {
        id: "birth",
        question: "1991~2007년생인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "apart",
        question: "부모님과 따로 살고 있나요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "no-house",
        question: "내 이름으로 된 집이 없나요?",
        answers: [
          { label: "네, 없어요", outcome: "pass" },
          { label: "있어요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "income",
        question: "내 가구 소득이 기준 중위소득 60% 이하이고, 부모님 가구는 100% 이하인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
          { label: "잘 모르겠어요", outcome: "unknown" },
        ],
        claimIds: ["income"],
      },
    ],
  },

  reveal: { claimIds: ["amount", "max-total", "excluded", "income", "quota"] },

  suggestedQuestions: [
    "소득 기준은?",
    "보증금이 높으면 안 돼?",
    "월세가 15만 원이면 20만 원을 받나?",
    "지금도 신청할 수 있어?",
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년",
        startAt: "2026-03-30T09:00:00+09:00",
        endAt: "2026-05-29T16:00:00+09:00",
        url: "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004661",
        note: "청년 본인이 복지로에서 온라인 신청.",
        sourceIds: ["bokjiro-2026-03-20"],
      },
    ],
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
