"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { findCard } from "@/content/cards";
import { findPath, PATHS } from "@/content/paths";
import { findPolicy, POLICIES } from "@/content/policies";
import { ClaimItem } from "@/features/card/Reveal";
import { ErrorNote, primaryButton } from "@/features/card/session";
import { formatDate } from "@/features/labels";
import { ChecksPanel } from "@/features/plan/ChecksPanel";
import { PlanGate } from "@/features/plan/PlanGate";
import { AddPolicy, GoalForm, MilestoneForm, PlacementDetail } from "@/features/plan/PlanSheets";
import { policyName, Timeline } from "@/features/plan/Timeline";
import { Sheet } from "@/features/ui/Sheet";
import type { BlueprintOp } from "@/lib/blueprint/apply";
import { checkBlueprint, openChecks, type Check, type Fix } from "@/lib/blueprint/check";
import type { Blueprint } from "@/lib/blueprint/model";
import { currentMonth } from "@/lib/blueprint/month";
import { apiFetch } from "@/lib/firebase/api";
import { describeBlueprintError, useBlueprintWriter } from "@/lib/firebase/blueprint";
import { useUserData } from "@/lib/firebase/user-data";

/*
 * 내 청사진 /plan (청사진 설계 7.3).
 *
 * 머리(목표·REV) → 늘 보이는 한 줄(정책은 해마다 바뀐다) → 점검 묶음 → 시간축 → 넣기 버튼 → 보관.
 * 배치·이정표를 누르면 시트가 열린다. 고칠 때마다 REV가 오르고, 화면은 구독으로 따라간다.
 * 점검은 열 때마다 계산한다(lib/blueprint/check) — 저장하는 것은 닫은 알림의 키뿐이다.
 * ?add={정책 id}로 들어오면(카드 끝 화면·정책 페이지의 "청사진에 넣기") 그 정책을 넣는 시트가 바로 열린다.
 */

type OpenSheet = { kind: "placement"; id: string } | { kind: "add"; policyId?: string } | { kind: "milestone"; id: string | null } | { kind: "goal" } | null;

const policyMap = new Map(POLICIES.map((policy) => [policy.id, policy]));
const pathMap = new Map(PATHS.map((path) => [path.id, path]));
const hasCard = (policyId: string) => Boolean(findCard(policyId));

export function PlanView() {
  const add = useSearchParams().get("add");
  return <PlanGate>{({ user, active }) => (active.blueprint ? <Plan user={user} blueprint={active.blueprint} add={add} /> : <Empty adding={Boolean(add)} />)}</PlanGate>;
}

function Empty({ adding }: { adding: boolean }) {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <h1 className="mt-10 text-[36px] leading-[1.17] font-light tracking-[-0.02em]">내 청사진</h1>
      <p className="mt-4 text-[17px] leading-relaxed">되고 싶은 것을 정하면, 그 길에서 언제 어떤 정책을 쓸지 시간축에 놓아 볼 수 있어요. 정책이 바뀌면 같이 고쳐 가요.</p>
      {adding && <p className="mt-4 text-[15px] text-graphite">정책을 넣으려면 먼저 청사진을 만들어요.</p>}
      <Link href="/plan/new" className={`${primaryButton} mt-10 block text-center`}>
        청사진 만들기
      </Link>
    </main>
  );
}

function Plan({ user, blueprint, add }: { user: User; blueprint: Blueprint; add: string | null }) {
  const [now] = useState(() => new Date());
  const nowMonth = currentMonth(now);
  const data = useUserData();
  const writer = useBlueprintWriter(user, blueprint);
  // 링크로 정책을 들고 들어왔으면 넣기 시트부터 — 카드를 끝낸 뒤 두 번 탭 안에 넣는다(B3 완료 기준).
  // 그 정책은 이 시트에만 붙인다. 주소의 ?add=는 지운다 — 새로고침하거나 "+ 정책 넣기"를 다시 눌러도 같은 정책으로 열리지 않게.
  const [sheet, setSheet] = useState<OpenSheet>(() => (add && findPolicy(add) ? { kind: "add", policyId: add } : null));
  useEffect(() => {
    if (add) window.history.replaceState(null, "", "/plan");
  }, [add]);
  const [archiving, setArchiving] = useState<"idle" | "confirm" | "busy">("idle");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const completedCards = useMemo(() => new Set([...data.states.values()].filter((s) => s.completedAt).map((s) => s.cardId)), [data.states]);
  const allChecks = useMemo(
    () => checkBlueprint(blueprint, { policies: policyMap, paths: pathMap, hasCard, completedCards, now }),
    [blueprint, completedCards, now],
  );
  const checks = openChecks(allChecks, blueprint.ackedChecks);

  const close = () => {
    setSheet(null);
    writer.clearError();
  };
  const onOps = async (ops: BlueprintOp[], options?: { close?: boolean }) => {
    setNotice(null);
    if ((await writer.send(ops)) && options?.close) close();
  };
  const onFix = async (check: Check, fix: Fix) => {
    setNotice(null);
    const done = await writer.send(fix.ops, { trigger: { kind: "check", checkKind: check.kind, ...(check.policyId && { policyId: check.policyId }) } });
    if (done) setNotice(`REV.${blueprint.rev + 1}로 저장했어요.`);
  };
  const onDismiss = async (check: Check) => {
    setNotice(null);
    await writer.ack([check.key], allChecks.map((c) => c.key));
  };

  async function archive() {
    setArchiving("busy");
    setArchiveError(null);
    try {
      await apiFetch(user, `/api/blueprint?id=${encodeURIComponent(blueprint.id)}`, { method: "DELETE" });
    } catch (e) {
      setArchiveError(describeBlueprintError(e));
      setArchiving("confirm");
    }
  }

  const path = blueprint.goal.pathId ? findPath(blueprint.goal.pathId) : undefined;
  const placement = sheet?.kind === "placement" ? blueprint.placements.find((p) => p.id === sheet.id) : undefined;
  const milestone = sheet?.kind === "milestone" && sheet.id ? (blueprint.milestones.find((m) => m.id === sheet.id) ?? null) : null;
  const sheetProps = { busy: writer.busy, onOps };

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-24">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <p className="mt-10 flex justify-between text-[13px] text-smoke">
        <span>내 청사진</span>
        <Link href="/plan/revisions" className="font-mono tabular underline-offset-4 hover:underline">
          REV.{blueprint.rev} · {formatDate(Date.parse(blueprint.updatedAt))} 수정
        </Link>
      </p>
      <h1 className="mt-1 text-[32px] leading-tight font-light tracking-[-0.02em]">
        {blueprint.goal.title} <span className="font-mono text-[20px] text-smoke tabular">({blueprint.goal.horizonYear})</span>
      </h1>
      <button type="button" onClick={() => setSheet({ kind: "goal" })} className="mt-2 text-[14px] text-graphite underline underline-offset-4">
        목표 바꾸기
      </button>
      <p className="mt-4 text-[14px] text-smoke">정책은 해마다 바뀌어요. 예상·미정 칸은 공식 공고로 다시 확인하세요. 대상인지는 신청 기관이 정해요.</p>
      {path && path.caveats.length > 0 && (
        // 견본에서 만든 청사진이면 그 경로의 한계를 늘 다시 볼 수 있게 (검토 A-18). 만들기 미리보기에만 두면 만든 뒤 사라진다.
        <details className="mt-4 border-t border-stone pt-4">
          <summary className="cursor-pointer text-[15px]">이 경로의 한계</summary>
          <ul className="mt-4 flex flex-col gap-4">
            {path.caveats.map((claim) => (
              <ClaimItem key={claim.id} claim={claim} sources={new Map(path.sources.map((s) => [s.id, s]))} now={now} />
            ))}
          </ul>
        </details>
      )}

      <ChecksPanel
        checks={checks}
        busy={writer.busy}
        onFix={onFix}
        onDismiss={onDismiss}
        onOpen={(placementId) => setSheet({ kind: "placement", id: placementId })}
      />
      {notice && (
        <p role="status" className="toast-enter mt-3 text-[14px] text-graphite">
          {notice}{" "}
          <Link href="/plan/revisions" className="underline underline-offset-4">
            REV 기록
          </Link>
        </p>
      )}
      {!sheet && <ErrorNote error={writer.error} />}

      <div className="mt-8">
        <Timeline
          blueprint={blueprint}
          nowMonth={nowMonth}
          onPlacement={(p) => setSheet({ kind: "placement", id: p.id })}
          onMilestone={(m) => setSheet({ kind: "milestone", id: m.id })}
        />
      </div>
      {blueprint.placements.length === 0 && <p className="mt-2 text-graphite">아직 넣은 정책이 없어요.</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => setSheet({ kind: "add" })} className="rounded-pill border border-ink px-5 py-2.5">
          + 정책 넣기
        </button>
        <button type="button" onClick={() => setSheet({ kind: "milestone", id: null })} className="rounded-pill border border-stone px-5 py-2.5 hover:border-graphite">
          + 이정표
        </button>
        <Link href="/plan/revisions" className="rounded-pill border border-stone px-5 py-2.5 hover:border-graphite">
          REV 기록
        </Link>
      </div>

      <section className="mt-16 border-t border-stone pt-6">
        {archiving === "idle" ? (
          <button type="button" onClick={() => setArchiving("confirm")} className="text-[14px] text-graphite underline underline-offset-4">
            이 청사진 보관하기
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[15px]">보관하면 새 청사진을 만들 수 있어요. 보관한 청사진은 남아 있다가, 내 기록의 청사진 지우기로 모두 지울 수 있어요.</p>
            <div className="flex gap-2">
              <button type="button" disabled={archiving === "busy"} onClick={archive} className="rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
                보관하기
              </button>
              <button type="button" onClick={() => setArchiving("idle")} className="rounded-pill border border-stone px-5 py-2.5">
                그대로 두기
              </button>
            </div>
            <ErrorNote error={archiveError} />
          </div>
        )}
      </section>

      <Sheet open={sheet?.kind === "placement" && Boolean(placement)} title={placement ? policyName(placement.policyId) : "정책"} onClose={close}>
        {placement && <PlacementDetail key={placement.id} blueprint={blueprint} placement={placement} now={now} {...sheetProps} />}
        <ErrorNote error={writer.error} />
      </Sheet>
      <Sheet open={sheet?.kind === "add"} title="정책 넣기" onClose={close}>
        {sheet?.kind === "add" && <AddPolicy blueprint={blueprint} nowMonth={nowMonth} initial={sheet.policyId ? findPolicy(sheet.policyId) : undefined} {...sheetProps} />}
        <ErrorNote error={writer.error} />
      </Sheet>
      <Sheet open={sheet?.kind === "milestone"} title={milestone ? "이정표 고치기" : "이정표 넣기"} onClose={close}>
        {sheet?.kind === "milestone" && <MilestoneForm key={sheet.id ?? "new"} milestone={milestone} nowMonth={nowMonth} {...sheetProps} />}
        <ErrorNote error={writer.error} />
      </Sheet>
      <Sheet open={sheet?.kind === "goal"} title="목표 바꾸기" onClose={close}>
        {sheet?.kind === "goal" && <GoalForm blueprint={blueprint} {...sheetProps} />}
        <ErrorNote error={writer.error} />
      </Sheet>
    </main>
  );
}
