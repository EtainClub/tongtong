import type { Card, Claim, Source } from "@/content/schema";
import { APPLICATION_LABELS, ASSERTION_LABELS, formatDate, formatShortDate } from "@/features/labels";
import { claimState, currentApplication, endOf, startOf } from "@/lib/policy-state";

/*
 * 사실 공개. 모든 문장이 근거 칩으로 끝난다 (설계 72장 1, 잼통 "근거가 없으면 그리지 않는다").
 * 검증 전·기준일 지난 claim은 pending 색 — 틀렸다는 뜻이 아니라 "아직 확인 전"이다.
 */

function EvidenceChip({ source }: { source: Source }) {
  const label = `${source.publisher}${source.publishedAt ? ` · ${formatDate(startOf(source.publishedAt))}` : ""}`;
  const className = "inline-flex rounded-pill border border-stone px-2.5 py-0.5 text-[12px] text-graphite tabular";
  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer" data-source-link className={`${className} hover:border-graphite`}>
      {label} ↗
    </a>
  ) : (
    <span className={className}>{label}</span>
  );
}

export function ClaimItem({ claim, sources, now }: { claim: Claim; sources: Map<string, Source>; now: Date }) {
  const expired = claimState(claim, now) === "expired";
  const kind = ASSERTION_LABELS[claim.assertionType];
  return (
    <li className="border-t border-stone pt-4">
      <p className={`text-[16px] leading-normal ${expired ? "text-smoke line-through" : ""}`}>{claim.text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {kind && <span className="rounded-pill bg-taupe px-2.5 py-0.5 text-[11px] text-graphite">{kind}{claim.assertedBy ? ` · ${claim.assertedBy}` : ""}</span>}
        {!claim.verified && <span className="rounded-pill bg-pending-tint px-2.5 py-0.5 text-[11px] text-pending">검증 전</span>}
        {expired && <span className="rounded-pill bg-pending-tint px-2.5 py-0.5 text-[11px] text-pending">기준일 지남</span>}
        {claim.sourceIds.map((id) => {
          const source = sources.get(id);
          return source ? <EvidenceChip key={id} source={source} /> : null;
        })}
      </div>
    </li>
  );
}

export function Reveal({ card, now }: { card: Card; now: Date }) {
  const sources = new Map(card.sources.map((s) => [s.id, s]));
  const claims = new Map(card.claims.map((c) => [c.id, c]));
  const application = currentApplication(card.policy.applications, now);

  return (
    <section aria-labelledby="reveal-title">
      <h2 id="reveal-title" className="text-[24px] leading-tight font-light">
        실제로는
      </h2>

      {application && (
        <div className="mt-4 rounded-sm border border-stone p-4 text-[14px]">
          <p>
            <span className="font-medium">{application.app.label} {APPLICATION_LABELS[application.state]}</span>
            <span className="ml-2 font-mono text-graphite tabular">
              {formatShortDate(startOf(application.app.startAt))}–{formatShortDate(endOf(application.app.endAt))}
            </span>
          </p>
          {application.app.note && <p className="mt-1 text-graphite">{application.app.note}</p>}
          {application.app.url && application.state !== "closed" && (
            <a href={application.app.url} target="_blank" rel="noreferrer" className="mt-2 inline-block underline underline-offset-4">
              공식 신청처 ↗
            </a>
          )}
        </div>
      )}

      <ul className="stagger mt-6 flex flex-col gap-4">
        {card.reveal.claimIds.map((id) => {
          const claim = claims.get(id);
          return claim ? <ClaimItem key={id} claim={claim} sources={sources} now={now} /> : null;
        })}
      </ul>

      {card.counterpoints.length > 0 && (
        <>
          <h3 className="mt-10 text-[18px] font-medium">비판과 한계</h3>
          <ul className="stagger mt-4 flex flex-col gap-4">
            {card.counterpoints.map((claim) => (
              <ClaimItem key={claim.id} claim={claim} sources={sources} now={now} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

const SOURCE_TYPE_LABELS: Record<Source["type"], string> = {
  official: "정부·공공기관",
  statistics: "통계",
  legislative: "국회·법령",
  judicial: "판결",
  interview: "발언",
  press: "언론",
  research: "연구",
};

/**
 * 원자료 목록 (설계 56장 /card/{id}/sources를 카드 안 시트로).
 * 출처마다 그 출처에 기댄 문장을 모두 모은다 — 공개 화면에 안 뜬 claim까지.
 */
export function SourceList({ card, now }: { card: Card; now: Date }) {
  const sources = new Map(card.sources.map((s) => [s.id, s]));
  const allClaims = [...card.claims, ...card.counterpoints];

  return (
    <div className="flex flex-col gap-8">
      {card.sources.map((source) => (
        <section key={source.id}>
          <p className="text-[12px] text-smoke">{SOURCE_TYPE_LABELS[source.type]}</p>
          <p className="mt-1 text-[16px]">{source.title}</p>
          <div className="mt-2">
            <EvidenceChip source={source} />
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {allClaims
              .filter((claim) => claim.sourceIds.includes(source.id))
              .map((claim) => (
                <ClaimItem key={claim.id} claim={claim} sources={sources} now={now} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
