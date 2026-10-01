"use client";

import { useState, type FormEvent } from "react";

import type { Card } from "@/content/schema";
import { CORRECTION_HOURLY_LIMIT } from "@/lib/correction";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";

const ERROR_MESSAGES: Record<string, string> = {
  "correction-rate-limited": `한 시간에 ${CORRECTION_HOURLY_LIMIT}건까지 받아요. 조금 뒤에 다시 보내 주세요.`,
};

/**
 * 정정 요청 — 공개 화면·정책 페이지의 곁가지 (검토 문서 9장).
 * 창구가 화면에 보여야 한다. 접수한 내용은 공개하지 않고 운영자만 본다.
 * 사실은 정책 항목에 있으므로 카드도 항목도 받는다 (id가 같다).
 */
export function CorrectionPanel({ card }: { card: Pick<Card, "id" | "claims" | "counterpoints"> }) {
  const { user } = useAuth();
  const [claimId, setClaimId] = useState("");
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const claims = [...card.claims, ...card.counterpoints];
  const tooShort = body.trim().length < 10;

  // 고치는 중에는 지난 실패 문구를 내린다.
  const edit =
    (set: (value: string) => void) =>
    (event: { target: { value: string } }) => {
      setError(null);
      set(event.target.value);
    };

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || tooShort || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, "/api/correction", {
        method: "POST",
        body: { cardId: card.id, claimId: claimId || undefined, body: body.trim(), contact: contact.trim() || undefined },
      });
      setSent(true);
    } catch (e) {
      setError(describeError(e, "보내지 못했어요. 다시 시도해 주세요.", ERROR_MESSAGES));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {sent ? (
        <p role="status" className="text-[15px]">
          보내 주셔서 고마워요. 근거를 확인해 고칠 것은 고치고, 고친 내용은 개정 기록에 남겨요.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-[13px] text-smoke">운영자만 봐요. 이름 없이 접수돼요. 근거가 되는 자료 주소를 함께 적어 주면 빨리 확인할 수 있어요.</p>
          <label className="flex flex-col gap-1.5 text-[14px]">
            <span>
              어느 내용인가요? <span className="text-smoke">(선택)</span>
            </span>
            <select value={claimId} onChange={edit(setClaimId)} className="rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink">
              <option value="">전체</option>
              {claims.map((claim) => (
                <option key={claim.id} value={claim.id}>
                  {claim.text.length > 40 ? `${claim.text.slice(0, 40)}…` : claim.text}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-[14px]">
            <span>무엇이 틀렸나요?</span>
            <textarea
              value={body}
              onChange={edit(setBody)}
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              className="rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink"
            />
            {/* 보내기가 왜 꺼져 있는지 알 수 있게. */}
            <span className="text-[13px] text-smoke">
              {tooShort ? "10자 이상 적어 주세요." : <span className="font-mono tabular">{body.length} / 1000</span>}
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-[14px]">
            <span>
              회신 받을 연락처 <span className="text-smoke">(선택)</span>
            </span>
            <input
              value={contact}
              onChange={edit(setContact)}
              maxLength={200}
              className="rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[16px] focus:border-ink"
            />
          </label>
          <button type="submit" disabled={tooShort || busy || !user} className="rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
            {busy ? "보내는 중…" : "보내기"}
          </button>
          {error && (
            <p role="alert" className="toast-enter rounded-sm border border-ink px-4 py-3 text-[14px]">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
