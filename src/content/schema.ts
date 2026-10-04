import { z } from "zod";

import { YearMonth } from "../lib/blueprint/month";
import { endOf, startOf } from "../lib/policy-state";

/*
 * 통통 콘텐츠 스키마.
 *
 * Source·Claim은 잼통(src/content/schema.ts)의 것을 그대로 옮겼다.
 * 세 서비스가 같은 근거 문법을 써야 카드가 서로를 가리킬 수 있다.
 *
 * 불변식은 세 곳에 있다. 모양은 zod가, 참조 무결성은 validatePolicy()·validateCard()가,
 * 항목 사이의 관계는 validatePolicies()가 본다. 모두 `pnpm validate`에서 빌드 전에 돈다 (검토 문서 4.1).
 */

/** 날짜 문자열. 시각이 없으면 한국 시간 그날 하루 전체로 읽는다 (lib/policy-state). */
const DateOrDateTime = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);

// ── 근거 ─────────────────────────────────────────────────────────────

export const AssertionType = z.enum(["FACT", "CLAIM", "INTERPRETATION", "OPINION"]);
export type AssertionType = z.infer<typeof AssertionType>;

/** 저작권 취급 등급. link-only 자료는 원문을 보관하지 않는다. */
export const SourceLicense = z.enum(["public", "quotable", "link-only"]);

export const SourceType = z.enum([
  "official",     // 정부·공공기관 공식 자료
  "statistics",   // 통계
  "legislative",  // 국회·의회·조례
  "judicial",     // 판결·수사 자료
  "interview",    // 인터뷰·발언
  "press",        // 언론 보도
  "research",     // 연구 자료
]);

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.url().optional(),
  publisher: z.string(),
  publishedAt: z.iso.date().optional(),
  type: SourceType,
  license: SourceLicense,
  archivedUrl: z.url().optional(),
  /** license가 quotable/public일 때만 허용되는 짧은 인용. */
  quote: z.string().optional(),
});
export type Source = z.infer<typeof sourceSchema>;

export const claimSchema = z.object({
  id: z.string(),
  text: z.string(),
  assertionType: AssertionType,
  /** CLAIM이면 누구의 주장인지 반드시 밝힌다. */
  assertedBy: z.string().optional(),
  /** ★ 불변식: 근거 없는 주장은 존재할 수 없다. */
  sourceIds: z.array(z.string()).min(1, "근거 없는 Claim은 허용되지 않는다"),
  /** 편집자가 원문과 대조했는가. false면 UI에 미검증 표식이 붙는다. */
  verified: z.boolean().default(false),
  /**
   * 이 날짜가 지나면 사실이 아니게 되는 claim. "9월 이용분까지" 같은 것.
   * 상태 필드를 두지 않고 날짜에서 계산한다 (검토 문서 4.3).
   */
  validUntil: z.iso.date().optional(),
});
export type Claim = z.infer<typeof claimSchema>;

// ── 게임 ─────────────────────────────────────────────────────────────
//
// 정답은 언제나 claim을 가리킨다. 정책이 바뀌면 claim 하나를 고치면 되고,
// 정답이 근거 없이 코드에 박히지 않는다 (검토 문서 4.2).
// 모든 조작은 버튼으로 끝낼 수 있어야 한다 — 드래그는 지름길일 뿐이다 (로드맵 4.2).

const choiceOption = z.object({ id: z.string(), label: z.string() });

export const multipleChoiceGame = z.object({
  type: z.literal("multiple_choice"),
  question: z.string(),
  options: z.array(choiceOption).min(2),
  answerOptionId: z.string(),
  claimIds: z.array(z.string()).min(1),
});

export const guessAmountGame = z.object({
  type: z.literal("guess_amount"),
  question: z.string(),
  /** 계산의 전제. 화면에 그대로 보인다. */
  premise: z.string(),
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  step: z.number().int().positive(),
  /** 조건마다 답이 다를 수 있다 — 일반형 6% / 우대형 12%. */
  answers: z.array(z.object({ label: z.string(), value: z.number().int() })).min(1),
  claimIds: z.array(z.string()).min(1),
});

/**
 * "나도 대상일까?" — 한 단계씩 묻는다.
 *
 * 답은 브라우저에서만 계산하고 어디에도 저장하지 않는다. 나이·소득·주거는
 * 판단 기록에 필요 없는 개인정보다 (검토 문서 3장 5번).
 * 결과는 "가능성 높음 / 확인 필요 / 해당 안 됨"까지만 말한다. "대상입니다"라고
 * 확정하지 않는다 — 최종 판정은 신청 기관이 한다.
 */
export const EligibilityOutcome = z.enum(["pass", "fail", "unknown"]);
export const eligibilityGame = z.object({
  type: z.literal("eligibility"),
  question: z.string(),
  steps: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        answers: z.array(z.object({ label: z.string(), outcome: EligibilityOutcome })).min(2),
        claimIds: z.array(z.string()).min(1),
      }),
    )
    .min(1),
});

/** 숫자 하나를 맞힌다 — 금액이 아닌 것(횟수·개월·%). 금액은 guess_amount. */
export const sliderGame = z.object({
  type: z.literal("slider"),
  question: z.string(),
  premise: z.string().optional(),
  min: z.number().int(),
  max: z.number().int(),
  step: z.number().int().positive(),
  /** 값 뒤에 붙는 단위. "회", "개월", "%". */
  unit: z.string().min(1),
  answer: z.number().int(),
  claimIds: z.array(z.string()).min(1),
});

/** 네/아니요. 경계에 있는 사례를 묻는 데 쓴다 ("연소득 5천만 원이면?"). */
export const yesNoGame = z.object({
  type: z.literal("yes_no"),
  question: z.string(),
  answer: z.boolean(),
  /** 공개 때 보여 주는 한 줄 사실. claim에서 옮겨 적는다. */
  note: z.string(),
  claimIds: z.array(z.string()).min(1),
});

/** 순서 맞히기. 항목의 처음 순서가 공개 전 화면에 보이는 순서다 — 정답과 같으면 안 된다. */
export const sortGame = z.object({
  type: z.literal("sort"),
  question: z.string(),
  /** value는 공개 때 항목 옆에 붙는 값("최대 720만 원"). */
  items: z.array(z.object({ id: z.string(), label: z.string(), value: z.string() })).min(3).max(6),
  answerOrder: z.array(z.string()),
  claimIds: z.array(z.string()).min(1),
});

/** 예전과 지금(또는 지금과 다음) 중 고른다. 고른 뒤 두 칸의 실제 내용이 열린다. */
const period = z.object({ label: z.string(), detail: z.string() });
export const beforeAfterGame = z.object({
  type: z.literal("before_after"),
  question: z.string(),
  before: period,
  after: period,
  answer: z.enum(["before", "after"]),
  claimIds: z.array(z.string()).min(1),
});

/**
 * 총액을 항목에 나눠 본다. 공개는 "정답"이 아니라 실제 구성이다 (로드맵 4.2).
 * actual의 합은 total과 같아야 한다.
 */
export const budgetGame = z.object({
  type: z.literal("budget"),
  question: z.string(),
  premise: z.string().optional(),
  total: z.number().int().positive(),
  step: z.number().int().positive(),
  items: z.array(z.object({ id: z.string(), label: z.string(), actual: z.number().int().nonnegative() })).min(2).max(6),
  claimIds: z.array(z.string()).min(1),
});

export const gameSchema = z.discriminatedUnion("type", [
  multipleChoiceGame,
  guessAmountGame,
  eligibilityGame,
  sliderGame,
  yesNoGame,
  sortGame,
  beforeAfterGame,
  budgetGame,
]);
export type Game = z.infer<typeof gameSchema>;

// ── 정책 ─────────────────────────────────────────────────────────────

/**
 * 정책의 이력. "현 정부 정책"이라는 라벨 대신 날짜와 출처로만 말한다.
 * 새로 생긴 것과 이전부터 있다 확대된 것을 같은 방식으로 묶지 않기 위해서다.
 */
export const PolicyEventKind = z.enum(["introduced", "expanded", "changed", "renamed", "ended"]);

export const applicationSchema = z.object({
  /** "2차", "2026년 정기" — 회차가 여럿일 수 있다. */
  label: z.string(),
  startAt: DateOrDateTime,
  endAt: DateOrDateTime,
  /** 공식 신청처. 없으면 화면이 출처로 대신 보낸다. */
  url: z.url().optional(),
  note: z.string().optional(),
  sourceIds: z.array(z.string()).min(1),
});
export type Application = z.infer<typeof applicationSchema>;

// ── 정책 항목과 카드 ───────────────────────────────────────────────────
//
// 콘텐츠는 두 층이다 (docs/blueprint-design.md 2장).
//   정책 항목(policies/*.ts) — 사실: claim·출처·신청 회차·개정 이력·계획 정보
//   카드 경험(cards/*.ts)    — 따져보기: 훅·숏츠·게임·판단 흐름
// 카드는 claim을 갖지 않는다. 같은 id의 항목을 가리키고, 앱은 둘을 합친 Card를 쓴다(resolveCard).

export const Audience = z.enum(["youth", "young_adult"]);
export type Audience = z.infer<typeof Audience>;

export const LifeStage = z.enum([
  "college",
  "job_seeking",
  "employed",
  "living_alone",
  "military",
  "startup",
  "housing",
  "asset_building",
]);

export const Category = z.enum(["asset", "housing", "employment", "startup", "transport", "culture", "education"]);

/** 청사진에서 이 정책이 하는 일 (청사진 설계 4.3). */
export const PlacementRole = z.enum([
  "funding", // 학비·생활비
  "housing",
  "asset",
  "skill", // 역량·자격
  "experiment", // 일경험·창업 실험
  "startup", // 창업 준비·운영
  "employment", // 취업·근속
  "living", // 교통·문화
  "safety", // 공백기 안전망
]);

/** 학적·단계. LifeStage보다 좁은 조건을 적을 때 쓴다 (청사진 설계 4.4). */
export const PlanStage = z.enum([
  "undergrad",
  "grad_master",
  "grad_phd",
  "leave_of_absence",
  "graduated_unemployed",
  "employed",
  "founder_pre",
  "founder_early",
  "military",
]);

const claimIds = z.array(z.string()).min(1);
const linkedPolicy = z.object({ policyId: z.string(), claimIds });

/**
 * 청사진 점검의 재료 (청사진 설계 4.4). 값마다 근거 claim을 가리킨다 —
 * 게임 정답이 claim을 가리키는 것과 같은 원칙이다.
 */
export const planningSchema = z.object({
  roles: z.array(PlacementRole).min(1),
  /** 만 나이 조건. 경계는 claim에 적힌 대로. */
  age: z.object({ min: z.number().int().optional(), max: z.number().int().optional(), claimIds }).optional(),
  /** 지원 기간(개월). */
  durationMonths: z.object({ value: z.number().int().positive(), claimIds }).optional(),
  /** 언제 다시 열리나 — 예상 일정의 근거. 근거 claim이 없으면 비운다 — 청사진은 미정으로 그린다. */
  recurrence: z.object({ kind: z.enum(["once", "annual", "rounds", "always"]), note: z.string().optional(), claimIds }).optional(),
  /** 함께 받을 수 없는 정책. 양쪽 항목에 모두 적는다 — validatePolicies가 대칭을 본다. */
  exclusiveWith: z.array(linkedPolicy).default([]),
  /** 이게 끝나야(또는 있어야) 쓸 수 있는 것. */
  after: z.array(linkedPolicy).default([]),
  /** 대상이 되는 학적·단계. lifeStages보다 좁은 조건이 있을 때만. */
  stages: z.array(PlanStage).default([]),
  /**
   * 사업이 끝나기로 된 달 (청사진 설계 4.4, 검토 A-6). history의 `ended`는 끝난 뒤에만 적을 수 있어서
   * 미래의 종료는 여기에 둔다. 이 달 뒤에 시작하는 배치는 미정이다(lib/blueprint/certainty).
   */
  endsAt: z.object({ month: YearMonth, claimIds }).optional(),
  /** 갚아야 하는 돈 — 대출 (검토 A-7). 화면이 "갚아야 해요"를 붙여 혜택과 같은 모양으로 보이지 않게 한다. */
  repayable: z.object({ claimIds }).optional(),
});
export type Planning = z.infer<typeof planningSchema>;

export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, "id는 ascii 슬러그");
export const publishStatusSchema = z.enum(["draft", "published"]).default("draft");

/** 개정 이력 — 항목과 경로 견본이 같이 쓴다. version은 1부터 1씩 오른다 (validateRevisions). */
export const revisionsSchema = z
  .array(
    z.object({
      version: z.number().int().positive(),
      date: z.iso.date(),
      material: z.boolean(),
      summary: z.string(),
      claimIds: z.array(z.string()),
    }),
  )
  .min(1);

/** 정책 항목 — 사실. 카드 경험 필드(훅·게임 등)가 섞이지 않게 모르는 필드는 거절한다. */
export const policySchema = z.strictObject({
  id: slugSchema,
  publishStatus: publishStatusSchema,
  audience: z.array(Audience).min(1),
  category: Category,
  lifeStages: z.array(LifeStage),

  name: z.string(),
  /** 한 줄 요약. 사실만, 과장 없이 — 훅이 아니다. 정책 페이지에 쓴다. */
  summary: z.string().optional(),

  claims: z.array(claimSchema).min(1),
  sources: z.array(sourceSchema).min(1),
  /** 비판·한계. 카드를 공개하려면 1개 이상 (검토 문서 3장 4번). 카드 없는 항목은 선택. */
  counterpoints: z.array(claimSchema).default([]),

  policy: z.object({
    history: z.array(
      z.object({
        date: z.iso.date(),
        kind: PolicyEventKind,
        summary: z.string(),
        sourceIds: z.array(z.string()).min(1),
      }),
    ),
    applications: z.array(applicationSchema),
  }),

  /** 청사진 점검의 재료. 경로 견본에 넣으려면 있어야 한다. */
  planning: planningSchema.optional(),

  /**
   * 개정 이력. 마지막 version이 항목과 카드의 현재 버전이다.
   * material: 사용자가 알아야 하는 변경인가. 오탈자 수정은 false —
   * "새 정보" 배지와 재평가는 material인 것만 센다 (검토 문서 4.2).
   */
  revisions: revisionsSchema,

  /** 편집자가 마지막으로 원문 전체를 다시 대조한 날. */
  reviewedAt: z.iso.date(),

  /** 자매 서비스로 가는 길 (설계 12·57장). 통통은 복제하지 않고 보낸다 — 잼통 무슨 일이 있었나, 임통 누가 무슨 말을 했나. */
  links: z
    .object({
      /** 잼통에서 이 정책을 다룬 곳. */
      jamtong: z.object({ title: z.string(), url: z.url() }).optional(),
      /** 정책과 관련된 인물. 이름과 역할만 두고 자세한 것은 임통으로. */
      people: z.array(z.object({ name: z.string(), role: z.string(), imtongUrl: z.url() })).default([]),
    })
    .prefault({}),
});
export type Policy = z.infer<typeof policySchema>;
export type PolicyInput = z.input<typeof policySchema>;

/** 카드 경험 — 항목 위에 얹는 따져보기. 사실(claim)은 항목에만 있다 — 모르는 필드는 거절한다. */
export const cardExperienceSchema = z.strictObject({
  /** 같은 id의 정책 항목. 카드 id도 이것이다. */
  policyId: slugSchema,
  /** 공개하려면 항목도 공개여야 한다 (validateCard). */
  publishStatus: publishStatusSchema,

  /** 일부러 짧고 과장된 첫 문장. 첫 판단의 대상이다 (검토 문서 2.2). */
  hook: z.string(),
  /** 15초 숏츠 대본. 한 줄이 한 컷. */
  shorts: z.array(z.string()).min(1),
  /**
   * 대본으로 만든 유튜브 숏츠 (로드맵 M9-3, docs/shorts). 있으면 글자 씬 대신 보여 준다 — 글자 씬은 "글자로 보기"로 남는다.
   * 올리기 전에 대본의 숫자·비판 장면과 대조하고, 자막이 영상에 들어 있어야 한다.
   */
  video: z.object({ youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, "유튜브 영상 id 11자") }).optional(),

  /** 판단 단계를 카드마다 켜고 끈다. 탐색 카드는 둘 다 끈다 (검토 문서 2.7). */
  flow: z.object({ trust: z.boolean(), opinion: z.boolean() }),

  /**
   * 정책 평가의 이유 목록 (설계 14장 reasonCodes, 로드맵 M5). 고르는 것은 선택이다.
   * 긍정·부정을 섞어 한 목록으로 두고, 순서는 고정한다 — 고른 값에 따라 바꾸지 않는다.
   * 이유는 항목의 claim·비판에서 나온 것만 적는다.
   */
  reasonOptions: z
    .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: z.string() }))
    .max(6)
    .default([]),

  game: gameSchema,
  /** 게임 뒤 공개할 사실. */
  reveal: z.object({ claimIds: z.array(z.string()).min(1) }),
  suggestedQuestions: z.array(z.string()),

  /** 편집 메모. AI 안내 프롬프트에도 전달된다 — 말투 지침 같은 것. */
  tone: z.string().optional(),
});
export type CardExperience = z.infer<typeof cardExperienceSchema>;
export type CardExperienceInput = z.input<typeof cardExperienceSchema>;

/**
 * 앱이 쓰는 카드 — 항목과 카드 경험을 합친 모양 (resolveCard).
 * 피드·카드 화면·판단 API·AI 따져보기·집계는 모두 이것만 본다.
 */
export const cardSchema = policySchema
  .omit({ name: true, summary: true, planning: true })
  .extend({ shortTitle: z.string(), ...cardExperienceSchema.omit({ policyId: true, publishStatus: true }).shape });
export type Card = z.infer<typeof cardSchema>;

/**
 * 항목 + 카드 경험 → 카드. 카드 버전은 항목의 개정 이력을 따른다.
 * 필드를 하나씩 적는다 — 항목에만 있는 것(summary·planning)이 카드로 새지 않고, 빠뜨린 필드는 타입 오류가 된다.
 */
export function resolveCard(policy: Policy, experience: CardExperience): Card {
  if (policy.id !== experience.policyId) throw new Error(`카드 ${experience.policyId}에 다른 항목 ${policy.id}을 붙였다`);
  return {
    id: policy.id,
    publishStatus: experience.publishStatus,
    audience: policy.audience,
    category: policy.category,
    lifeStages: policy.lifeStages,
    shortTitle: policy.name,
    claims: policy.claims,
    sources: policy.sources,
    counterpoints: policy.counterpoints,
    policy: policy.policy,
    revisions: policy.revisions,
    reviewedAt: policy.reviewedAt,
    links: policy.links,

    hook: experience.hook,
    shorts: experience.shorts,
    flow: experience.flow,
    reasonOptions: experience.reasonOptions,
    game: experience.game,
    reveal: experience.reveal,
    suggestedQuestions: experience.suggestedQuestions,
    ...(experience.video !== undefined && { video: experience.video }),
    ...(experience.tone !== undefined && { tone: experience.tone }),
  };
}

export function cardVersion(card: Pick<Card, "revisions">): number {
  return card.revisions[card.revisions.length - 1].version;
}

// ── 참조 무결성 ──────────────────────────────────────────────────────

/** 게임 유형별 불변식. 정답이 가리키는 claim은 needClaim으로 확인한다. */
function validateGame(game: Game, needClaim: (where: string, ids: string[]) => void): string[] {
  const errors: string[] = [];
  if (game.type === "eligibility") {
    for (const step of game.steps) {
      needClaim(`game.steps.${step.id}`, step.claimIds);
      if (!step.answers.some((a) => a.outcome === "pass")) errors.push(`game.steps.${step.id} → 통과할 수 있는 답이 없다`);
    }
    return errors;
  }

  needClaim("game", game.claimIds);
  switch (game.type) {
    case "multiple_choice":
      if (!game.options.some((o) => o.id === game.answerOptionId)) errors.push(`game → 정답 "${game.answerOptionId}"가 선택지에 없다`);
      break;
    case "guess_amount":
      if (game.min >= game.max) errors.push("game → min이 max보다 작아야 한다");
      for (const answer of game.answers) {
        if (answer.value < game.min || answer.value > game.max) errors.push(`game → 정답 "${answer.label}"(${answer.value})이 슬라이더 범위 밖이다`);
      }
      break;
    case "slider":
      if (game.min >= game.max) errors.push("game → min이 max보다 작아야 한다");
      if (game.answer < game.min || game.answer > game.max) errors.push(`game → 정답(${game.answer})이 슬라이더 범위 밖이다`);
      if ((game.answer - game.min) % game.step !== 0) errors.push("game → 정답이 step 간격에 맞지 않는다");
      break;
    case "sort": {
      const ids = game.items.map((i) => i.id);
      const isPermutation = game.answerOrder.length === ids.length && ids.every((id) => game.answerOrder.includes(id));
      if (!isPermutation) errors.push("game → answerOrder는 items의 id를 한 번씩 모두 담아야 한다");
      else if (ids.every((id, i) => id === game.answerOrder[i])) errors.push("game → 처음 순서가 정답과 같다");
      break;
    }
    case "budget": {
      const sum = game.items.reduce((s, i) => s + i.actual, 0);
      if (sum !== game.total) errors.push(`game → 항목 합(${sum})이 total(${game.total})과 다르다`);
      if (game.total % game.step !== 0 || game.items.some((i) => i.actual % game.step !== 0)) errors.push("game → 금액이 step 간격에 맞지 않는다");
      break;
    }
    case "yes_no":
    case "before_after":
      break;
  }
  return errors;
}

/** planning의 불변식. 가리키는 항목의 존재·대칭은 validatePolicies가 본다. */
function validatePlanning(policyId: string, planning: Planning, needClaim: (where: string, ids: string[]) => void): string[] {
  const errors: string[] = [];
  if (planning.age) {
    needClaim("planning.age", planning.age.claimIds);
    const { min, max } = planning.age;
    if (min === undefined && max === undefined) errors.push("planning.age → min과 max 중 하나는 있어야 한다");
    if (min !== undefined && max !== undefined && min > max) errors.push("planning.age → min이 max보다 크다");
  }
  if (planning.durationMonths) needClaim("planning.durationMonths", planning.durationMonths.claimIds);
  if (planning.recurrence) needClaim("planning.recurrence", planning.recurrence.claimIds);
  if (planning.endsAt) needClaim("planning.endsAt", planning.endsAt.claimIds);
  if (planning.repayable) needClaim("planning.repayable", planning.repayable.claimIds);
  for (const link of [...planning.exclusiveWith, ...planning.after]) {
    if (link.policyId === policyId) errors.push(`planning → 자기 자신(${policyId})을 가리킨다`);
    needClaim(`planning ${link.policyId}`, link.claimIds);
  }
  return errors;
}

/**
 * 근거의 불변식 — claim·source id 중복, 없는 source, CLAIM의 발언자, link-only 인용.
 * 항목과 경로 견본이 같이 쓴다. needClaim·needSource는 나머지 필드가 근거를 가리키는지 볼 때 쓴다.
 */
export function checkEvidence(claims: readonly Claim[], sources: readonly Source[]) {
  const errors: string[] = [];
  const sourceIds = new Set(sources.map((s) => s.id));
  const claimIds = new Set<string>();

  for (const claim of claims) {
    if (claimIds.has(claim.id)) errors.push(`claim id 중복: ${claim.id}`);
    claimIds.add(claim.id);
    if (claim.assertionType === "CLAIM" && !claim.assertedBy) {
      errors.push(`claim "${claim.id}" → assertionType이 CLAIM인데 assertedBy가 없다`);
    }
    for (const id of claim.sourceIds) {
      if (!sourceIds.has(id)) errors.push(`claim "${claim.id}" → 없는 source "${id}"`);
    }
  }

  const seenSources = new Set<string>();
  for (const source of sources) {
    if (seenSources.has(source.id)) errors.push(`source id 중복: ${source.id}`);
    seenSources.add(source.id);
    if (source.quote && source.license === "link-only") {
      errors.push(`source "${source.id}" → link-only 자료는 인용을 담을 수 없다`);
    }
  }

  const needClaim = (where: string, ids: string[]) => {
    for (const id of ids) if (!claimIds.has(id)) errors.push(`${where} → 없는 claim "${id}"`);
  };
  const needSource = (where: string, ids: string[]) => {
    for (const id of ids) if (!sourceIds.has(id)) errors.push(`${where} → 없는 source "${id}"`);
  };
  return { errors, needClaim, needSource };
}

/** 개정 이력의 불변식 — version은 1부터 1씩, 날짜는 거꾸로 가지 않는다. */
export function checkRevisions(revisions: z.infer<typeof revisionsSchema>, needClaim: (where: string, ids: string[]) => void): string[] {
  const errors: string[] = [];
  revisions.forEach((rev, i) => {
    if (rev.version !== i + 1) errors.push(`revisions → version은 1부터 1씩 올라야 한다 (${i}번째가 ${rev.version})`);
    if (i > 0 && rev.date < revisions[i - 1].date) errors.push(`revisions → v${rev.version} 날짜가 거꾸로다`);
    needClaim(`revisions v${rev.version}`, rev.claimIds);
  });
  return errors;
}

/** 항목 하나의 불변식 — 참조 무결성과 공개 조건. 오류 목록이 비면 통과. */
export function validatePolicy(policy: Policy): string[] {
  const allClaims = [...policy.claims, ...policy.counterpoints];
  const { errors, needClaim, needSource } = checkEvidence(allClaims, policy.sources);

  for (const event of policy.policy.history) needSource(`policy.history ${event.date}`, event.sourceIds);
  for (const app of policy.policy.applications) {
    needSource(`policy.applications ${app.label}`, app.sourceIds);
    if (startOf(app.startAt) > endOf(app.endAt)) errors.push(`policy.applications ${app.label} → 시작이 끝보다 늦다`);
  }

  errors.push(...checkRevisions(policy.revisions, needClaim));

  if (policy.planning) errors.push(...validatePlanning(policy.id, policy.planning, needClaim));

  // 자매 서비스 링크는 그 서비스 주소로만 보낸다 (설계 57장).
  if (policy.links.jamtong && new URL(policy.links.jamtong.url).host !== "jamtong.kr") errors.push("links → jamtong은 jamtong.kr 주소여야 한다");
  for (const person of policy.links.people) {
    if (new URL(person.imtongUrl).host !== "im.jamtong.kr") errors.push(`links → ${person.name}의 주소는 im.jamtong.kr이어야 한다`);
  }

  // 공개 조건 — 초안은 여기서 멈춘다.
  if (policy.publishStatus === "published") {
    for (const claim of allClaims) {
      if (!claim.verified) errors.push(`공개 → claim "${claim.id}"가 검증 전이다`);
    }
  }

  return errors;
}

/**
 * 항목 사이의 불변식 — id 중복, planning이 가리키는 항목의 존재,
 * 함께 받을 수 없는 정책의 대칭, 선행 조건의 순환.
 */
export function validatePolicies(policies: readonly Policy[]): string[] {
  const errors: string[] = [];
  const byId = new Map<string, Policy>();
  for (const policy of policies) {
    if (byId.has(policy.id)) errors.push(`항목 id 중복: ${policy.id}`);
    byId.set(policy.id, policy);
  }

  for (const policy of policies) {
    const planning = policy.planning;
    if (!planning) continue;
    for (const link of [...planning.exclusiveWith, ...planning.after]) {
      if (!byId.has(link.policyId)) errors.push(`${policy.id} planning → 없는 항목 "${link.policyId}"`);
    }
    for (const link of planning.exclusiveWith) {
      const other = byId.get(link.policyId);
      if (other && !other.planning?.exclusiveWith.some((back) => back.policyId === policy.id)) {
        errors.push(`${policy.id} planning.exclusiveWith → ${link.policyId}에도 ${policy.id}를 적어야 한다`);
      }
    }
  }

  // 선행 조건 순환 — 깊이 우선 탐색. visiting에 다시 들어오면 순환이다.
  const done = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`planning.after 순환: ${[...path, id].join(" → ")}`);
      return;
    }
    visiting.add(id);
    for (const link of byId.get(id)?.planning?.after ?? []) visit(link.policyId, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const policy of policies) visit(policy.id, []);

  return errors;
}

/** 카드 경험의 불변식과 공개 조건. 항목과 합친 카드를 본다 — claim은 항목에 있다. */
export function validateCard(card: Card, policy: Policy): string[] {
  const errors: string[] = [];
  const claimIds = new Set([...card.claims, ...card.counterpoints].map((c) => c.id));
  const needClaim = (where: string, ids: string[]) => {
    for (const id of ids) if (!claimIds.has(id)) errors.push(`${where} → 없는 claim "${id}"`);
  };

  errors.push(...validateGame(card.game, needClaim));

  const reasonIds = new Set<string>();
  for (const reason of card.reasonOptions) {
    if (reasonIds.has(reason.id)) errors.push(`reasonOptions id 중복: ${reason.id}`);
    reasonIds.add(reason.id);
  }
  if (!card.flow.opinion && card.reasonOptions.length > 0) errors.push("reasonOptions → 정책 평가를 묻지 않는 카드에는 두지 않는다");

  needClaim("reveal", card.reveal.claimIds);

  if (!card.flow.trust && !card.flow.opinion && card.game.type !== "eligibility") {
    // 판단 없는 카드는 탐색 카드다. 탐색 카드는 "나도 대상?"으로 끝나야 쓸모가 있다.
    errors.push("flow → 판단을 모두 끈 카드는 eligibility 게임이어야 한다");
  }

  // 공개 조건 — 초안은 여기서 멈춘다. claim 검증은 항목의 공개 조건이 본다.
  if (card.publishStatus === "published") {
    if (policy.publishStatus !== "published") errors.push(`공개 → 항목 ${policy.id}가 초안이다`);
    if (card.counterpoints.length === 0) errors.push("공개 → 비판·한계(counterpoints)가 1개 이상 필요하다");
    if (card.flow.opinion && card.reasonOptions.length < 3) errors.push("공개 → 정책 평가 이유(reasonOptions)가 3개 이상 필요하다");
  }

  return errors;
}
