"use client";

import { useState, type FormEvent } from "react";

import type { Card } from "@/content/schema";
import { ClaimItem } from "@/features/card/Reveal";
import type { AskAnswer } from "@/lib/ask/grounding";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";

const ERROR_MESSAGES: Record<string, string> = {
  "ask-rate-limited": "질문이 많았어요. 한 시간쯤 뒤에 다시 물어봐 주세요.",
  "ask-daily-budget": "오늘 AI 이용량이 다 찼어요. 내일 다시 이용해 주세요.",
  "ask-upstream-rate-limited": "요청이 몰리고 있어요. 잠시 후 다시 시도해 주세요.",
};

type Turn = { question: string; answer: AskAnswer };

/**
 * AI에게 따져보기 — 공개 화면의 곁가지 (검토 문서 7.2).
 *
 * 답은 이 카드의 claim에서만 나오고, 인용한 claim을 근거 칩과 함께 보여준다.
 * 근거 없이 답한 경우는 "등록된 자료로는 답할 수 없어요"로 표시한다.
 * 대화는 이 화면에만 있다 — 저장하지 않는다.
 */
export function AskPanel({ card, now }: { card: Card; now: Date }) {
  const { user } = useAuth();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sources = new Map(card.sources.map((s) => [s.id, s]));
  const claims = new Map([...card.claims, ...card.counterpoints].map((c) => [c.id, c]));

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!user || trimmed.length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const answer = await apiFetch<AskAnswer>(user, "/api/ask", { method: "POST", body: { cardId: card.id, question: trimmed } });
      setTurns((prev) => [...prev, { question: trimmed, answer }]);
      setDraft("");
    } catch (e) {
      setError(describeError(e, "답을 가져오지 못했어요. 다시 시도해 주세요.", ERROR_MESSAGES));
    } finally {
      setBusy(false);
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(draft);
  };

  return (
    <div>
      <p className="text-[13px] text-smoke">이 카드에 등록된 자료로만 답해요. 질문과 답은 저장하지 않아요.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {card.suggestedQuestions.map((q) => (
          <button
            key={q}
            type="button"
            disabled={busy}
            onClick={() => void ask(q)}
            className="rounded-pill border border-stone px-3 py-1.5 text-left text-[14px] hover:border-graphite disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      <ol className="mt-6 flex flex-col gap-8" aria-live="polite">
        {turns.map((turn, index) => (
          <li key={index}>
            <p className="text-[14px] text-graphite">Q. {turn.question}</p>
            <p className="mt-2 text-[16px] leading-normal">{turn.answer.answer}</p>
            {turn.answer.grounded ? (
              <ul className="mt-3 flex flex-col gap-3">
                {turn.answer.claimIds.map((id) => {
                  const claim = claims.get(id);
                  return claim ? <ClaimItem key={id} claim={claim} sources={sources} now={now} /> : null;
                })}
              </ul>
            ) : (
              <p className="mt-2 inline-block rounded-pill bg-pending-tint px-2.5 py-0.5 text-[12px] text-pending">등록된 자료로는 답할 수 없어요</p>
            )}
          </li>
        ))}
      </ol>

      {busy && <p className="mt-6 text-[14px] text-smoke">자료를 찾는 중…</p>}

      <form onSubmit={submit} className="mt-6 flex gap-2">
        <label htmlFor={`ask-${card.id}`} className="sr-only">
          이 카드에 대해 질문하기
        </label>
        <input
          id={`ask-${card.id}`}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          maxLength={300}
          placeholder="직접 물어보기"
          className="min-w-0 flex-1 rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink"
        />
        <button type="submit" disabled={busy || draft.trim().length < 2} className="rounded-pill bg-ink px-5 text-eggshell disabled:opacity-40">
          묻기
        </button>
      </form>

      {error && (
        <p role="alert" className="toast-enter mt-4 rounded-sm border border-ink px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
    </div>
  );
}
