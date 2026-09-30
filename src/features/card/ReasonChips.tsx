"use client";

import type { Card } from "@/content/schema";

/** 한 번에 고를 수 있는 이유 수. 서버 한도(5)보다 작게 — 가장 큰 이유 몇 개만 묻는다. */
export const MAX_REASONS = 3;

/**
 * "왜 그렇게 봤나요?" (설계 14장 reasonCodes, 로드맵 4.2).
 *
 * 고르지 않아도 된다. 목록은 카드마다 고정 순서다 — 고른 척도 값에 따라 긍정·부정 이유를 바꿔 보여 주지 않는다.
 * 판단 값과 같은 민감정보라 동의하지 않았으면 저장하지 않는다(호출부가 정한다).
 */
export function ReasonChips({ card, value, onChange, disabled }: { card: Card; value: string[]; onChange: (next: string[]) => void; disabled?: boolean }) {
  if (card.reasonOptions.length === 0) return null;

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const full = value.length >= MAX_REASONS;

  return (
    <fieldset className="mt-8">
      <legend className="text-[16px]">
        왜 그렇게 봤나요? <span className="text-[14px] text-smoke">(선택, {MAX_REASONS}개까지)</span>
      </legend>
      <div className="stagger mt-3 flex flex-wrap gap-2">
        {card.reasonOptions.map((reason) => {
          const selected = value.includes(reason.id);
          return (
            <button
              key={reason.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled || (full && !selected)}
              onClick={() => toggle(reason.id)}
              className={`rounded-pill border px-4 py-2 text-left text-[15px] disabled:opacity-40 ${selected ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
            >
              {reason.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 저장된 이유 id를 라벨로. 카드에서 빠진 이유는 건너뛴다. */
export function reasonLabels(card: Card, codes: readonly string[]): string[] {
  return codes.map((code) => card.reasonOptions.find((r) => r.id === code)?.label).filter((label): label is string => Boolean(label));
}
