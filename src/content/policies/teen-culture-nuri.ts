import type { PolicyInput } from "../schema";

/*
 * 청소년 01. 문화누리카드 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/teen-culture-nuri.ts에 있다 (청사진 설계 2장).
 */
export const teenCultureNuri = {
  id: "teen-culture-nuri",
  publishStatus: "published",

  audience: ["youth"],
  category: "culture",
  lifeStages: [],

  name: "문화누리카드",

  sources: [
    {
      id: "korea-2026-02-02",
      title: "올해 문화누리카드 15만 원 지원…청소년 등엔 1만 원 더",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148958946",
      publisher: "문화체육관광부 (대한민국 정책브리핑)",
      publishedAt: "2026-02-02",
      type: "official",
      license: "link-only",
    },
    {
      id: "gukje-2025-11-26",
      title: "방한일 충남도의원, 문화누리카드 예산 확대에도 체감 미흡 지적",
      url: "https://www.gukjenews.com/news/articleView.html?idxno=3439423",
      publisher: "국제뉴스",
      publishedAt: "2025-11-26",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "대상은 6세 이상(2020년 12월 31일 이전 출생) 기초생활수급자와 법정 차상위계층이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "amount",
      text: "2026년 지원금은 1인당 15만 원이고, 13~18세 청소년과 60~64세는 1만 원을 더해 16만 원이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "scale",
      text: "국비 2,636억 원과 지방비 1,109억 원, 모두 3,745억 원으로 270만 명을 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "period",
      text: "신청은 2026년 2월 2일부터 11월 30일까지 주민센터·문화누리카드 누리집·앱에서 하고, 카드는 12월 31일까지 쓸 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
    {
      id: "recharge",
      text: "지난해 3만 원 이상 쓰고 올해도 자격이 유지되면 따로 신청하지 않아도 자동으로 충전된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-02"],
    },
  ],

  counterpoints: [
    {
      id: "cp-unused",
      text: "충남에서는 2023년 약 14억 9천만 원, 2024년 약 10억 2천만 원이 쓰이지 않고 사라졌다. 예산은 늘었지만 제도가 일상에 스며들지 못했다는 신호라는 지적이다.",
      assertionType: "CLAIM",
      assertedBy: "방한일 충남도의원(국민의힘)",
      verified: true,
      sourceIds: ["gukje-2025-11-26"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년",
        startAt: "2026-02-02",
        endAt: "2026-11-30",
        url: "https://www.mnuri.kr",
        note: "주민센터 방문, 문화누리카드 누리집·앱으로 신청. 카드는 12월 31일까지 사용.",
        sourceIds: ["korea-2026-02-02"],
      },
    ],
  },

  revisions: [{ version: 1, date: "2026-10-01", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-01",
} satisfies PolicyInput;
