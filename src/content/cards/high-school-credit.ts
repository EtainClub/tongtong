import type { CardInput } from "../schema";

/*
 * 청소년 04. 고교학점제
 *
 * 2026년 이수 기준이 바뀌었다 — 선택과목은 출석률만, 공통과목은 그대로 출석률+학업성취율.
 * 훅 "출석만 해도"는 선택과목에만 맞는 말이라 공개 화면에서 공통과목을 바로 옆에 적는다.
 */
export const highSchoolCredit = {
  id: "high-school-credit",
  publishStatus: "published",
  audience: ["youth"],
  category: "education",
  lifeStages: [],

  shortTitle: "고교학점제",
  hook: "선택과목은 출석만 해도 학점을 딴다?",
  shorts: [
    "고등학교도 대학처럼 과목을 골라 듣고 학점을 땁니다.",
    "그런데 학점을 따는 기준이 너무 어렵다는 말이 많았습니다.",
    "2026년, 기준이 바뀌었습니다.",
    "선택과목은 이제 무엇만 채우면 될까요?",
  ],

  flow: { trust: true, opinion: true },

  reasonOptions: [
    { id: "less-burden", label: "학생·선생님 부담이 줄었다" }, // elective-rule
    { id: "choose-freely", label: "듣고 싶은 과목을 고르기 쉬워졌다" }, // elective-rule
    { id: "learning-gap", label: "배운 것을 확인하지 않게 됐다" }, // elective-rule
    { id: "still-formal", label: "공통과목 기준은 여전히 형식적이다" }, // cp-unions
    { id: "online-helps", label: "온라인으로 다시 기회를 주는 것이 좋다" }, // online
  ],

  sources: [
    {
      id: "moe-2026-01-28",
      title: "고교학점제 안착을 위한 지원 대책 발표",
      url: "https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=105223&lev=0&searchType=null&statusYN=W&page=1&s=moe&m=020402&opType=N",
      publisher: "교육부",
      publishedAt: "2026-01-28",
      type: "official",
      license: "link-only",
    },
    {
      id: "imbc-2026-01-28",
      title: "새학기 고교학점제 개선안 시행‥선택과목은 출석만 해도 이수 가능",
      url: "https://imnews.imbc.com/news/2026/society/article/6796858_36918.html",
      publisher: "MBC",
      publishedAt: "2026-01-28",
      type: "press",
      license: "link-only",
    },
    {
      id: "asiae-2026-01-28",
      title: "교원 3단체 \"고교학점제 지원 대책, 형식적 보완에 그쳐\"",
      url: "https://view.asiae.co.kr/article/2026012816090159670",
      publisher: "아시아경제",
      publishedAt: "2026-01-28",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "before",
      text: "지금까지는 과목마다 출석률과 학업성취율 기준을 모두 채워야 학점을 받았다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["imbc-2026-01-28"],
    },
    {
      id: "elective-rule",
      text: "2026학년도부터 선택과목은 출석률만 채우면 학점을 받는다. 학업성취율은 보지 않는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moe-2026-01-28"],
    },
    {
      id: "common-rule",
      text: "공통과목은 지금처럼 출석률과 학업성취율을 모두 본다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moe-2026-01-28"],
    },
    {
      id: "online",
      text: "과목을 이수하지 못하면 온라인 콘텐츠로 학점을 딸 수 있는 플랫폼을 만들고, 3분의 2 이상 출석하면 이수로 인정한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moe-2026-01-28"],
    },
    {
      id: "schedule",
      text: "바뀐 기준은 2026학년도에 고1·고2에 적용하고, 2027학년도부터 고1~고3으로 넓힌다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moe-2026-01-28"],
    },
  ],

  counterpoints: [
    {
      id: "cp-unions",
      text: "공통과목에 학업성취율을 남긴 것은 최소 성취수준 보장지도가 형식적으로 운영될 수밖에 없는 구조를 굳힐 가능성이 크고, 학교들이 평가 기준을 낮추거나 절차만 채우는 식으로 대응하게 될 것이다.",
      assertionType: "CLAIM",
      assertedBy: "교사노동조합연맹·전국교직원노동조합·한국교원단체총연합회",
      verified: true,
      sourceIds: ["asiae-2026-01-28"],
    },
  ],

  game: {
    type: "multiple_choice",
    question: "2026년부터 선택과목 학점을 따려면 무엇을 채워야 할까?",
    options: [
      { id: "attendance", label: "출석률만" },
      { id: "both", label: "출석률과 학업성취율 둘 다" },
      { id: "score", label: "학업성취율만" },
      { id: "none", label: "아무 조건 없음" },
    ],
    answerOptionId: "attendance",
    claimIds: ["elective-rule"],
  },

  reveal: { claimIds: ["before", "elective-rule", "common-rule", "online", "schedule"] },

  suggestedQuestions: ["공통과목과 선택과목은 뭐가 달라?", "학점을 못 따면 어떻게 돼?", "고3도 바뀐 기준이야?"],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies CardInput;
