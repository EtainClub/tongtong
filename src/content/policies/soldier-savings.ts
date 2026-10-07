import type { PolicyInput } from "../schema";

/*
 * 장병내일준비적금 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 군 복무 경로의 자산 칸 (청사진 설계 9.3). 2026-10-08 작성 — 원문 대조 기록은 docs/source-check-2026-10-08.md.
 * verified는 편집자가 원문을 직접 확인한 뒤 바꾼다. 그때까지 초안이다.
 */
export const soldierSavings = {
  id: "soldier-savings",
  publishStatus: "draft",

  audience: ["young_adult"],
  category: "asset",
  lifeStages: ["military", "asset_building"],

  name: "장병내일준비적금",
  summary: "병으로 복무하는 동안 적금을 들면, 만기 때 넣은 원금만큼(100%)을 정부가 매칭지원금으로 더해 준다.",

  sources: [
    {
      id: "mnd-savings",
      title: "장병내일준비적금",
      url: "https://www.mnd.go.kr/mnd/288/subview.do",
      publisher: "국방부",
      type: "official",
      license: "link-only",
    },
    {
      id: "mma-2026-01-09",
      title: "사회복무요원 장병내일준비적금 재정지원(사회복귀준비금) 안내",
      url: "https://www.mma.go.kr/board/boardView.do?mc=usr0000379&gesipan_id=2&gsgeul_no=1518779",
      publisher: "병무청",
      publishedAt: "2026-01-09",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "who",
      text: "현역·상근예비역, 대체복무요원, 사회복무요원처럼 병 급여와 복무관리 체계를 적용받는 사람만 가입할 수 있다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings"],
    },
    {
      id: "period",
      text: "최대 가입기간은 육군·해병대·상근예비역 18개월, 해군 20개월, 공군·사회복무요원 21개월, 대체복무요원 24개월이다. 2024년 6월부터 최소 1개월부터 가입할 수 있다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings"],
    },
    {
      id: "limit",
      text: "2025년 1월부터 한 사람이 서로 다른 은행에 2계좌까지 열 수 있고, 계좌당 월 30만 원, 개인별 월 55만 원까지 넣을 수 있다. 납입은 5만 원 단위다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings"],
    },
    {
      id: "matching",
      text: "2024년부터 정부가 만기 때 납입 원금의 100%에 해당하는 매칭지원금을 준다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings", "mma-2026-01-09"],
    },
    {
      id: "example-2026",
      text: "병무청은 2026년 1월 소집된 사회복무요원이 월 55만 원을 넣으면 원금 1,155만 원에 같은 금액의 사회복귀준비금을 받는다고 예시한다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mma-2026-01-09"],
    },
    {
      id: "interest",
      text: "기본 은행이자는 연 5% 수준이고 이자에는 세금을 매기지 않는다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings"],
    },
    {
      id: "early-close",
      text: "만기 전에 해지하면 이자 비과세 혜택과 정부지원금을 받을 수 없다.",
      assertionType: "FACT",
      verified: false,
      sourceIds: ["mnd-savings"],
    },
  ],

  policy: {
    history: [],
    applications: [],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 복무 중에만 가입한다. 기간은 군별로 달라 durationMonths를 두지 않는다.
  planning: {
    roles: ["asset"],
    stages: ["military"],
  },

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PolicyInput;
