import type { PolicyInput } from "../schema";

/*
 * 05. 국가기술자격 응시료 지원 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/exam-fee-support.ts에 있다 (청사진 설계 2장).
 */
export const examFeeSupport = {
  id: "exam-fee-support",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["college", "job_seeking"],

  name: "국가기술자격 응시료 지원",
  summary: "청년이 국가기술자격시험을 볼 때 응시료의 50%를 지원한다. 예산이 떨어지면 마감된다.",

  sources: [
    {
      id: "moel-policy",
      title: "청년 국가기술자격 응시료 지원 사업",
      url: "https://www.moel.go.kr/policyitrd/policyItrdView.do?policy_itrd_sn=100",
      publisher: "고용노동부",
      type: "official",
      license: "link-only",
    },
    {
      id: "hrdk-2025",
      title: "청년 국가기술자격시험 응시료 지원사업 (2025년 안내)",
      url: "https://hrdc.hrdkorea.or.kr/hrdc/193642",
      publisher: "한국산업인력공단",
      publishedAt: "2025-02-10",
      type: "official",
      license: "link-only",
    },
    {
      id: "qnet-2026",
      title: "2026년 청년 국가기술자격 응시료 지원 안내",
      url: "https://q-net.or.kr/man004.do?ARTL_SEQ=5251124&BOARD_ID=Q001&gId=&gSite=Q&id=man00402",
      publisher: "한국산업인력공단 (Q-Net)",
      publishedAt: "2026-01-06",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "rate",
      text: "청년에게 국가기술자격시험 응시료의 50%를 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["moel-policy", "hrdk-2025"],
    },
    {
      id: "count",
      text: "2025년 안내 기준으로 지원은 1인당 연간 3회까지다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["hrdk-2025"],
    },
    {
      id: "age",
      text: "2025년 안내 기준으로 대상은 34세 이하(1990년 1월 1일 이후 출생) 청년 응시자다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["hrdk-2025"],
    },
    {
      id: "budget",
      text: "지원은 예산이 소진되면 마감된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["hrdk-2025"],
    },
    {
      id: "continued-2026",
      text: "2026년에도 지원이 이어지며, 세부 기준은 Q-Net 공고의 첨부 문서에 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
  ],

  counterpoints: [],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4). 나이 기준은 2025년 안내다.
  planning: {
    roles: ["skill"],
    age: { max: 34, claimIds: ["age"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
