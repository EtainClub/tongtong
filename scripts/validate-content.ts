/**
 * 콘텐츠 검증 — CI 게이트 (검토 문서 4.1).
 *
 * 정책 항목: 모양(zod) → 참조 무결성·공개 조건(validatePolicy) → 항목 사이 관계(validatePolicies)
 * 카드:      모양(zod) → 항목과 합치기 → 게임·판단·공개 조건(validateCard) → 카드 간 중복
 * 경로 견본: 모양(zod) → 칸·이정표·역할·단계·공개 조건(validatePath) → 견본 간 중복
 * 오류는 빌드를 멈추고, 경고는 편집자가 할 일을 알려 준다.
 * 콘텐츠가 저장소에 있기 때문에 가능한 검사다.
 */
import { RAW_CARDS } from "../src/content/cards/raw";
import { pathSchema, validatePath } from "../src/content/path-schema";
import { RAW_PATHS } from "../src/content/paths/raw";
import { RAW_POLICIES } from "../src/content/policies/raw";
import {
  cardExperienceSchema,
  cardVersion,
  policySchema,
  resolveCard,
  validateCard,
  validatePolicies,
  validatePolicy,
  type Policy,
} from "../src/content/schema";
import { claimState, currentApplication, reviewOverdue } from "../src/lib/policy-state";

const now = new Date();
let failed = false;

const badge = (status: "draft" | "published") => (status === "published" ? "공개" : "초안");

function fail(title: string, lines: string[]) {
  failed = true;
  console.error(`\n✗ ${title}`);
  for (const line of lines) console.error(`    ${line}`);
}

function parseIssues(issues: { path: PropertyKey[]; message: string }[]): string[] {
  return issues.map((issue) => `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`);
}

// ── 정책 항목 ──

const carded = new Set(RAW_CARDS.map((raw) => (raw as { policyId?: unknown }).policyId));
const policies: Policy[] = [];

console.log("정책 항목");
for (const [index, raw] of RAW_POLICIES.entries()) {
  const parsed = policySchema.safeParse(raw);
  if (!parsed.success) {
    fail(`${String((raw as { id?: unknown }).id ?? `#${index}`)} — 모양이 틀렸다`, parseIssues(parsed.error.issues));
    continue;
  }

  const policy = parsed.data;
  policies.push(policy);
  const errors = validatePolicy(policy);
  if (errors.length > 0) {
    fail(`${policy.id} [${badge(policy.publishStatus)}]`, errors);
    continue;
  }

  const claims = [...policy.claims, ...policy.counterpoints];
  const pending = claims.filter((c) => !c.verified);
  const application = currentApplication(policy.policy.applications, now);
  console.log(
    `✓ ${policy.id} [${badge(policy.publishStatus)}] v${cardVersion(policy)} — claim ${claims.length}, source ${policy.sources.length}, ` +
      `신청 ${application ? `${application.app.label} ${application.state}` : "없음"}${carded.has(policy.id) ? ", 카드 있음" : ""}`,
  );

  // 경고 — 빌드는 통과하지만 편집자가 볼 것.
  if (pending.length > 0) console.warn(`  ⚠ 검증 전 claim ${pending.length}개: ${pending.map((c) => c.id).join(", ")}`);
  for (const claim of claims) {
    if (claimState(claim, now) === "expired") console.warn(`  ⚠ 기준일 지난 claim: ${claim.id} (${claim.validUntil})`);
  }
  if (reviewOverdue(policy.reviewedAt, now)) console.warn(`  ⚠ 원문 재대조 90일 경과 (reviewedAt ${policy.reviewedAt})`);
  if (!policy.summary) console.warn("  ⚠ 한 줄 요약(summary)이 없다 — 정책 페이지에 필요");
  // 청사진은 청년만 (청사진 설계 10장) — 청소년 항목에는 묻지 않는다.
  if (!policy.planning && policy.audience.includes("young_adult")) console.warn("  ⚠ 계획 정보(planning)가 없다 — 청사진 경로 견본에 넣으려면 필요");
}

const relationErrors = validatePolicies(policies);
if (relationErrors.length > 0) fail("정책 항목 사이", relationErrors);

// ── 카드 ──

const policyById = new Map(policies.map((policy) => [policy.id, policy]));
const seen = new Set<string>();

console.log("\n카드");
for (const [index, raw] of RAW_CARDS.entries()) {
  const parsed = cardExperienceSchema.safeParse(raw);
  if (!parsed.success) {
    fail(`${String((raw as { policyId?: unknown }).policyId ?? `#${index}`)} — 모양이 틀렸다`, parseIssues(parsed.error.issues));
    continue;
  }

  const experience = parsed.data;
  const policy = policyById.get(experience.policyId);
  if (!policy) {
    fail(`${experience.policyId} — 정책 항목이 없거나 모양이 틀렸다`, ["policies/raw.ts에 같은 id의 항목을 등록한다"]);
    continue;
  }

  const card = resolveCard(policy, experience);
  const errors = validateCard(card, policy);
  if (seen.has(card.id)) errors.push(`카드 id 중복: ${card.id}`);
  seen.add(card.id);

  if (errors.length > 0) {
    fail(`${card.id} [${badge(card.publishStatus)}]`, errors);
    continue;
  }

  console.log(`✓ ${card.id} [${badge(card.publishStatus)}] — 게임 ${card.game.type}`);
  if (card.counterpoints.length === 0) console.warn("  ⚠ 비판·한계(counterpoints)가 없다 — 카드 공개 조건");
}

// ── 경로 견본 ──

const seenPaths = new Set<string>();

console.log("\n경로 견본");
for (const [index, raw] of RAW_PATHS.entries()) {
  const parsed = pathSchema.safeParse(raw);
  if (!parsed.success) {
    fail(`${String((raw as { id?: unknown }).id ?? `#${index}`)} — 모양이 틀렸다`, parseIssues(parsed.error.issues));
    continue;
  }

  const path = parsed.data;
  const errors = validatePath(path, policyById);
  if (seenPaths.has(path.id)) errors.push(`견본 id 중복: ${path.id}`);
  seenPaths.add(path.id);
  if (errors.length > 0) {
    fail(`${path.id} [${badge(path.publishStatus)}]`, errors);
    continue;
  }

  const draftSlots = path.slots.filter((slot) => policyById.get(slot.policyId)?.publishStatus !== "published");
  console.log(`✓ ${path.id} [${badge(path.publishStatus)}] — 이정표 ${path.milestones.length}, 칸 ${path.slots.length}, caveat ${path.caveats.length}`);
  if (draftSlots.length > 0) console.warn(`  ⚠ 초안 항목을 가리키는 칸 ${draftSlots.length}개: ${draftSlots.map((s) => s.policyId).join(", ")} — 공개 조건`);
  if (path.caveats.length === 0) console.warn("  ⚠ 경로의 한계(caveats)가 없다 — 공개 조건");
}

if (failed) {
  console.error("\n콘텐츠 검증 실패.");
  process.exit(1);
}

console.log(`\n검증 통과 — 정책 항목 ${RAW_POLICIES.length}개, 카드 ${RAW_CARDS.length}장, 경로 견본 ${RAW_PATHS.length}개.`);
