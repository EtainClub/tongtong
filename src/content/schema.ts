import { z } from "zod";

import { endOf, startOf } from "../lib/policy-state";

/*
 * 통통 콘텐츠 스키마.
 *
 * Source·Claim은 잼통(src/content/schema.ts)의 것을 그대로 옮겼다.
 * 세 서비스가 같은 근거 문법을 써야 카드가 서로를 가리킬 수 있다.
 *
 * 불변식은 두 곳에 있다. 모양은 zod가, 참조 무결성은 validateCard()가 본다.
 * 둘 다 `pnpm validate`에서 빌드 전에 돈다 (검토 문서 4.1).
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

// ── 카드 ─────────────────────────────────────────────────────────────

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

export const Category = z.enum(["asset", "housing", "employment", "transport", "culture", "education"]);

export const cardSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id는 ascii 슬러그"),
  publishStatus: z.enum(["draft", "published"]).default("draft"),
  audience: z.array(Audience).min(1),
  category: Category,
  lifeStages: z.array(LifeStage),

  shortTitle: z.string(),
  /** 일부러 짧고 과장된 첫 문장. 첫 판단의 대상이다 (검토 문서 2.2). */
  hook: z.string(),
  /** 15초 숏츠 대본. 한 줄이 한 컷. */
  shorts: z.array(z.string()).min(1),

  /** 판단 단계를 카드마다 켜고 끈다. 탐색 카드는 둘 다 끈다 (검토 문서 2.7). */
  flow: z.object({ trust: z.boolean(), opinion: z.boolean() }),

  /**
   * 정책 평가의 이유 목록 (설계 14장 reasonCodes, 로드맵 M5). 고르는 것은 선택이다.
   * 긍정·부정을 섞어 한 목록으로 두고, 순서는 고정한다 — 고른 값에 따라 바꾸지 않는다.
   * 이유는 카드의 claim·비판에서 나온 것만 적는다.
   */
  reasonOptions: z
    .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: z.string() }))
    .max(6)
    .default([]),

  claims: z.array(claimSchema).min(1),
  sources: z.array(sourceSchema).min(1),
  /** 비판·한계. 공개하려면 1개 이상 (검토 문서 3장 4번). */
  counterpoints: z.array(claimSchema),

  game: gameSchema,
  /** 게임 뒤 공개할 사실. */
  reveal: z.object({ claimIds: z.array(z.string()).min(1) }),
  suggestedQuestions: z.array(z.string()),

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

  /**
   * 개정 이력. 마지막 version이 카드의 현재 버전이다.
   * material: 사용자가 알아야 하는 변경인가. 오탈자 수정은 false —
   * "새 정보" 배지와 재평가는 material인 것만 센다 (검토 문서 4.2).
   */
  revisions: z
    .array(
      z.object({
        version: z.number().int().positive(),
        date: z.iso.date(),
        material: z.boolean(),
        summary: z.string(),
        claimIds: z.array(z.string()),
      }),
    )
    .min(1),

  /** 편집자가 마지막으로 원문 전체를 다시 대조한 날. */
  reviewedAt: z.iso.date(),

  /** 자매 서비스로 가는 길 (설계 12·57장). 통통은 복제하지 않고 보낸다 — 잼통 무슨 일이 있었나, 임통 누가 무슨 말을 했나. */
  links: z
    .object({
      /** 잼통에서 이 정책을 다룬 곳. */
      jamtong: z.object({ title: z.string(), url: z.url() }).optional(),
      /** 카드와 관련된 인물. 이름과 역할만 두고 자세한 것은 임통으로. */
      people: z.array(z.object({ name: z.string(), role: z.string(), imtongUrl: z.url() })).default([]),
    })
    .prefault({}),

  /** 편집 메모. AI 안내 프롬프트에도 전달된다 — 말투 지침 같은 것. */
  tone: z.string().optional(),
});
export type Card = z.infer<typeof cardSchema>;
export type CardInput = z.input<typeof cardSchema>;

export function cardVersion(card: Card): number {
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

/** 공개 조건까지 포함한 카드 불변식. 오류 목록이 비면 통과. */
export function validateCard(card: Card): string[] {
  const errors: string[] = [];
  const sourceIds = new Set(card.sources.map((s) => s.id));
  const allClaims = [...card.claims, ...card.counterpoints];
  const claimIds = new Set<string>();

  for (const claim of allClaims) {
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
  for (const source of card.sources) {
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

  errors.push(...validateGame(card.game, needClaim));

  const reasonIds = new Set<string>();
  for (const reason of card.reasonOptions) {
    if (reasonIds.has(reason.id)) errors.push(`reasonOptions id 중복: ${reason.id}`);
    reasonIds.add(reason.id);
  }
  if (!card.flow.opinion && card.reasonOptions.length > 0) errors.push("reasonOptions → 정책 평가를 묻지 않는 카드에는 두지 않는다");

  needClaim("reveal", card.reveal.claimIds);
  for (const event of card.policy.history) needSource(`policy.history ${event.date}`, event.sourceIds);
  for (const app of card.policy.applications) {
    needSource(`policy.applications ${app.label}`, app.sourceIds);
    if (startOf(app.startAt) > endOf(app.endAt)) errors.push(`policy.applications ${app.label} → 시작이 끝보다 늦다`);
  }

  card.revisions.forEach((rev, i) => {
    if (rev.version !== i + 1) errors.push(`revisions → version은 1부터 1씩 올라야 한다 (${i}번째가 ${rev.version})`);
    if (i > 0 && rev.date < card.revisions[i - 1].date) errors.push(`revisions → v${rev.version} 날짜가 거꾸로다`);
    needClaim(`revisions v${rev.version}`, rev.claimIds);
  });

  if (!card.flow.trust && !card.flow.opinion && card.game.type !== "eligibility") {
    // 판단 없는 카드는 탐색 카드다. 탐색 카드는 "나도 대상?"으로 끝나야 쓸모가 있다.
    errors.push("flow → 판단을 모두 끈 카드는 eligibility 게임이어야 한다");
  }

  // 자매 서비스 링크는 그 서비스 주소로만 보낸다 (설계 57장).
  if (card.links.jamtong && new URL(card.links.jamtong.url).host !== "jamtong.kr") errors.push("links → jamtong은 jamtong.kr 주소여야 한다");
  for (const person of card.links.people) {
    if (new URL(person.imtongUrl).host !== "im.jamtong.kr") errors.push(`links → ${person.name}의 주소는 im.jamtong.kr이어야 한다`);
  }

  // 공개 조건 — 초안은 여기서 멈춘다.
  if (card.publishStatus === "published") {
    if (card.counterpoints.length === 0) errors.push("공개 → 비판·한계(counterpoints)가 1개 이상 필요하다");
    if (card.flow.opinion && card.reasonOptions.length < 3) errors.push("공개 → 정책 평가 이유(reasonOptions)가 3개 이상 필요하다");
    for (const claim of allClaims) {
      if (!claim.verified) errors.push(`공개 → claim "${claim.id}"가 검증 전이다`);
    }
  }

  return errors;
}
