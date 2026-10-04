import type { PolicyInput } from "../schema";

/*
 * 국민취업지원제도 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 취업 경로의 졸업 뒤 공백기 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-career-2026-10-04.md) 뒤 공개.
 * 취업성공수당은 정부24 서비스 상세에 금액이 없어 적지 않았다.
 */
export const nationalEmploymentSupport = {
  id: "national-employment-support",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["job_seeking"],

  name: "국민취업지원제도",
  summary: "취업이 어려운 구직자에게 상담·훈련·일경험을 잇는 취업지원을 하고, 소득이 낮으면 구직촉진수당을 6개월 준다.",

  sources: [
    {
      id: "gov24",
      title: "국민취업지원제도 (정부24 서비스 상세)",
      url: "https://www.gov.kr/portal/rcvfvrSvc/dtlEx/149200005007",
      publisher: "고용노동부 (정부24)",
      type: "official",
      license: "link-only",
    },
    {
      id: "moel-2026-allowance",
      title: "국민취업지원제도 구직활동지원금 확대",
      url: "https://www.moel.go.kr/news/achievements/view.do?bbs_seq=20260201211",
      publisher: "고용노동부",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "type1-screened",
      text: "Ⅰ유형(요건심사형)은 15~69세 구직자 중 중위소득 60% 이하, 재산 4억 원 이하(15~34세 청년은 5억 원 이하)이면서 최근 2년 안에 100일 또는 800시간 이상 일한 경험이 있는 사람이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "type1-youth",
      text: "Ⅰ유형(선발형)은 취업경험 요건을 채우지 못한 구직자다. 15~34세 청년은 중위소득 120% 이하, 재산 5억 원 이하면 되고 취업경험은 선발할 때 고려한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "type2",
      text: "Ⅱ유형은 Ⅰ유형에 해당하지 않는 15~69세 구직자 중 가구 중위소득 100% 이하인 사람이고, 청년은 소득과 관계없다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "allowance",
      text: "Ⅰ유형은 구직활동을 하면 구직촉진수당을 6개월 받는다. 정부24는 월 60~100만 원으로 적고 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "allowance-2026",
      text: "구직촉진수당 기본 월액은 2026년 1월 1일부터 50만 원에서 60만 원으로 올랐다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moel-2026-allowance"],
    },
    {
      id: "services",
      text: "Ⅰ·Ⅱ유형 모두 심층상담을 거쳐 직업훈련, 일경험, 복지 프로그램 연계 같은 취업지원서비스를 받는다. Ⅱ유형은 취업활동계획 수립 참여수당 등 취업활동비용을 받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
    {
      id: "apply",
      text: "상시 신청한다. 거주지 관할 고용센터에 가거나 고용24(www.work24.go.kr)에서 본인이 신청하고, 문의는 고용노동부 고객상담센터 1350.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["gov24"],
    },
  ],

  policy: { history: [], applications: [] },

  // Ⅰ유형 수당 기간만 durationMonths로 둔다 — 취업지원서비스 기간은 원문에 없다.
  planning: {
    roles: ["safety"],
    age: { min: 15, max: 69, claimIds: ["type1-screened", "type1-youth", "type2"] },
    durationMonths: { value: 6, claimIds: ["allowance"] },
    recurrence: { kind: "always", claimIds: ["apply"] },
  },

  revisions: [{ version: 1, date: "2026-10-04", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
