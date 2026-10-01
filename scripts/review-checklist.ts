/**
 * 편집자 검수 목록 — `pnpm review`.
 *
 * claim의 verified는 사람이 원문과 대조해야만 true가 된다 (검토 문서 3장). 이 스크립트는
 * 그 일을 빠르게 하도록 정책 항목별로 "무엇을, 어느 원문과" 대조할지 한 장에 모은다.
 * 결과는 docs/review-checklist.md — 매번 새로 만든다. 대조를 마치면 항목 파일에서
 * 해당 claim에 `verified: true`를 적고 `reviewedAt`을 오늘로 바꾼다.
 */
import { writeFileSync } from "node:fs";

import { ALL_CARDS } from "../src/content/cards";
import { ALL_PATHS } from "../src/content/paths";
import { ALL_POLICIES } from "../src/content/policies";
import type { Claim, Planning, Source } from "../src/content/schema";
import { claimState, reviewOverdue } from "../src/lib/policy-state";

const now = new Date();
const carded = new Set(ALL_CARDS.map((card) => card.id));
const out: string[] = [
  "# 편집자 검수 목록",
  "",
  `> \`pnpm review\`가 만든 파일이다. 손으로 고치지 않는다 — 만든 때: ${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now)}`,
  "",
  "대조를 마친 claim은 정책 항목 파일(`src/content/policies/<id>.ts`)에서 `verified: true`로 바꾸고, 항목의 `reviewedAt`을 오늘로 적는다.",
  "항목을 공개하려면 모든 claim이 검증되어야 하고, 카드를 공개하려면 비판·한계(`counterpoints`)도 1개 이상 있어야 한다 (`pnpm validate`가 막는다).",
  "`계획 정보` 표시가 붙은 claim은 청사진 점검(나이·기간·회차·중복 수혜)의 근거다 — 숫자가 `planning` 값과 같은지도 본다.",
  "",
];

const sourceLine = (s: Source) => `[${s.publisher}${s.publishedAt ? ` · ${s.publishedAt}` : ""}](${s.url ?? "#"}) — 「${s.title}」`;

/** planning 값이 근거로 삼는 claim id. */
function planningClaimIds(planning: Planning | undefined): Set<string> {
  if (!planning) return new Set();
  return new Set([
    ...(planning.age?.claimIds ?? []),
    ...(planning.durationMonths?.claimIds ?? []),
    ...(planning.recurrence?.claimIds ?? []),
    ...[...planning.exclusiveWith, ...planning.after].flatMap((link) => link.claimIds),
  ]);
}

let pendingTotal = 0;
for (const policy of ALL_POLICIES) {
  const sources = new Map(policy.sources.map((s) => [s.id, s]));
  const claims: (Claim & { counter?: boolean })[] = [...policy.claims, ...policy.counterpoints.map((c) => ({ ...c, counter: true }))];
  const pending = claims.filter((c) => !c.verified);
  const forPlanning = planningClaimIds(policy.planning);
  pendingTotal += pending.length;

  const blockers = [
    pending.length > 0 && `검증 전 claim ${pending.length}개`,
    carded.has(policy.id) && policy.counterpoints.length === 0 && "비판·한계 없음(카드 공개 조건)",
    reviewOverdue(policy.reviewedAt, now) && `원문 재대조 90일 경과(${policy.reviewedAt})`,
  ].filter(Boolean);

  out.push(`## ${policy.name} \`${policy.id}\`${carded.has(policy.id) ? "" : " · 카드 없음"}`, "");
  out.push(blockers.length ? `공개 전 남은 일: ${blockers.join(" · ")}` : "공개 조건 충족", "");

  for (const claim of claims) {
    const tags = [
      claim.counter && "비판·한계",
      forPlanning.has(claim.id) && "계획 정보",
      claim.assertionType !== "FACT" && claim.assertionType,
      claim.assertedBy && `주장: ${claim.assertedBy}`,
      claimState(claim, now) === "expired" && `기준일 지남(${claim.validUntil})`,
    ].filter(Boolean);
    out.push(`- [${claim.verified ? "x" : " "}] \`${claim.id}\` ${claim.text}${tags.length ? ` _(${tags.join(", ")})_` : ""}`);
    for (const id of claim.sourceIds) {
      const source = sources.get(id);
      if (source) out.push(`  - ${sourceLine(source)}`);
    }
  }
  out.push("");
}

// 경로 견본의 한계(caveats) — 견본 파일(`src/content/paths/<id>.ts`)에서 verified를 적는다.
out.push("# 경로 견본", "", "견본을 공개하려면 모든 칸의 항목이 공개이고, 한계(caveat)가 1개 이상 검증되어야 한다.", "");
for (const path of ALL_PATHS) {
  const sources = new Map(path.sources.map((s) => [s.id, s]));
  const pending = path.caveats.filter((c) => !c.verified);
  pendingTotal += pending.length;
  out.push(`## ${path.title} \`${path.id}\``, "");
  for (const claim of path.caveats) {
    const tags = [claim.assertionType !== "FACT" && claim.assertionType].filter(Boolean);
    out.push(`- [${claim.verified ? "x" : " "}] \`${claim.id}\` ${claim.text}${tags.length ? ` _(${tags.join(", ")})_` : ""}`);
    for (const id of claim.sourceIds) {
      const source = sources.get(id);
      if (source) out.push(`  - ${sourceLine(source)}`);
    }
  }
  out.push("");
}

writeFileSync("docs/review-checklist.md", out.join("\n"));
console.log(`docs/review-checklist.md — 정책 항목 ${ALL_POLICIES.length}개, 경로 견본 ${ALL_PATHS.length}개, 검증 전 claim ${pendingTotal}개`);
