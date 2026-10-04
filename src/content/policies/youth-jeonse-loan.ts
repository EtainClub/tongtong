import type { PolicyInput } from "../schema";

/*
 * 청년전용 버팀목전세자금 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 취업 경로의 첫 직장 뒤 주거 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-career-2026-10-04.md) 뒤 공개.
 * 갚아야 하는 대출이다 (검토 A-7) — planning.repayable.
 * 금리표(소득·보증금 구간별)는 원문이 표라 범위만 적었다.
 */
export const youthJeonseLoan = {
  id: "youth-jeonse-loan",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["living_alone", "housing", "employed"],

  name: "청년전용 버팀목전세자금",
  summary: "무주택 청년 세대주에게 전세보증금을 최대 1.5억 원까지 연 2.2~3.3%로 빌려준다. 갚아야 하는 대출이다.",

  sources: [
    {
      id: "nhuf",
      title: "청년전용 버팀목전세자금 (상품안내)",
      url: "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp",
      publisher: "국토교통부 주택도시기금",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "대출접수일 현재 만 19세 이상 만 34세 이하의 무주택 세대주(예비 세대주 포함)가 대상이다. 세대원 전원이 무주택이어야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "income-asset",
      text: "본인과 배우자의 합산 총소득이 5천만 원 이하이고 합산 순자산가액이 3.45억 원 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "house",
      text: "임차 전용면적 85㎡ 이하(만 25세 미만 단독세대주는 60㎡ 이하), 임차보증금 3억 원 이하 주택이어야 하고, 보증금의 5% 이상을 낸 계약이 있어야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "limit",
      text: "대출한도는 1.5억 원(만 25세 미만 단독세대주 1.2억 원) 이내이고 임차보증금의 80% 이내다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "rate",
      text: "금리는 연 2.2~3.3% 변동금리로, 소득과 보증금 구간에 따라 다르다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "term",
      text: "이용기간은 2년 이내이고 연장해 최장 10년까지 쓸 수 있다. 일시상환 또는 혼합상환으로 갚는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "new-hire-limit",
      text: "재직 1년 미만이면 대출한도가 2천만 원 이하로 제한될 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "when",
      text: "임대차계약서의 잔금지급일과 전입일 중 빠른 날로부터 3개월 안에 신청한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
    {
      id: "no-duplicate",
      text: "주택도시기금 대출, 은행 전세자금대출, 주택담보대출을 이미 이용 중이면 받을 수 없고, 공공임대주택에 살고 있으면 원칙적으로 받을 수 없다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["nhuf"],
    },
  ],

  policy: { history: [], applications: [] },

  planning: {
    roles: ["housing"],
    age: { min: 19, max: 34, claimIds: ["target"] },
    repayable: { claimIds: ["term"] },
  },

  revisions: [{ version: 1, date: "2026-10-04", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
