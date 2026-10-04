import { z } from "zod";

import { GoalKind } from "@/content/path-schema";
import { PlacementRole, PlanStage } from "@/content/schema";
import { YearMonth } from "@/lib/blueprint/month";

/*
 * 청사진 (청사진 설계 4·6장).
 *
 *   users/{uid}/blueprints/{bpId}                 Blueprint — 지금 모습
 *   users/{uid}/blueprints/{bpId}/versions/{rev}  Version — REV마다 무엇이 왜 바뀌었나
 *
 * 클라이언트는 읽기만 한다. 쓰기는 /api/blueprint가 apply.ts의 규칙을 적용해 한다 (firestore.rules).
 * 시각은 ISO 문자열로 둔다 — 순수 함수가 만들고, 화면이 그대로 읽는다.
 */

/** 활성 청사진 상한 (도장과 같은 판단 — 초점). 숫자만 올리면 경로 비교가 열린다. */
export const MAX_ACTIVE_BLUEPRINTS = 1;
export const MAX_MILESTONES = 20;
export const MAX_PLACEMENTS = 40;
/** 목표 연도는 기준 연도에서 최대 10년 (4.1). */
export const MAX_HORIZON_YEARS = 10;

export const BlueprintGoalKind = z.enum([...GoalKind.options, "other"]);

export const PlacementStatus = z.enum(["planned", "ready", "applied", "active", "done", "missed", "dropped", "ineligible"]);
export type PlacementStatus = z.infer<typeof PlacementStatus>;

/**
 * 상태 전이 (4.3). 사용자가 바꾼다 — 앱은 "신청함"인지 모른다.
 * 앞으로만 가지 않는다: 잘못 누른 것을 되돌릴 수 있게 바로 앞 상태로 돌아가는 길을 둔다.
 */
export const STATUS_TRANSITIONS: Record<PlacementStatus, readonly PlacementStatus[]> = {
  planned: ["ready", "applied", "active", "missed", "dropped", "ineligible"],
  ready: ["planned", "applied", "missed", "dropped", "ineligible"],
  applied: ["ready", "active", "missed", "dropped", "ineligible"],
  active: ["applied", "done", "dropped"],
  done: ["active"],
  missed: ["planned"],
  dropped: ["planned"],
  ineligible: ["planned"],
};

const id = z.string().regex(/^[a-z0-9-]{1,40}$/);

export const goalSchema = z.object({
  kind: BlueprintGoalKind,
  title: z.string().trim().min(1).max(60),
  horizonYear: z.number().int(),
  pathId: z.string().optional(),
  pathVersion: z.number().int().positive().optional(),
});

/** 기준. age는 asOf 시점 만 나이, 선택 — 나이 조건 점검에만 쓴다 (10장 3번). */
export const baselineSchema = z.object({
  asOf: YearMonth,
  stage: PlanStage,
  age: z.number().int().min(14).max(60).optional(),
});

export const milestoneSchema = z.object({
  id,
  label: z.string().trim().min(1).max(40),
  at: YearMonth,
  stage: PlanStage.optional(),
});

export const placementSchema = z.object({
  id,
  policyId: z.string(),
  /** 어느 항목 버전을 보고 계획했나. 항목이 개정되면 점검이 이 값과 비교한다 (B3). */
  policyVersion: z.number().int().positive(),
  milestoneId: id.optional(),
  from: YearMonth,
  to: YearMonth.optional(),
  role: PlacementRole,
  status: PlacementStatus,
  statusAt: z.iso.datetime(),
  /** 소득·장애 같은 사정은 적지 말라고 화면이 안내한다 (10장 2번). */
  note: z.string().trim().max(200).optional(),
});

export const blueprintSchema = z.object({
  id,
  status: z.enum(["active", "archived"]),
  rev: z.number().int().positive(),
  goal: goalSchema,
  baseline: baselineSchema,
  milestones: z.array(milestoneSchema).max(MAX_MILESTONES),
  placements: z.array(placementSchema).max(MAX_PLACEMENTS),
  /** "확인함"으로 닫은 점검 키 (B3). 점검 자체는 저장하지 않는다. */
  ackedChecks: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Goal = z.infer<typeof goalSchema>;
export type Baseline = z.infer<typeof baselineSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type Blueprint = z.infer<typeof blueprintSchema>;

/** basis: 배치가 기대는 항목 버전을 새 버전으로 받아들임 — "이대로 둘게요" (청사진 설계 5.1). */
export const ChangeOp = z.enum(["add", "remove", "move", "status", "note", "basis", "milestone", "goal"]);

/** REV 하나에서 바뀐 것 하나. before/after는 그 대상의 바뀐 필드만 담는다 — 비교 화면이 LLM 없이 그린다. */
export type Change = {
  op: z.infer<typeof ChangeOp>;
  targetId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export type Trigger = { kind: "create" | "user" | "check" | "path" | "ai"; checkKind?: string; policyId?: string };

export type Version = {
  rev: number;
  /** 사용자가 남긴 한 줄. 없으면 화면이 changes에서 문장을 만든다. */
  intent: string | null;
  trigger: Trigger;
  changes: Change[];
  createdAt: string;
};
