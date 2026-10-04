"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ErrorNote } from "@/features/card/session";
import { formatDate } from "@/features/labels";
import { changeText, TRIGGER_LABELS, versionSummary } from "@/features/plan/changeText";
import { PlanGate } from "@/features/plan/PlanGate";
import type { Blueprint, Version } from "@/lib/blueprint/model";
import { readVersions } from "@/lib/firebase/blueprint";

/*
 * REV 기록 /plan/revisions (청사진 설계 7.7).
 *
 * 최근 것부터 30개씩, "더 보기"로 이어 읽는다(6.1 — 상태 하나 바꿀 때마다 기록이 생긴다).
 * 한 줄을 펼치면 그 REV의 변경 — 상태 변경은 따로 접어 둔다. 숫자로 "변화량"을 요약하지 않는다.
 * 기록은 고치지 않는다 — 되돌리기도 새 REV다.
 */

const PAGE = 30;

export function Revisions() {
  return (
    <PlanGate>
      {({ user, active }) =>
        active.blueprint ? (
          <History key={`${active.blueprint.id}-${active.blueprint.rev}`} user={user} blueprint={active.blueprint} />
        ) : (
          <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
            <p className="mt-16 text-graphite">청사진이 없어요.</p>
            <Link href="/plan" className="mt-4 inline-block underline underline-offset-4">
              청사진으로
            </Link>
          </main>
        )
      }
    </PlanGate>
  );
}

function History({ user, blueprint }: { user: User; blueprint: Blueprint }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = user.uid;
  const blueprintId = blueprint.id;

  async function fetchPage(before?: number) {
    try {
      const page = await readVersions(uid, blueprintId, before, PAGE);
      setVersions((prev) => (before === undefined ? page : [...prev, ...page]));
      setDone(page.length < PAGE);
    } catch {
      setError("기록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  function more(before: number) {
    setBusy(true);
    setError(null);
    void fetchPage(before);
  }

  // 첫 쪽. 새 REV가 생기면 부모가 key로 이 컴포넌트를 새로 만든다.
  useEffect(() => {
    let live = true;
    readVersions(uid, blueprintId, undefined, PAGE)
      .then((page) => {
        if (!live) return;
        setVersions(page);
        setDone(page.length < PAGE);
      })
      .catch(() => live && setError("기록을 불러오지 못했어요. 다시 시도해 주세요."))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
  }, [uid, blueprintId]);

  // 배치 id → 정책 id. 지금 청사진에 없는(뺀) 배치는 기록의 넣음·뺌에서 찾는다.
  const policyOfPlacement = new Map(blueprint.placements.map((p) => [p.id, p.policyId]));
  for (const change of versions.flatMap((v) => v.changes)) {
    const policyId = change.after?.policyId ?? change.before?.policyId;
    if ((change.op === "add" || change.op === "remove") && typeof policyId === "string" && !policyOfPlacement.has(change.targetId)) {
      policyOfPlacement.set(change.targetId, policyId);
    }
  }
  const lookup = (placementId: string) => policyOfPlacement.get(placementId);

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-24">
      <Link href="/plan" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 내 청사진
      </Link>
      <h1 className="mt-6 text-[28px] leading-tight font-bold tracking-tight">REV 기록</h1>
      <p className="mt-2 text-[15px] text-graphite">{blueprint.goal.title} — 무엇이 언제 왜 바뀌었는지</p>

      <ol className="mt-8 flex flex-col">
        {versions.map((version) => {
          const status = version.changes.filter((c) => c.op === "status");
          const others = version.changes.filter((c) => c.op !== "status");
          return (
            <li key={version.rev} className="border-t border-stone py-4">
              <details>
                <summary className="flex cursor-pointer items-baseline gap-3">
                  <span className="shrink-0 font-mono text-[14px] tabular">REV.{version.rev}</span>
                  <span className="min-w-0 flex-1 text-[15px]">{versionSummary(version.intent, version.changes, lookup)}</span>
                  <span className="shrink-0 text-[12px] text-smoke">
                    {formatDate(Date.parse(version.createdAt))} · {TRIGGER_LABELS[version.trigger.kind]}
                  </span>
                </summary>
                <ul className="mt-3 flex flex-col gap-1.5 pl-1 text-[14px] text-graphite">
                  {others.map((change, i) => (
                    <li key={`${change.op}-${change.targetId}-${i}`}>{changeText(change, lookup)}</li>
                  ))}
                  {status.length > 0 && (
                    <li>
                      <details>
                        <summary className="cursor-pointer">상태 변경 {status.length}건</summary>
                        <ul className="mt-1.5 flex flex-col gap-1.5 pl-3">
                          {status.map((change, i) => (
                            <li key={`${change.targetId}-${i}`}>{changeText(change, lookup)}</li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  )}
                  {version.changes.length === 0 && <li>{version.trigger.kind === "path" ? "견본에서 만들었어요." : "청사진을 만들었어요."}</li>}
                </ul>
              </details>
            </li>
          );
        })}
      </ol>

      {busy && versions.length === 0 && <p className="fade-in-late text-graphite">불러오는 중…</p>}
      {!done && versions.length > 0 && (
        <button type="button" disabled={busy} onClick={() => more(versions[versions.length - 1].rev)} className="mt-4 rounded-pill border border-stone px-5 py-2.5 disabled:opacity-40">
          더 보기
        </button>
      )}
      <ErrorNote error={error} />
    </main>
  );
}
