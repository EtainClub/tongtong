import type { PathInput } from "../path-schema";

/*
 * 자취하는 대학생 — 경로 견본 (청사진 설계 9.3, goalKind degree).
 *
 * 학부 1학년(0개월) → 학부 3학년(24) → 학부 4학년(36) → 졸업(48)을 가정한다. 학기·휴학은 사람마다 다르다.
 * 칸의 why는 편집자 설명이다 — 사실은 각 정책 항목에 있다. caveat 문장은 항목의 검증된 claim을 그대로 옮겼다.
 * 2026-10-08 공개 — 모든 칸의 항목이 공개 항목이다(validatePath가 확인한다).
 */
export const campusLivingAlone = {
  id: "campus-living-alone",
  publishStatus: "published",
  goalKind: "degree",
  title: "자취하는 대학생 — 학부 1학년부터 졸업까지",
  summary: "집을 떠나 학교에 다닌다면 등록금·월세·교통·문화비를 학년 순서대로 놓고, 졸업 전 경험과 자격까지 챙겼어요.",
  startStage: "undergrad",

  milestones: [
    { id: "freshman", label: "학부 1학년", offsetMonths: 0, stage: "undergrad" },
    { id: "junior", label: "학부 3학년", offsetMonths: 24 },
    { id: "senior", label: "학부 4학년", offsetMonths: 36 },
    { id: "graduate", label: "졸업", offsetMonths: 48, stage: "graduated_unemployed" },
  ],

  slots: [
    { id: "scholarship", policyId: "national-scholarship", milestoneId: "freshman", fromOffset: 0, toOffset: 47, role: "funding", why: "학기마다 신청해 등록금 부담을 던다." },
    { id: "loan", policyId: "income-contingent-loan", milestoneId: "freshman", fromOffset: 0, toOffset: 47, role: "funding", why: "장학금으로 모자라는 등록금과 생활비를 빌릴 수 있다 — 갚아야 하는 돈이다." },
    { id: "rent", policyId: "youth-monthly-rent", milestoneId: "freshman", fromOffset: 0, toOffset: 23, role: "housing", why: "처음 자취를 시작한 두 해의 월세 부담을 던다." },
    { id: "culture", policyId: "youth-culture-pass", milestoneId: "freshman", fromOffset: 0, toOffset: 11, role: "living", why: "대상 나이일 때 공연·전시·영화·책에 쓸 문화비를 받는다." },
    { id: "transit", policyId: "everyone-transit-card", milestoneId: "freshman", fromOffset: 0, toOffset: 47, role: "living", why: "통학 교통비 일부를 돌려받는다." },
    { id: "happy-housing", policyId: "happy-housing", milestoneId: "junior", fromOffset: 24, toOffset: 59, role: "housing", why: "월세 지원이 끝나면 시세보다 싼 공공임대로 옮겨 볼 수 있다." },
    { id: "teams", policyId: "student-startup-teams", milestoneId: "junior", fromOffset: 24, toOffset: 35, role: "experiment", why: "관심 있는 문제가 있으면 팀을 꾸려 작게 시험해 본다." },
    { id: "exam-fee", policyId: "exam-fee-support", milestoneId: "junior", fromOffset: 24, toOffset: 47, role: "skill", why: "졸업 전에 전공 관련 기술자격을 따 둔다." },
    { id: "work", policyId: "work-experience", milestoneId: "senior", fromOffset: 36, toOffset: 47, role: "experiment", why: "방학에 인턴·프로젝트로 일을 한 번 겪어 본다." },
    { id: "learning-card", policyId: "tomorrow-learning-card", milestoneId: "senior", fromOffset: 36, toOffset: 59, role: "skill", why: "졸업이 1년 안으로 들어오면 카드를 받아 직무 훈련을 시작한다." },
  ],

  caveats: [
    {
      id: "rent-once",
      text: "청년월세 지원은 실제로 내는 월세 가운데 최대 월 20만 원을, 최대 24개월(회) 지원한다. 생애 한 번만 받을 수 있다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "rent-income",
      text: "청년월세 지원은 부모님 가구(원가구)가 기준 중위소득 100% 이하, 청년 본인 가구가 기준 중위소득 60% 이하여야 한다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["bokjiro-2026-03-20"],
    },
    {
      id: "culture-pass-age",
      text: "청년문화예술패스의 2026년 대상은 올해 19·20세가 되는 2006년생과 2007년생이다.",
      assertionType: "FACT",
      verified: true,
      sourceIds: ["korea-2026-02-09"],
    },
  ],
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
      id: "korea-2026-02-09",
      title: "19·20세 청년에 '문화예술패스' 발급…최대 20만 원까지",
      url: "https://www.korea.kr/news/policyNewsView.do?newsId=148959296",
      publisher: "문화체육관광부 (대한민국 정책브리핑)",
      publishedAt: "2026-02-09",
      type: "official",
      license: "link-only",
    },
  ],

  revisions: [{ version: 1, date: "2026-10-08", material: true, summary: "첫 작성", claimIds: [] }],
  reviewedAt: "2026-10-08",
} satisfies PathInput;
