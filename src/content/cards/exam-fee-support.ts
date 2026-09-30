import type { CardInput } from "../schema";

/*
 * 05. 국가기술자격 응시료 지원
 *
 * 원 컨셉은 근거 문장에 "1인당 총 3회"라고 적었지만, 공단 안내는 "1인당 연간 3회"다.
 * 훅 질문("1년에 몇 번까지?")이 맞고 컨셉의 사실 문장이 틀렸다.
 *
 * 2026년 세부 기준은 Q-net 공고의 첨부 문서에만 있어 확인하지 못했다. 연령·횟수 claim은
 * 2025년 안내를 근거로 두고 그 사실을 문장에 적었다 — 편집자가 2026년 첨부로 교체할 것.
 */
export const examFeeSupport = {
  id: "exam-fee-support",
  publishStatus: "draft",
  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["college", "job_seeking"],

  shortTitle: "국가기술자격 응시료 지원",
  hook: "자격증 시험비를 절반만 낸다?",
  shorts: [
    "취업 준비하면서",
    "자격증 시험 몇 번 봤나요?",
    "청년이라면",
    "국가기술자격 시험 응시료를 50% 지원받을 수 있습니다.",
    "하지만 무제한은 아닙니다.",
    "1년에 몇 번까지 가능할까요?",
  ],

  flow: { trust: true, opinion: true },

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

  game: {
    type: "slider",
    question: "1년에 몇 번까지 지원받을 수 있을까?",
    premise: "2025년 안내 기준이에요.",
    min: 1,
    max: 10,
    step: 1,
    unit: "회",
    answer: 3,
    claimIds: ["count"],
  },

  reveal: { claimIds: ["rate", "count", "age", "budget", "continued-2026"] },

  suggestedQuestions: ["기사시험도 돼?", "이미 시험을 봤다면 소급돼?", "어디서 신청해?", "2026년 나이 기준은?"],

  policy: { history: [], applications: [] },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies CardInput;
