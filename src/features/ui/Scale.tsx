"use client";

import type { ScaleValue } from "@/lib/judgment";

type Props = {
  label: string;
  /** 1–5 순서의 다섯 라벨. */
  options: readonly string[];
  value: ScaleValue | undefined;
  onChange: (value: ScaleValue) => void;
  disabled?: boolean;
};

/**
 * 판단 척도 (검토 문서 2.3·2.4·8장).
 *
 * - 별(★)이 아니라 라벨 붙은 5칸. 별은 품질 평점으로 읽힌다.
 * - 무채색. 판단은 데이터가 아니라 입력이다 — 선택된 칸만 ink로 채운다.
 * - "모르겠음"은 가운데 칸이 아니라 따로 떨어진 버튼이고, 값은 null이다.
 */
export function Scale({ label, options, value, onChange, disabled }: Props) {
  const fill = (selected: boolean) =>
    `transition-colors duration-150 disabled:opacity-50 ${selected ? "pick-pop bg-ink text-eggshell" : "bg-eggshell text-graphite hover:bg-taupe"}`;

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-3">
      {/* 이어 붙은 다섯 칸 하나가 한 개의 척도로 읽힌다. 칸마다 둥근 알약을 두면 두 줄 라벨이 동그라미 안에서 찌그러진다. */}
      <div className="grid grid-cols-5 overflow-hidden rounded-card border border-stone">
        {options.map((text, index) => {
          const optionValue = (index + 1) as 1 | 2 | 3 | 4 | 5;
          const selected = value === optionValue;
          return (
            <button
              key={text}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(optionValue)}
              className={`min-h-14 border-l border-stone px-1 py-2 text-[13px] leading-tight first:border-l-0 ${fill(selected)}`}
            >
              {text}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        disabled={disabled}
        onClick={() => onChange(null)}
        className={`self-center rounded-pill border px-6 py-2.5 text-[14px] ${value === null ? "border-ink" : "border-stone"} ${fill(value === null)}`}
      >
        모르겠음
      </button>
    </div>
  );
}
