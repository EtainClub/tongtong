import type { PolicyInput } from "../schema";

/*
 * 청소년 04. 고교학점제 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/high-school-credit.ts에 있다 (청사진 설계 2장).
 */
export const highSchoolCredit = {
  id: "high-school-credit",
  publishStatus: "published",

  audience: ["youth"],
  category: "education",
  lifeStages: [],

  name: "고교학점제",

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

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
