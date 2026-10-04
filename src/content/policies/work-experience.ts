import type { PolicyInput } from "../schema";

/*
 * 06. 미래내일 일경험 — 탐색 카드 (검토 문서 2.7). — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/work-experience.ts에 있다 (청사진 설계 2장).
 */
export const workExperience = {
  id: "work-experience",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["college", "job_seeking"],

  name: "미래내일 일경험",
  summary: "15~34세 미취업 청년이 인턴·프로젝트 등으로 일을 경험하는 사업. 주 25시간 이상 참여하면 수당을 받는다.",

  sources: [
    {
      id: "moel-2026-01-26",
      title: "2026년 미래내일일경험사업 운영기관 모집 안내",
      url: "https://www.moel.go.kr/news/notice/noticeView.do?bbs_seq=20260101033",
      publisher: "고용노동부",
      publishedAt: "2026-01-26",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-reporter-2026",
      title: "취준생이라면 주목! 2026 청년인턴, 미래내일 일경험 정보 알아보아요",
      url: "https://www.korea.kr/news/reporterView.do?newsId=148959764",
      publisher: "대한민국 정책브리핑 정책기자단",
      type: "press",
      license: "link-only",
    },
    {
      id: "kmib-2026-09-01",
      title: "정부가 만들어준 경력 통할까… 취업준비 기간만 더 늘릴 수도",
      url: "https://www.kmib.co.kr/article/view.asp?arcid=9000007856",
      publisher: "국민일보",
      publishedAt: "2026-09-01",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "types",
      text: "2026년 미래내일 일경험 사업은 인턴형·프로젝트형·ESG지원형으로 운영기관을 모집했다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moel-2026-01-26"],
    },
    {
      id: "target",
      text: "만 15~34세 미취업 청년이 참여할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-2026"],
    },
    {
      id: "tour",
      text: "인턴형·프로젝트형·ESG 지원형 외에 기업 탐방형도 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-2026"],
    },
    {
      id: "multiple",
      text: "한 해에 여러 번 참여할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-2026"],
    },
    {
      id: "allowance",
      text: "주 25시간 이상 참여하면 수당이 지급된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-2026"],
    },
    {
      id: "portal",
      text: "신청은 청년일경험포털(yw.work24.go.kr)에서 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-reporter-2026"],
    },
  ],

  counterpoints: [
    {
      id: "cp-recognition",
      text: "정부가 제공하는 훈련·일경험을 기업이 실제 경력으로 인정할지는 불확실하고, 오히려 청년의 취업 준비 기간과 비용을 늘릴 수 있다.",
      assertionType: "CLAIM",
      assertedBy: "국민일보 분석",
      verified: true,
      sourceIds: ["kmib-2026-09-01"],
    },
  ],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4).
  planning: {
    roles: ["experiment"],
    age: { min: 15, max: 34, claimIds: ["target"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
