import type { PolicyInput } from "../schema";

/*
 * 02. 청년월세 지원 — 정책 항목(사실).
 *
 * 따져보기 경험(훅·게임·판단)과 편집 메모는 cards/youth-monthly-rent.ts에 있다 (청사진 설계 2장).
 */
export const youthMonthlyRent = {
  id: "youth-monthly-rent",
  publishStatus: "published",

  audience: ["young_adult"],
  category: "housing",
  lifeStages: ["living_alone", "housing", "job_seeking", "college"],

  name: "청년월세 지원",
  summary: "부모와 따로 사는 무주택 청년에게 월세를 월 최대 20만 원, 최대 24개월 지원한다. 생애 한 번만 받는다.",

  sources: [
    {
      id: "bokjiro-2026-03-20",
      title: "2026년 청년월세 지원 신청 안내",
      url: "https://m.bokjiro.go.kr/ssis-tem/cms/mob/customer/notice/1309500_1155.html",
      publisher: "복지로",
      publishedAt: "2026-03-20",
      type: "official",
      license: "link-only",
    },
    {
      id: "seoulpn-2023-06-20",
      title: "청년월세 지원받기 ‘바늘구멍’… 수도권 지자체 예산 30%도 못 써",
      url: "https://go.seoul.co.kr/news/newsView.php?id=20230620002002",
      publisher: "서울신문 서울Pn",
      publishedAt: "2023-06-20",
      type: "press",
      license: "link-only",
    },
  ],

  claims: [
    {
      id: "target",
      text: "부모와 따로 사는 19~34세 무주택 청년이 대상이다. 2026년 신청 가능 출생연도는 1991~2007년생이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "income",
      text: "부모님 가구(원가구)는 기준 중위소득 100% 이하, 청년 본인 가구는 기준 중위소득 60% 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "amount",
      text: "실제로 내는 월세 가운데 최대 월 20만 원을, 최대 24개월(회) 지원한다. 생애 한 번만 받을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "excluded",
      text: "임차보증금과 관리비 등은 지원하지 않는다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "max-total",
      text: "월 20만 원 × 24개월, 받을 수 있는 최대 금액은 480만 원이다. 월세가 20만 원보다 적으면 그만큼 줄어든다.",
      assertionType: "INTERPRETATION",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "quota",
      text: "2026년 신규 수혜자는 전국 6만 명을 모집할 예정이며, 지역마다 선정 인원이 다르다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
  ],

  counterpoints: [
    {
      id: "cp-strict-income",
      text: "2023년 청년월세 특별지원 때 수도권 지자체 상당수가 예산의 30%도 쓰지 못했다(서울 29%). 신청자 다수가 소득 기준에 맞지 않아 탈락했는데, 청년 본인 소득 기준(중위소득 60%)이 최저임금 월급보다 낮아 일하는 청년은 사실상 받기 어렵다는 지적이었다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["seoulpn-2023-06-20"],
    },
  ],

  policy: {
    history: [],
    applications: [
      {
        label: "2026년",
        startAt: "2026-03-30T09:00:00+09:00",
        endAt: "2026-05-29T16:00:00+09:00",
        url: "https://www.bokjiro.go.kr/ssis-tbu/twataa/wlfareInfo/moveTWAT52011M.do?wlfareInfoId=WLF00004661",
        note: "청년 본인이 복지로에서 온라인 신청.",
        sourceIds: ["bokjiro-2026-03-20"],
      },
    ],
  },

  // 청사진 계획 정보 (청사진 설계 4.4). 다음 해 모집 근거가 claim에 없어 recurrence는 두지 않는다.
  planning: {
    roles: ["housing"],
    age: { min: 19, max: 34, claimIds: ["target"] },
    durationMonths: { value: 24, claimIds: ["amount"] },
  },

  revisions: [{ version: 1, date: "2026-09-29", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-09-30",
} satisfies PolicyInput;
