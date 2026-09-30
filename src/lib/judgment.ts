import { z } from "zod";

/*
 * 판단 모델 (검토 문서 2장).
 *
 *   첫 판단     trust         Hook 문장을 얼마나 믿나              1–5 | 모르겠음
 *   사실 공개 후 hookAccuracy  Hook이 정확했나                      정확 | 과장 | 오해 소지
 *   최종 판단   opinion       이 정책을 어떻게 보나                 1–5 | 모르겠음
 *   재평가      opinion       (바뀐 내용을 본 뒤) 지금은              1–5 | 모르겠음
 *
 * 축이 다른 값은 절대 합치지 않는다. 사실을 믿는 것과 정책에 찬성하는 것은 다른 일이다.
 */

export const JudgmentPhase = z.enum(["initial", "final", "revisit"]);
export type JudgmentPhase = z.infer<typeof JudgmentPhase>;

/**
 * 5단계 척도. null은 "모르겠음"이다 — 가운데 값(3)이 아니다.
 * 3에 두면 "모르겠음 → 대체로 신뢰"가 +1로 계산된다 (검토 문서 2.3).
 */
export const ScaleValue = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable();
export type ScaleValue = z.infer<typeof ScaleValue>;

export const HookAccuracy = z.enum(["accurate", "exaggerated", "misleading"]);
export type HookAccuracy = z.infer<typeof HookAccuracy>;

const common = {
  cardId: z.string(),
  /** 판단할 때 본 카드 버전. 없으면 재평가에서 변화의 원인을 가를 수 없다 (검토 문서 2.6). */
  cardVersion: z.number().int().positive(),
  /** 재시도 멱등 키. 같은 sessionId·phase·axis는 한 번만 기록한다. */
  sessionId: z.string().min(8).max(64),
};

/** 판단 한 건. 축과 단계의 조합을 스키마가 제한한다 — 잘못된 조합은 들어올 수 없다. */
export const judgmentInput = z.discriminatedUnion("axis", [
  z.object({ ...common, axis: z.literal("trust"), phase: z.literal("initial"), value: ScaleValue }),
  // 사실을 본 뒤의 판단이므로 final이다. initial은 "아무것도 보기 전"만 뜻한다.
  z.object({ ...common, axis: z.literal("hookAccuracy"), phase: z.literal("final"), value: HookAccuracy }),
  z.object({
    ...common,
    axis: z.literal("opinion"),
    phase: z.enum(["final", "revisit"]),
    value: ScaleValue,
    reasonCodes: z.array(z.string()).max(5).default([]),
  }),
]);
export type JudgmentInput = z.infer<typeof judgmentInput>;

/** 유니언의 각 갈래에서 키를 뺀다. 그냥 Omit은 유니언을 한 모양으로 뭉갠다. */
export type JudgmentWithout<K extends keyof JudgmentInput> = JudgmentInput extends infer T ? (T extends unknown ? Omit<T, K> : never) : never;

/** 척도 라벨. 축마다 말이 다르다. 별(★)을 쓰지 않는다 (검토 문서 2.4). */
export const SCALE_LABELS = {
  trust: ["매우 의심", "다소 의심", "중립", "대체로 신뢰", "매우 신뢰"],
  opinion: ["매우 부정", "대체로 부정", "중립", "대체로 긍정", "매우 긍정"],
} as const;

export const HOOK_ACCURACY_LABELS: Record<HookAccuracy, string> = {
  accurate: "정확했다",
  exaggerated: "과장이었다",
  misleading: "오해할 만했다",
};

/**
 * 두 판단을 나란히 놓는다. 점수나 방향을 만들지 않는다.
 *
 * "+2 변화"는 바꾸는 것이 잘한 것이라는 신호를 준다 (검토 문서 2.5).
 * 화면은 처음과 지금을 나란히 보여주고, "그대로"도 같은 무게로 보여준다.
 * 모르겠음이 끼면 비교할 수 없다고 말한다 — 억지로 수치를 만들지 않는다.
 */
export type Comparison =
  | { kind: "same"; value: 1 | 2 | 3 | 4 | 5 }
  | { kind: "moved"; before: 1 | 2 | 3 | 4 | 5; after: 1 | 2 | 3 | 4 | 5 }
  | { kind: "incomparable"; before: ScaleValue; after: ScaleValue };

export function compare(before: ScaleValue, after: ScaleValue): Comparison {
  if (before === null || after === null) return { kind: "incomparable", before, after };
  if (before === after) return { kind: "same", value: before };
  return { kind: "moved", before, after };
}
