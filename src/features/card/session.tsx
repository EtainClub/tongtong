"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";

import { cardVersion, type Card } from "@/content/schema";
import { apiFetch, describeError } from "@/lib/firebase/api";
import type { UserData } from "@/lib/firebase/user-data";
import type { JudgmentWithout } from "@/lib/judgment";

/*
 * 카드 화면 두 갈래(처음 보기 CardFlow · 다시 판단하기 RevisitFlow)가 함께 쓰는 것.
 * 기록 호출, 저장 버튼, 동의 패널, 오류 표시.
 */

export const primaryButton = "w-full rounded-pill bg-ink px-6 py-4 text-eggshell disabled:opacity-40";

const ERROR_MESSAGES: Record<string, string> = {
  "stale-version": "카드 내용이 바뀌었어요. 새로고침해 주세요.",
  "consent-required": "정책 평가를 저장하려면 동의가 필요해요.",
};

/** 한 번 카드를 여는 동안의 세션. sessionId가 재시도 멱등 키다 (lib/user-state.applyJudgment). */
export function useCardSession(card: Card, user: User, data: UserData) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = data.states.get(card.id);
  const consented = typeof data.profile?.consent.opinion === "string";

  async function run(task: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError(describeError(e, "기록하지 못했어요. 다시 시도해 주세요.", ERROR_MESSAGES));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const record = (input: JudgmentWithout<"cardId" | "cardVersion" | "sessionId">) =>
    run(() => apiFetch(user, "/api/judgment", { method: "POST", body: { ...input, cardId: card.id, cardVersion: cardVersion(card), sessionId } }));

  const cardAction = (action: "save" | "unsave" | "complete") =>
    run(() => apiFetch(user, "/api/card-state", { method: "POST", body: { cardId: card.id, action } }));

  const giveConsent = () =>
    run(() =>
      apiFetch(user, "/api/profile", {
        method: "PUT",
        body: { audienceType: data.profile!.audienceType, lifeStages: data.profile!.lifeStages, consentOpinion: true },
      }),
    );

  const toggleSave = () => cardAction(state?.saved ? "unsave" : "save");

  // 새로 고르면 지난 실패 문구는 내린다 — 다시 누를 때 새로 알린다.
  const clearError = () => setError(null);

  return { state, consented, busy, error, clearError, record, cardAction, giveConsent, toggleSave };
}

export function CardHeader({ step, total, saved, busy, onToggleSave }: { step: number; total: number; saved: boolean; busy: boolean; onToggleSave: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/" className="text-[14px] text-graphite underline-offset-4 hover:underline">
        ← 피드
      </Link>
      <span className="font-mono text-[11px] tracking-[0.04em] text-smoke">
        <span aria-hidden="true">
          {String(step).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="sr-only">
          전체 {total}단계 중 {step}단계
        </span>
      </span>
      <button
        type="button"
        onClick={onToggleSave}
        disabled={busy}
        aria-pressed={saved}
        className={`rounded-pill border px-4 py-1.5 text-[14px] ${saved ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone"}`}
      >
        {saved ? "저장됨" : "저장"}
      </button>
    </header>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="toast-enter mt-6 rounded-sm border border-ink px-4 py-3 text-[14px]">
      {error}
    </p>
  );
}

export function ConsentPanel({ busy, onAgree, onDecline }: { busy: boolean; onAgree: () => void; onDecline: () => void }) {
  return (
    <section aria-labelledby="consent-title" className="rounded-card border border-stone p-6 sm:p-8">
      <h2 id="consent-title" className="text-[20px]">정책 평가를 저장할까요?</h2>
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[15px] text-graphite">
        <li>정책에 대한 평가는 정치적 견해로 볼 수 있어, 저장하려면 따로 동의를 받아요.</li>
        <li>저장하면 몇 달 뒤 같은 정책을 다시 볼 때 지금 생각과 나란히 볼 수 있어요.</li>
        <li>내 평가는 다른 사람에게 보이지 않아요. 성향 점수로 합치거나 추천에 쓰지 않아요.</li>
        <li>누가 답했는지 알 수 없는 통통 사용자 전체 분포에는 들어가요. 응답이 30명 넘게 모인 카드만 보여줘요.</li>
        <li>언제든 &lsquo;내 기록&rsquo;에서 철회할 수 있고, 철회하면 저장된 평가도 지워요.</li>
        <li>
          자세한 내용은{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            개인정보처리방침
          </Link>
          에 있어요.
        </li>
      </ul>
      <div className="mt-8 flex flex-col gap-2">
        <button type="button" onClick={onAgree} disabled={busy} className={primaryButton}>
          동의하고 기록하기
        </button>
        <button type="button" onClick={onDecline} disabled={busy} className="w-full rounded-pill border border-stone px-6 py-4">
          저장하지 않고 답하기
        </button>
      </div>
    </section>
  );
}
