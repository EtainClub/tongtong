/**
 * 편집자 검수 목록 — `pnpm review`.
 *
 * claim의 verified는 사람이 원문과 대조해야만 true가 된다 (검토 문서 3장). 이 스크립트는
 * 그 일을 빠르게 하도록 카드별로 "무엇을, 어느 원문과" 대조할지 한 장에 모은다.
 * 결과는 docs/review-checklist.md — 매번 새로 만든다. 대조를 마치면 카드 파일에서
 * 해당 claim에 `verified: true`를 적고 `reviewedAt`을 오늘로 바꾼다.
 */
import { writeFileSync } from "node:fs";

import { ALL_CARDS as CARDS } from "../src/content/cards";
import type { Claim, Source } from "../src/content/schema";
import { claimState, reviewOverdue } from "../src/lib/policy-state";

const now = new Date();
const out: string[] = [
  "# 편집자 검수 목록",
  "",
  `> \`pnpm review\`가 만든 파일이다. 손으로 고치지 않는다 — 만든 때: ${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now)}`,
  "",
  "대조를 마친 claim은 카드 파일(`src/content/cards/<id>.ts`)에서 `verified: true`로 바꾸고, 카드의 `reviewedAt`을 오늘로 적는다.",
  "공개하려면 모든 claim이 검증되고 비판·한계(`counterpoints`)가 1개 이상 있어야 한다 (`pnpm validate`가 막는다).",
  "",
];

const sourceLine = (s: Source) => `[${s.publisher}${s.publishedAt ? ` · ${s.publishedAt}` : ""}](${s.url ?? "#"}) — 「${s.title}」`;

let pendingTotal = 0;
for (const card of CARDS) {
  const sources = new Map(card.sources.map((s) => [s.id, s]));
  const claims: (Claim & { counter?: boolean })[] = [...card.claims, ...card.counterpoints.map((c) => ({ ...c, counter: true }))];
  const pending = claims.filter((c) => !c.verified);
  pendingTotal += pending.length;

  const blockers = [
    pending.length > 0 && `검증 전 claim ${pending.length}개`,
    card.counterpoints.length === 0 && "비판·한계 없음",
    reviewOverdue(card.reviewedAt, now) && `원문 재대조 90일 경과(${card.reviewedAt})`,
  ].filter(Boolean);

  out.push(`## ${card.shortTitle} \`${card.id}\``, "");
  out.push(blockers.length ? `공개 전 남은 일: ${blockers.join(" · ")}` : "공개 조건 충족", "");

  for (const claim of claims) {
    const tags = [
      claim.counter && "비판·한계",
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

writeFileSync("docs/review-checklist.md", out.join("\n"));
console.log(`docs/review-checklist.md — 카드 ${CARDS.length}장, 검증 전 claim ${pendingTotal}개`);
