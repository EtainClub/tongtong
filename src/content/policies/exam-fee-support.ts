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
    {
      id: "youth-plan-2",
      title: "제2차 청년정책 기본계획 ('26~'30)",
      url: "https://www.opm.go.kr/_res/opm/etc/opm_youth_plan2.pdf",
      // 표지에 "2025. 12."만 있다 — 날짜를 지어내지 않는다.
      publisher: "관계부처 합동 (국무조정실)",
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
      text: "지원은 1인당 연간 3회까지다. 나이 기준에 들면 해마다 3회씩 받는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026", "hrdk-2025"],
    },
    {
      id: "age",
      text: "2026년 안내 기준으로 대상은 만 34세 이하(1991년 1월 1일 이후 출생) 청년 누구나다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
    {
      id: "budget",
      text: "신청은 2026년 1월 6일부터 예산이 소진될 때까지다. 예산이 소진되면 개인별로 남은 횟수와 상관없이 지원받을 수 없고, 소진이 예상되면 미리 공지한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
    {
      id: "continued-2026",
      text: "2026년에도 지원이 이어지며, 세부 기준은 Q-Net 공고의 첨부 문서에 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
    {
      id: "auto-apply",
      text: "따로 신청하지 않고, Q-Net에서 원서를 접수할 때 자동으로 적용된다. 원하지 않으면 '지원받지 않기'를 고를 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
    {
      id: "no-show",
      text: "감면된 응시료로 결제하면 연간 횟수가 차감된다. 접수를 취소하면 횟수가 돌아오지만, 접수한 뒤 시험을 보지 않으면 차감된 횟수는 돌아오지 않는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["qnet-2026"],
    },
  ],

  counterpoints: [
    {
      id: "cp-scope",
      text: "지원은 한국산업인력공단이 시행하는 국가기술자격시험(488개 종목)에만 적용된다. 대한상공회의소 등 다른 기관이 시행하는 국가기술자격은 대상이 아니다. 정부는 제2차 청년정책 기본계획(2026~2030)에서 지원 종목을 대한상공회의소 등 10개 기관 소관 540개로 넓히겠다고 밝혔지만, 2026년 안내는 여전히 한국산업인력공단 시행 시험만 지원한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-plan-2", "qnet-2026"],
    },
  ],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4). 나이 기준은 2026년 안내다.
  planning: {
    roles: ["skill"],
    age: { max: 34, claimIds: ["age"] },
  },

  revisions: [
    { version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] },
    {
      version: 2,
      date: "2026-10-08",
      material: true,
      summary: "2026년 안내(Q-Net 첨부)로 나이 기준을 1991년 1월 1일 이후 출생으로 바꾸고, 자동 적용·횟수 차감 규칙과 대상 종목의 한계를 더했다.",
      claimIds: ["age", "count", "budget", "auto-apply", "no-show", "cp-scope"],
    },
  ],
  reviewedAt: "2026-10-08",
} satisfies PolicyInput;
