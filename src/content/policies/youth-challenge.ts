import type { PolicyInput } from "../schema";

/*
 * 08. 청년도전지원사업 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-challenge.ts에 있다 (청사진 설계 2장).
 */
export const youthChallenge = {
  id: "youth-challenge",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "employment",
  lifeStages: ["job_seeking"],

  name: "청년도전지원사업",
  summary: "구직을 멈춘 18~34세 청년에게 자신감 회복·구직의욕 프로그램과 참여수당을 지원한다.",

  sources: [
    {
      id: "youth-up",
      title: "청년도전지원사업 안내",
      url: "https://youth-up.kr/challenge-info",
      publisher: "고용노동부 청년도전지원사업",
      type: "official",
      license: "link-only",
    },
    {
      id: "korea-actually-2022-11-10",
      title: "청년도전지원사업, 구직단념청년의 구직의욕 고취·자신감 회복이 목적 (사실은 이렇습니다)",
      url: "https://www.korea.kr/briefing/actuallyView.do?newsId=148908090",
      publisher: "기획재정부·고용노동부 (대한민국 정책브리핑)",
      publishedAt: "2022-11-10",
      type: "official",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "purpose",
      text: "구직을 멈춘 청년 등의 경제활동 참여와 노동시장 복귀를 돕기 위해 자신감 회복, 구직의욕 높이기 같은 맞춤형 프로그램을 제공한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "target",
      text: "구직단념청년 유형은 18~34세로, 신청일 전 6개월 이상 취업·교육·훈련 이력이 없고 상담원 문답표 점수가 21점 이상(30점 만점)이어야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "other-groups",
      text: "자립준비청년, 청소년복지시설 입·퇴소자, 북한이탈청년 등 18~34세의 다른 대상 유형도 있고, 지자체가 인정한 청년도 참여할 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "programs",
      text: "단기(5주·40시간 이상) 참여수당 50만 원, 중기(15주·120시간 이상) 150만 원, 장기(25주·200시간 이상) 250만 원이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "incentive",
      text: "중기·장기는 이수 20만 원, 구직활동 30만 원, 취업 최대 50만 원의 인센티브가 더해진다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
    {
      id: "contact",
      text: "문의는 고용노동부 고객상담센터 1350.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["youth-up"],
    },
  ],

  // 2022년 비판과 정부 설명. 그 뒤 취업 인센티브가 생겼다 — 그래서 "있었다"로 쓴다 (docs/counterpoint-candidates-2026-10-04.md).
  counterpoints: [
    {
      id: "cp-allowance-without-job",
      text: "취업하지 못해도 프로그램을 마치기만 하면 참여수당을 모두 받는 구조라는 비판이 있었다. 정부는 이 사업의 목적이 구직의욕과 자신감을 되찾게 하는 것이라고 설명했다.",
      assertionType: "CLAIM",
      assertedBy: "서울경제 보도(2022-11-09), 정책브리핑 「사실은 이렇습니다」에 실림",
      verified: true,
      sourceIds: ["korea-actually-2022-11-10"],
    },
  ],

  policy: { history: [], applications: [] },

  // 청사진 계획 정보 (청사진 설계 4.4). 참여 기간은 단기·중기·장기로 달라 durationMonths를 두지 않는다.
  planning: {
    roles: ["safety"],
    age: { min: 18, max: 34, claimIds: ["target", "other-groups"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-04",
} satisfies PolicyInput;
