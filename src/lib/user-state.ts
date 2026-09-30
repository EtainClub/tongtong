import { z } from "zod";

import { Audience, Category, LifeStage } from "@/content/schema";
import type { JudgmentInput, JudgmentWithout } from "@/lib/judgment";

/*
 * 사용자 데이터 (검토 문서 4.4).
 *
 *   users/{uid}                     Profile
 *   users/{uid}/cardStates/{cardId}  CardState — 판단 히스토리는 이 문서 안의 배열
 *
 * 둘 다 클라이언트는 읽기만 한다. 쓰기는 /api/* 가 Admin SDK로 한다 (firestore.rules).
 * 이 파일의 apply* 함수가 쓰기 규칙의 전부다. Firestore와 떨어져 있어서 단위 테스트가 된다.
 */

// ── 프로필 ───────────────────────────────────────────────────────────

export const profileInput = z.object({
  audienceType: Audience,
  lifeStages: z.array(LifeStage).max(8),
  /** 관심 주제 (설계 6·21장). 피드 순서에만 쓴다. 생략하면 기존 값을 유지한다. */
  interests: z.array(Category).max(6).optional(),
  /**
   * 정책 평가 저장 동의. 정책 평가는 "정치적 견해"로 볼 수 있어 별도 동의를 받는다
   * (검토 문서 3장 1번). 생략하면 기존 값을 유지한다. false는 철회 — 저장된 평가도 지운다.
   */
  consentOpinion: z.boolean().optional(),
  /** 청소년 트랙: 만 14세 이상인지 본인이 확인했다. 만 14세 미만은 받지 않는다 (개인정보 보호법 22조의2). */
  over14: z.boolean().optional(),
});
export type ProfileInput = z.infer<typeof profileInput>;

export type Profile = {
  audienceType: Audience;
  lifeStages: z.infer<typeof LifeStage>[];
  /** 옛 프로필에는 없다 — 없으면 빈 목록으로 본다. */
  interests?: z.infer<typeof Category>[];
  /** 청소년이 만 14세 이상임을 확인한 시각. */
  over14ConfirmedAt?: string;
  /** 동의한 시각. null이면 정책 평가를 서버에 저장하지 않는다. */
  consent: { opinion: string | null };
};


export class ProfileRejection extends Error {
  constructor(
    public readonly code:
      | "over14-required" // 청소년은 만 14세 이상 확인이 있어야 한다
      | "youth-opinion-local" // 청소년의 정책 평가는 기기에만 둔다 — 저장 동의를 받지 않는다
      | "audience-downgrade", // 청년이 청소년으로 돌아갈 수는 없다
  ) {
    super(code);
  }
}

/**
 * 프로필 저장 규칙 (설계 2·50장, 청소년 트랙 2026-10-01).
 *
 * 청소년(만 14–18세)
 *   - 만 14세 이상 확인이 있어야 받는다. 한 번 확인하면 다시 묻지 않는다.
 *   - 정책 평가는 저장하지 않는다 — 동의 자체를 받지 않는다. 정치적 견해로 볼 수 있는 값을 미성년자에게서 모으지 않는다.
 *   - 생활 상황은 청년용 목록이라 비운다.
 * 청소년 → 청년 전환은 된다. 기록은 그대로 이어진다 (설계 50장). 거꾸로는 안 된다.
 * 생략한 관심 주제·동의는 앞의 값을 지킨다.
 */
export function nextProfile(previous: Profile | null, input: ProfileInput, now: Date): Profile {
  const youth = input.audienceType === "youth";
  if (youth && previous?.audienceType === "young_adult") throw new ProfileRejection("audience-downgrade");
  if (youth && !input.over14 && !previous?.over14ConfirmedAt) throw new ProfileRejection("over14-required");
  if (youth && input.consentOpinion) throw new ProfileRejection("youth-opinion-local");

  const kept = previous?.consent.opinion ?? null;
  const consent = youth ? null : input.consentOpinion === undefined ? kept : input.consentOpinion ? (kept ?? now.toISOString()) : null;
  const over14ConfirmedAt = previous?.over14ConfirmedAt ?? (youth && input.over14 ? now.toISOString() : undefined);

  return {
    audienceType: input.audienceType,
    lifeStages: youth ? [] : input.lifeStages,
    interests: input.interests ?? previous?.interests ?? [],
    consent: { opinion: consent },
    ...(over14ConfirmedAt ? { over14ConfirmedAt } : {}),
  };
}
// ── 카드 상태 ────────────────────────────────────────────────────────

export type StoredJudgment = JudgmentWithout<"cardId"> & { at: string };

export type CardState = {
  cardId: string;
  saved: boolean;
  passedAt: string | null;
  completedAt: string | null;
  /** 마지막으로 본 카드 버전. 재평가의 "새 정보"는 이것과 카드 버전의 차이다 (M3). */
  lastSeenVersion: number;
  judgments: StoredJudgment[];
};

export function emptyCardState(cardId: string): CardState {
  return { cardId, saved: false, passedAt: null, completedAt: null, lastSeenVersion: 0, judgments: [] };
}

/** 한 카드에 쌓이는 판단의 상한. 정상 사용으로는 닿지 않는다 — 스크립트가 문서를 키우는 것을 막는다. */
export const MAX_JUDGMENTS_PER_CARD = 60;

/** 기록 거절 사유. 서버는 이것을 HTTP 상태로 바꾼다. */
export class JudgmentRejection extends Error {
  constructor(
    public readonly code:
      | "stale-version"     // 화면이 옛 카드 버전을 들고 있다 — 새로고침해야 한다
      | "axis-disabled"     // 이 카드는 그 판단을 묻지 않는다
      | "consent-required"  // 정책 평가는 동의 후에만 저장한다
      | "no-final-yet"      // 최종 판단 없이 재평가할 수 없다
      | "too-many"          // 카드 하나에 쌓을 수 있는 판단 수를 넘었다
      | "unknown-reason",   // 이 카드의 이유 목록에 없는 이유다
  ) {
    super(code);
  }
}

type JudgmentContext = {
  currentVersion: number;
  flow: { trust: boolean; opinion: boolean };
  consented: boolean;
  /** 이 카드의 reasonOptions id. 목록 밖의 이유는 받지 않는다. */
  reasonIds: readonly string[];
  now: Date;
};

const sameEntry = (a: { sessionId: string; phase: string; axis: string }, b: typeof a) =>
  a.sessionId === b.sessionId && a.phase === b.phase && a.axis === b.axis;

/**
 * 판단 한 건을 상태에 더한다. 덮어쓰지 않고 쌓는다 (설계 72장 2).
 *
 * 같은 sessionId·phase·axis가 이미 있으면 아무것도 바꾸지 않는다 — 네트워크 재시도가
 * 두 번 기록되면 안 된다. 한 세션 안에서 마음을 바꾸고 싶다면 새 세션(카드를 다시 보기)이다.
 */
export function applyJudgment(
  prev: CardState | null,
  input: JudgmentInput,
  ctx: JudgmentContext,
): { state: CardState; duplicate: boolean } {
  const state = prev ?? emptyCardState(input.cardId);

  if (state.judgments.some((j) => sameEntry(j, input))) return { state, duplicate: true };
  if (input.cardVersion !== ctx.currentVersion) throw new JudgmentRejection("stale-version");

  const needsTrust = input.axis === "trust" || input.axis === "hookAccuracy";
  if (needsTrust ? !ctx.flow.trust : !ctx.flow.opinion) throw new JudgmentRejection("axis-disabled");
  if (input.axis === "opinion" && !ctx.consented) throw new JudgmentRejection("consent-required");
  if (input.axis === "opinion") {
    const codes = input.reasonCodes;
    if (new Set(codes).size !== codes.length || codes.some((code) => !ctx.reasonIds.includes(code))) throw new JudgmentRejection("unknown-reason");
  }
  if (input.phase === "revisit" && !state.judgments.some((j) => j.axis === "opinion" && j.phase === "final")) {
    throw new JudgmentRejection("no-final-yet");
  }
  if (state.judgments.length >= MAX_JUDGMENTS_PER_CARD) throw new JudgmentRejection("too-many");

  const at = ctx.now.toISOString();
  const { cardId: _cardId, ...entry } = input;
  void _cardId;

  // 카드의 마지막 판단이 들어오면 완료로 본다. 탐색 카드(판단 없음)는 applyCardAction("complete")로.
  const last = ctx.flow.opinion ? "opinion" : "hookAccuracy";
  const completes = input.phase === "final" && input.axis === last;

  return {
    duplicate: false,
    state: {
      ...state,
      lastSeenVersion: Math.max(state.lastSeenVersion, input.cardVersion),
      completedAt: completes ? (state.completedAt ?? at) : state.completedAt,
      judgments: [...state.judgments, { ...entry, at }],
    },
  };
}

// ── 저장·넘기기 ──────────────────────────────────────────────────────

export const CardAction = z.enum(["save", "unsave", "pass", "complete"]);
export type CardAction = z.infer<typeof CardAction>;

export const cardActionInput = z.object({ cardId: z.string(), action: CardAction });

/**
 * 넘기기(pass)는 정책에 대한 의견이 아니다 — 피드에서 30일 쉬게 할 뿐, 어떤 집계에도
 * 쓰지 않는다 (검토 문서 7.1).
 */
export function applyCardAction(prev: CardState | null, cardId: string, action: CardAction, currentVersion: number, now: Date): CardState {
  const state = prev ?? emptyCardState(cardId);
  const at = now.toISOString();
  switch (action) {
    case "save":
      return { ...state, saved: true, lastSeenVersion: Math.max(state.lastSeenVersion, currentVersion) };
    case "unsave":
      return { ...state, saved: false };
    case "pass":
      return { ...state, passedAt: at };
    case "complete":
      return { ...state, completedAt: state.completedAt ?? at, lastSeenVersion: Math.max(state.lastSeenVersion, currentVersion) };
  }
}

/** 동의를 철회하면 저장된 정책 평가를 지운다. 사실 신뢰 판단은 남는다. */
export function withoutOpinions(state: CardState): CardState {
  return { ...state, judgments: state.judgments.filter((j) => j.axis !== "opinion") };
}
