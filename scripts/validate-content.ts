/**
 * 콘텐츠 검증 — CI 게이트 (검토 문서 4.1).
 *
 * 모양(zod) → 참조 무결성·공개 조건(validateCard) → 카드 간 중복 순서로 본다.
 * 오류는 빌드를 멈추고, 경고는 편집자가 할 일을 알려 준다.
 * 콘텐츠가 저장소에 있기 때문에 가능한 검사다.
 */
import { RAW_CARDS } from "../src/content/cards/raw";
import { cardSchema, cardVersion, validateCard } from "../src/content/schema";
import { claimState, currentApplication, reviewOverdue } from "../src/lib/policy-state";

const now = new Date();
let failed = false;
const seen = new Set<string>();

for (const [index, raw] of RAW_CARDS.entries()) {
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) {
    failed = true;
    const id = (raw as { id?: unknown }).id ?? `#${index}`;
    console.error(`\n✗ ${String(id)} — 모양이 틀렸다`);
    for (const issue of parsed.error.issues) {
      console.error(`    ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    continue;
  }

  const card = parsed.data;
  const errors = validateCard(card);
  if (seen.has(card.id)) errors.push(`카드 id 중복: ${card.id}`);
  seen.add(card.id);

  const badge = card.publishStatus === "published" ? "공개" : "초안";
  if (errors.length > 0) {
    failed = true;
    console.error(`\n✗ ${card.id} [${badge}]`);
    for (const error of errors) console.error(`    ${error}`);
    continue;
  }

  const claims = [...card.claims, ...card.counterpoints];
  const pending = claims.filter((c) => !c.verified);
  const application = currentApplication(card.policy.applications, now);

  console.log(
    `✓ ${card.id} [${badge}] v${cardVersion(card)} — claim ${claims.length}, source ${card.sources.length}, ` +
      `게임 ${card.game.type}, 신청 ${application ? `${application.app.label} ${application.state}` : "없음"}`,
  );

  // 경고 — 빌드는 통과하지만 편집자가 볼 것.
  if (pending.length > 0) console.warn(`  ⚠ 검증 전 claim ${pending.length}개: ${pending.map((c) => c.id).join(", ")}`);
  if (card.counterpoints.length === 0) console.warn("  ⚠ 비판·한계(counterpoints)가 없다 — 공개 조건");
  for (const claim of claims) {
    if (claimState(claim, now) === "expired") console.warn(`  ⚠ 기준일 지난 claim: ${claim.id} (${claim.validUntil})`);
  }
  if (reviewOverdue(card.reviewedAt, now)) console.warn(`  ⚠ 원문 재대조 90일 경과 (reviewedAt ${card.reviewedAt})`);
}

if (failed) {
  console.error("\n콘텐츠 검증 실패.");
  process.exit(1);
}

console.log(`\n검증 통과 — 카드 ${RAW_CARDS.length}장.`);
