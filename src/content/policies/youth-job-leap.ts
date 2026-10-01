import type { PolicyInput } from "../schema";

/*
 * 10. 청년일자리도약장려금 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-job-leap.ts에 있다 (청사진 설계 2장).
 */
export const youthJobLeap = {
  id: "youth-job-leap",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["job_seeking", "employed"],

  name: "청년일자리도약장려금",

  sources: [
    {
      id: "moel-2026-01-26",
      title: "'26년 청년일자리도약장려금 지방 기업·청년의 성장을 지원합니다",
      url: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18886",
      publisher: "고용노동부",
      publishedAt: "2026-01-26",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-2025-12-16",
      title: "비수도권 소재 기업 지원 특화! 2026 청년일자리도약장려금",
      url: "https://www.korea.kr/multi/visualNewsView.do?newsId=148956536",
      publisher: "고용노동부 (대한민국 정책브리핑)",
      publishedAt: "2025-12-16",
      type: "official",
      license: "link-only",
    },
    {
      id: "news1-2026-09-25",
      title: "이헌승 \"청년일자리 사업 수천 억 쓰지만 2년 이상 고용 유지는 40%\"",
      url: "https://www.news1.kr/politics/assembly/6301264",
      publisher: "뉴스1",
      publishedAt: "2026-09-25",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "reorganized",
      text: "2026년 사업은 기존 Ⅰ·Ⅱ유형을 수도권 유형과 비수도권 유형으로 개편했다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moel-2026-01-26"],
    },
    {
      id: "company-support",
      text: "5인 이상 우선지원대상기업이 청년을 채용하면, 수도권·비수도권 모두 기업에 1년간 최대 720만 원을 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-12-16"],
    },
    {
      id: "youth-incentive",
      text: "비수도권 기업에 취업한 청년은 6개월 이상 근속하면 2년간 최대 720만 원의 근속 인센티브를 받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moel-2026-01-26", "korea-2025-12-16"],
    },
    {
      id: "youth-tiers",
      text: "청년 근속 인센티브는 지역에 따라 일반 비수도권 최대 480만 원, 우대지원지역 최대 600만 원, 특별지원지역 최대 720만 원이며, 근속 6·12·18·24개월 차에 나눠 받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-12-16"],
    },
    {
      id: "capital-no-youth",
      text: "정부 안내 자료에서 청년 근속 인센티브는 비수도권 유형에만 있다. 수도권 유형은 기업 지원만 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-12-16"],
    },
    {
      id: "capital-target",
      text: "수도권 유형은 만 15~34세 가운데 4개월 이상 연속 실업 상태이거나 고졸 이하인 경우 등, 취업애로 요건 10개 중 하나에 해당하는 청년을 채용할 때 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2025-12-16"],
    },
  ],

  counterpoints: [
    {
      id: "cp-retention",
      text: "청년일자리도약장려금 예산은 5년 새 70.4% 늘었지만 청년 고용률은 내림세이고, 지원받은 청년 가운데 2년 이상 고용이 유지된 인원은 참여 인원의 40%에 그친다.",
      assertionType: "CLAIM",
      verified: true,
      assertedBy: "이헌승 국회의원(국민의힘)",
      sourceIds: ["news1-2026-09-25"],
    },
  ],

  policy: {
    history: [
      {
        // 발표일 기준. 시행일은 원문에서 확인하지 못했다.
        date: "2026-01-26",
        kind: "changed",
        summary: "Ⅰ·Ⅱ유형을 수도권·비수도권 유형으로 개편하고, 비수도권 청년 근속 인센티브를 도입했다.",
        sourceIds: ["moel-2026-01-26"],
      },
    ],
    applications: [],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 나이 조건 claim은 수도권 유형에만 있어 age를 두지 않는다.
  planning: {
    roles: ["employment"],
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
