import type { CardInput } from "../schema";

/*
 * 06. 미래내일 일경험 — 탐색 카드 (검토 문서 2.7).
 *
 * 믿을 훅도, 찬반을 물을 정책 쟁점도 약하다. 판단 단계를 끄고 "나도 참여할 수 있을까?"로 끝낸다.
 * 원 컨셉의 "직무 선택 → 관련 일경험 카드"는 직무별 공고 데이터가 있어야 한다 — 청년일경험포털 연동 뒤에.
 * 참여 청년 조건·수당은 정책브리핑 정책기자단 기사만 확인돼서 그 사실을 출처 이름에 드러냈다.
 */
export const workExperience = {
  id: "work-experience",
  publishStatus: "published",
  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["college", "job_seeking"],

  shortTitle: "미래내일 일경험",
  hook: "경력이 없어서 취업 못 한다면, 경력을 먼저 만들어 볼 수 있다?",
  shorts: [
    "취업 공고는 경력을 요구하고,",
    "경력을 만들려면 취업을 해야 하고.",
    "이 모순을 풀기 위한 청년 일경험 프로그램이 있습니다.",
    "기업에서 실제 직무를 해 보거나",
    "프로젝트에 참여하는 방식입니다.",
    "나도 참여할 수 있을까요?",
  ],

  flow: { trust: false, opinion: false },

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

  game: {
    type: "eligibility",
    question: "나도 참여할 수 있을까?",
    steps: [
      {
        id: "age",
        question: "만 15~34세인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
      {
        id: "unemployed",
        question: "지금 취업하지 않은 상태인가요?",
        answers: [
          { label: "네", outcome: "pass" },
          { label: "아니요", outcome: "fail" },
        ],
        claimIds: ["target"],
      },
    ],
  },

  reveal: { claimIds: ["target", "types", "tour", "multiple", "allowance", "portal"] },

  suggestedQuestions: ["인턴형이랑 프로젝트형은 뭐가 달라?", "수당은 얼마야?", "여러 번 해도 돼?", "어디서 신청해?"],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
