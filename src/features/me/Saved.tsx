"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CARDS } from "@/content/cards";
import { APPLICATION_LABELS, revisitLabel } from "@/features/labels";
import { Notice } from "@/features/ui/Notice";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";
import { orderSaved } from "@/lib/saved";

const UNDO_MS = 5000;

/**
 * 저장한 카드 (설계 56장 /saved, 로드맵 4.4).
 * 새 정보·신청 중·다시 볼 때가 먼저 온다. 저장 해제는 확인 없이 하고, 5초 동안 되돌릴 수 있다.
 */
export function Saved() {
  const { user } = useAuth();
  const data = useUserData();
  const [now] = useState(() => new Date());
  const [undo, setUndo] = useState<{ cardId: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;

  const entries = orderSaved(CARDS, data.states, now);

  async function act(cardId: string, action: "save" | "unsave") {
    if (!user) return false;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, "/api/card-state", { method: "POST", body: { cardId, action } });
      return true;
    } catch (caught) {
      setError(describeError(caught, "처리하지 못했어요. 다시 시도해 주세요."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const unsave = async (cardId: string, title: string) => {
    if (await act(cardId, "unsave")) setUndo({ cardId, title });
  };
  const restore = async () => {
    if (undo && (await act(undo.cardId, "save"))) setUndo(null);
  };

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <Link href="/me" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 내 기록
      </Link>
      <h1 className="mt-10 text-[36px] leading-[1.17] font-light tracking-[-0.02em]">저장한 카드</h1>

      {entries.length === 0 ? (
        <p className="mt-10 text-graphite">카드 끝 화면이나 머리의 &lsquo;저장&rsquo;으로 모을 수 있어요. 새 정보가 생기면 여기서 먼저 보여 드려요.</p>
      ) : (
        <ul className="stagger mt-8 flex flex-col">
          {entries.map(({ card, reason, application }) => (
            <li key={card.id} className="flex items-start gap-3 border-t border-stone py-4">
              <Link href={`/card/${card.id}`} className="min-w-0 flex-1 underline-offset-4 hover:underline">
                <span className="flex flex-wrap items-center gap-2">
                  {card.shortTitle}
                  {reason && <span className="rounded-pill bg-pending-tint px-2 py-0.5 text-[11px] text-pending">{revisitLabel(reason)}</span>}
                </span>
                <span className="mt-1 block text-[14px] text-graphite">{card.hook}</span>
                {application && <span className="mt-1 block text-[13px] text-smoke">{APPLICATION_LABELS[application]}</span>}
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => unsave(card.id, card.shortTitle)}
                className="shrink-0 rounded-pill border border-stone px-3 py-1.5 text-[13px] hover:border-graphite disabled:opacity-40"
              >
                저장 해제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 되돌리기는 화면 아래에 붙인다 — 목록 어디에서 눌렀든 보이게. */}
      {(undo || error) && (
        <div role="status" className="toast-enter sticky bottom-[calc(var(--bottom-nav,0px)+1rem)] mt-6 flex items-center justify-between gap-3 rounded-sm border border-ink bg-canvas px-4 py-3 text-[14px]">
          <span>{error ?? `${undo!.title} 저장을 해제했어요.`}</span>
          {undo && !error && (
            <button type="button" onClick={restore} disabled={busy} className="shrink-0 underline underline-offset-4 disabled:opacity-40">
              되돌리기
            </button>
          )}
        </div>
      )}
    </main>
  );
}
