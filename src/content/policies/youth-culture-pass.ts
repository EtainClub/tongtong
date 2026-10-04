import type { PolicyInput } from "../schema";

/*
 * 07. 청년문화예술패스 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-culture-pass.ts에 있다 (청사진 설계 2장).
 */
export const youthCulturePass = {
  id: "youth-culture-pass",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "culture",
  lifeStages: ["college", "job_seeking"],

  name: "청년문화예술패스",
  summary: "올해 19·20세가 되는 청년에게 공연·전시·영화·도서에 쓸 수 있는 15만~20만 원을 지원한다.",

  sources: [
    {
      id: "korea-2026-02-09",
      title: "19·20세 청년에 '문화예술패스' 발급…최대 20만 원까지",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148959296",
      publisher: "문화체육관광부 (대한민국 정책브리핑)",
      publishedAt: "2026-02-09",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-reporter-books",
      title: "\"가을부턴 책도 살 수 있다\" 청년문화예술패스 200% 활용하기",
      url: "https://www.korea.kr/news/reporterView.do?newsId=148969816",
      publisher: "대한민국 정책브리핑 정책기자단",
      type: "press",
      license: "link-only",
    },
    {
      id: "korea-budget-2027",
      title: "문체부 내년 예산 첫 9조 원 돌파…청년문화패스, 19~34세로 확대",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148971276",
      publisher: "문화체육관광부 (대한민국 정책브리핑)",
      type: "official",
      license: "link-only",
    },
    {
      id: "khan-2025-04-10",
      title: "“문화체험 기회 늘린다”는 청년문화예술패스, 지방청년들은 쓸 곳 없어 ‘패스’",
      url: "https://www.khan.co.kr/article/202504101406001",
      publisher: "경향신문",
      publishedAt: "2025-04-10",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "2026년 대상은 올해 19·20세가 되는 2006년생과 2007년생이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
    {
      id: "amount",
      text: "수도권(서울·경기·인천)은 15만 원, 비수도권은 20만 원을 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
    {
      id: "uses",
      text: "공연·전시·영화에 쓸 수 있다. 영화는 수도권 2회, 비수도권 4회로 횟수가 제한된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
    {
      id: "books",
      text: "2026년 8월부터 도서 구매에도 쓸 수 있게 됐고, 8월 10일부터 추가 발급을 받았다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-books"],
    },
    {
      id: "deadline",
      text: "2026년에 받은 패스는 12월 31일까지 쓸 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
    {
      id: "first-come",
      text: "시도별로 정해진 인원 안에서 신청 순서대로 발급한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
    {
      id: "budget-2027",
      text: "문화체육관광부의 2027년 예산안은 이름을 '청년문화패스'로 하고 대상을 19~34세 모든 청년으로 넓혔다. 국비 지원액은 수도권 10만 원·비수도권 15만 원이고, 체육활동에도 쓸 수 있게 한다. 국회 심의 전 예산안이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-budget-2027"],
    },
  ],

  counterpoints: [
    {
      id: "cp-usage",
      text: "2024년 패스의 전국 이용률은 34.3%였고, 예산 233억 원 가운데 153억 원이 쓰이지 않았다. 전국 공연장의 60%가 수도권에 몰려 있어 지방에서는 쓸 곳이 부족하다는 지적이 나왔다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["khan-2025-04-10"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년",
        startAt: "2026-02-25",
        endAt: "2026-06-30",
        url: "https://www.youthculturepass.or.kr",
        note: "공식 누리집에서 회원가입 후 신청. 8월 10일부터 추가 발급(선착순)이 있었다.",
        sourceIds: ["korea-2026-02-09", "korea-reporter-books"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 대상이 출생연도(올해 19·20세)라 만 나이 age로 옮기지 않는다.
  planning: {
    roles: ["living"],
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
