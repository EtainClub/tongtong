import type { Game } from "@/content/schema";
import { formatWon } from "@/features/labels";

/* 게임들이 함께 쓰는 부품 (features/card/games, games-extra). */

/** onReveal — 결과가 공개되는 순간 한 번. 맞혔으면 true, 틀렸으면 false, 정답이 없는 게임은 null (측정용, 로드맵 M8). */
export type GameProps<T extends Game["type"]> = { game: Extract<Game, { type: T }>; onDone: () => void; onReveal: (correct: boolean | null) => void };

export const pill = (active: boolean) =>
  `rounded-pill border px-5 py-3 text-left text-[16px] transition-colors duration-150 ${
    active ? "border-ink bg-ink text-eggshell" : "border-stone bg-eggshell hover:border-graphite"
  }`;

/** 공개 뒤 선택지. 색 없이 — 정답은 ink로 채우고, 내가 고른 오답은 취소선, 나머지는 흐리게 (로드맵 4.2). */
export const revealed = (isAnswer: boolean, isPicked: boolean) =>
  `rounded-pill border px-5 py-3 text-left text-[16px] ${
    isAnswer ? "tong-pop border-ink bg-ink text-eggshell" : isPicked ? "border-stone text-smoke line-through" : "border-stone text-smoke"
  }`;

export const primaryAction = "mt-8 w-full rounded-pill bg-ink px-6 py-4 text-eggshell disabled:opacity-40";

export function Next({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={primaryAction}>
      사실 확인하기
    </button>
  );
}

/**
 * 내 예상과 실제 값을 한 막대 위에 (로드맵 4.2). 데이터라서 색을 쓴다 —
 * navy 채운 점 = 실제, burgundy 점선 원 = 내 예상 (Compare와 같은 약속).
 */
export function ValueBar({
  min,
  max,
  actual,
  guess,
  format = formatWon,
  showRange = true,
}: {
  min: number;
  max: number;
  actual: number[];
  guess: number;
  format?: (value: number) => string;
  showRange?: boolean;
}) {
  const position = (value: number) => `${((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100}%`;
  return (
    <div aria-hidden>
      <div className="relative mx-3 h-10">
        <div className="absolute top-1/2 right-0 left-0 h-px bg-stone" />
        <span
          className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-burgundy bg-eggshell"
          style={{ left: position(guess) }}
        />
        {actual.map((value) => (
          <span key={value} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy" style={{ left: position(value) }} />
        ))}
      </div>
      {showRange && (
        <div className="flex justify-between font-mono text-[11px] text-smoke tabular">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      )}
    </div>
  );
}

/** 막대 옆 범례 두 가지. */
export const ActualDot = () => <span className="inline-block size-3 shrink-0 rounded-full bg-navy" aria-hidden />;
export const GuessRing = () => <span className="inline-block size-3.5 shrink-0 rounded-full border-2 border-dashed border-burgundy" aria-hidden />;

/** − 값 + . 슬라이더를 끌지 않아도 버튼으로 값을 정할 수 있어야 한다. */
export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  disabled?: boolean;
}) {
  const button = "size-11 shrink-0 rounded-full border border-stone text-[20px] hover:border-graphite disabled:opacity-30";
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label={`${label} 줄이기`} disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - step))} className={button}>
        −
      </button>
      <span className="min-w-0 flex-1 text-center font-mono text-[20px] tabular" aria-live="polite">
        {format(value)}
      </span>
      <button type="button" aria-label={`${label} 늘리기`} disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + step))} className={button}>
        +
      </button>
    </div>
  );
}
