import { z } from "zod";

import {
  checkEvidence,
  checkRevisions,
  claimSchema,
  PlacementRole,
  PlanStage,
  publishStatusSchema,
  revisionsSchema,
  slugSchema,
  sourceSchema,
  type Policy,
} from "./schema";

/*
 * 경로 견본 (청사진 설계 4.5) — 도장의 Legend 청사진에 해당한다.
 *
 * 견본은 시점을 날짜가 아니라 출발점에서 몇 달 뒤(offsetMonths)로 적는다. 사용자가 가져가면
 * 기준 날짜를 더해 실제 YYYY-MM으로 바꾼다(materialize, B2). 그 뒤로 견본과 청사진은 따로 산다.
 * 칸(slot)은 정책 항목만 가리킨다 — 사실은 항목에, 견본에는 "왜 이 자리인가"라는 편집자 설명만 둔다.
 * 경로 자체의 한계(기회비용, 정책이 끊길 위험)는 caveats에 출처와 함께 적는다. 공개하려면 1개 이상.
 */

export const GoalKind = z.enum(["degree", "career", "startup"]);

/** 견본이 그리는 기간의 끝. 청사진의 목표 연도는 기준 연도 + 최대 10년이다 (4.1). */
export const MAX_OFFSET_MONTHS = 120;

const offset = z.number().int().nonnegative().max(MAX_OFFSET_MONTHS);

export const pathSchema = z.strictObject({
  id: slugSchema,
  publishStatus: publishStatusSchema,
  goalKind: GoalKind,
  /** "이공계 박사 진학 — 학부 3학년부터" */
  title: z.string(),
  summary: z.string(),
  /** 이 견본이 가정하는 출발점. 첫 이정표 전까지의 단계다. */
  startStage: PlanStage,

  /** 삶의 사건 — 정책이 아니다. stage는 이 이정표부터의 학적·단계다. */
  milestones: z.array(z.object({ id: slugSchema, label: z.string(), offsetMonths: offset, stage: PlanStage.optional() })).min(1),

  slots: z
    .array(
      z.object({
        id: slugSchema,
        policyId: slugSchema,
        milestoneId: slugSchema.optional(),
        fromOffset: offset,
        toOffset: offset.optional(),
        role: PlacementRole,
        /** 편집자 설명 한 줄 — 왜 이 자리인가. 사실 주장을 담지 않는다. */
        why: z.string(),
      }),
    )
    .min(1),

  caveats: z.array(claimSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  revisions: revisionsSchema,
  reviewedAt: z.iso.date(),
});
export type Path = z.infer<typeof pathSchema>;
export type PathInput = z.input<typeof pathSchema>;

/** offset 시점의 학적·단계 — 그때까지 지난 마지막 이정표의 stage, 없으면 출발점. */
export function stageAt(path: Pick<Path, "startStage" | "milestones">, offsetMonths: number): z.infer<typeof PlanStage> {
  let stage = path.startStage;
  for (const milestone of [...path.milestones].sort((a, b) => a.offsetMonths - b.offsetMonths)) {
    if (milestone.offsetMonths > offsetMonths) break;
    stage = milestone.stage ?? stage;
  }
  return stage;
}

/**
 * 견본의 불변식 — 근거, 칸이 가리키는 항목과 이정표, 시간 순서, 역할·단계가 항목의 planning과 맞는지, 공개 조건.
 * 항목의 단계 조건(planning.stages)을 여기서 미리 본다 — 견본이 틀린 시점에 칸을 두면 가져간 모든 청사진이 같이 틀린다.
 */
export function validatePath(path: Path, policies: ReadonlyMap<string, Policy>): string[] {
  const { errors, needClaim } = checkEvidence(path.caveats, path.sources);
  errors.push(...checkRevisions(path.revisions, needClaim));

  const milestoneIds = new Set<string>();
  for (const milestone of path.milestones) {
    if (milestoneIds.has(milestone.id)) errors.push(`milestones id 중복: ${milestone.id}`);
    milestoneIds.add(milestone.id);
  }

  const slotIds = new Set<string>();
  for (const slot of path.slots) {
    const where = `slots.${slot.id}`;
    if (slotIds.has(slot.id)) errors.push(`slots id 중복: ${slot.id}`);
    slotIds.add(slot.id);
    if (slot.milestoneId && !milestoneIds.has(slot.milestoneId)) errors.push(`${where} → 없는 이정표 "${slot.milestoneId}"`);
    if (slot.toOffset !== undefined && slot.toOffset < slot.fromOffset) errors.push(`${where} → 끝이 시작보다 이르다`);

    const policy = policies.get(slot.policyId);
    if (!policy) {
      errors.push(`${where} → 없는 정책 항목 "${slot.policyId}"`);
      continue;
    }
    if (!policy.planning) {
      errors.push(`${where} → 항목 ${policy.id}에 planning이 없다`);
      continue;
    }
    if (!policy.planning.roles.includes(slot.role)) errors.push(`${where} → 역할 ${slot.role}이 항목 ${policy.id}의 역할(${policy.planning.roles.join(", ")})에 없다`);
    const stage = stageAt(path, slot.fromOffset);
    if (policy.planning.stages.length > 0 && !policy.planning.stages.includes(stage)) {
      errors.push(`${where} → 그 시점 단계(${stage})가 항목 ${policy.id}의 대상 단계(${policy.planning.stages.join(", ")})에 없다`);
    }
    if (path.publishStatus === "published" && policy.publishStatus !== "published") errors.push(`공개 → ${where}의 항목 ${policy.id}가 초안이다`);
  }

  // 공개 조건 — 초안은 여기서 멈춘다.
  if (path.publishStatus === "published") {
    if (path.caveats.length === 0) errors.push("공개 → 경로의 한계(caveats)가 1개 이상 필요하다");
    for (const claim of path.caveats) {
      if (!claim.verified) errors.push(`공개 → caveat "${claim.id}"가 검증 전이다`);
    }
  }

  return errors;
}
