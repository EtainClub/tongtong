import type { PolicyInput } from "../schema";

/*
 * 국민내일배움카드 — 정책 항목(사실). 카드 없음.
 *
 * 청사진 취업 경로의 졸업 전후 역량 칸 (청사진 설계 9.3). 2026-10-04 원문 대조(docs/source-check-career-2026-10-04.md) 뒤 공개.
 * 대학생 제외 문구가 고용24("2년 이상")와 다른 안내("2년 초과")에서 다르다 — 실제 발급 시스템인 고용24를 따랐다.
 */
export const tomorrowLearningCard = {
  id: "tomorrow-learning-card",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "education",
  lifeStages: ["college", "job_seeking", "employed"],

  name: "국민내일배움카드",
  summary: "직업훈련이 필요한 사람에게 카드를 발급해 5년간 훈련비를 300만 원(일부 500만 원)까지 지원한다. 훈련비 일부는 본인이 낸다.",

  sources: [
    {
      id: "work24-issue",
      title: "국민내일배움카드 발급안내",
      url: "https://www.work24.go.kr/hr/h/a/1100/selectIssuGudn.do",
      publisher: "고용노동부 (고용24)",
      type: "official",
      license: "link-only",
    },
    {
      id: "moel-policy",
      title: "국민내일배움카드 (정책 소개)",
      url: "https://www.moel.go.kr/policyitrd/policyItrdView.do?policy_itrd_sn=216",
      publisher: "고용노동부",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "who",
      text: "직업훈련이 필요한 국민 누구나 발급받을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue", "moel-policy"],
    },
    {
      id: "excluded-students",
      text: "졸업까지 남은 수업연한이 2년 이상인 대학·대학원 재학생과 고등학교 1~2학년생은 발급 대상에서 빠진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "excluded-others",
      text: "공무원·사립학교 교직원, 75세 이상, 월 임금 300만 원 이상인 45세 미만 대규모 기업 근로자, 월 소득 500만 원 이상 특수형태근로종사자 등도 제외된다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "limit",
      text: "카드 유효기간은 5년이고 훈련비 지원 한도는 300만 원이다. 5년이 지나면 잔액은 사라진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "extra",
      text: "한도를 다 쓴 뒤 기간제·파견·단시간·일용 근로자, 기초생활수급자·차상위계층, 장애인, 자립준비청년 등은 유효기간 안에 한 번 200만 원을 더 받을 수 있다. 총 한도는 500만 원을 넘지 않는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "copay",
      text: "훈련과정 직종의 평균 취업률, 근로장려금 수급 여부, 국민취업지원제도 참여 유형 등에 따라 정부승인 훈련비의 0~55%를 본인이 낸다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue"],
    },
    {
      id: "apply",
      text: "고용24에서 온라인으로 신청하거나 거주지 관할 고용센터에 가서 신청한다. 문의는 1350.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["work24-issue", "moel-policy"],
    },
  ],

  policy: { history: [], applications: [] },

  // 대학생 제외는 학년이 아니라 남은 수업연한 기준이라 stages로 좁히지 않는다 — 경로 견본이 졸업 1년 전부터 칸을 둔다.
  planning: {
    roles: ["skill"],
    durationMonths: { value: 60, claimIds: ["limit"] },
  },

  revisions: [{ version: 1, date: "2026-10-04", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
