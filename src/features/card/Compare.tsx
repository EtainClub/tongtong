import { formatDate } from "@/features/labels";
import { compare, SCALE_LABELS, type ScaleValue } from "@/lib/judgment";

type Point = { value: ScaleValue; at: string; cardVersion: number };

/**
 * 처음 vs 지금 (검토 문서 8장).
 *
 * 이것은 입력이 아니라 데이터라서 색을 쓴다 — 잼통 색 의미 그대로
 * navy = 지금(주인공), burgundy = 처음(대조군). 색만으로 구분하지 않도록 모양도 다르다:
 * 지금은 채운 원, 처음은 점선 빈 원.
 * "+2", "생각이 바뀌었어요!" 같은 점수·칭찬을 붙이지 않는다 — 그대로인 것도 같은 무게다 (검토 문서 2.5).
 */
export function Compare({ before, after }: { before: Point; after: Point }) {
  const result = compare(before.value, after.value);
  const labels = SCALE_LABELS.opinion;
  const text = (value: ScaleValue) => (value === null ? "모르겠음" : labels[value - 1]);
  const position = (value: 1 | 2 | 3 | 4 | 5) => `${((value - 1) / 4) * 100}%`;

  return (
    <figure>
      {result.kind !== "incomparable" && (
        <div className="relative mx-3 mt-8 h-10" aria-hidden>
          <div className="absolute top-1/2 right-0 left-0 h-px bg-stone" />
          {labels.map((_, i) => (
            <div key={i} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-stone" style={{ left: position((i + 1) as 1 | 2 | 3 | 4 | 5) }} />
          ))}
          <span
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-burgundy bg-eggshell"
            style={{ left: position(result.kind === "same" ? result.value : result.before) }}
          />
          <span
            // 달라졌으면 navy 점이 처음 자리에서 지금 자리로 옮겨 간다 (globals.css .slide-dot).
            className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy ${result.kind === "moved" ? "slide-dot" : ""}`}
            style={
              result.kind === "moved"
                ? ({ left: position(result.after), "--from": position(result.before) } as React.CSSProperties)
                : { left: position(result.value) }
            }
          />
        </div>
      )}
      {result.kind !== "incomparable" && (
        <div className="mx-0 mt-1 flex justify-between text-[11px] text-smoke">
          <span>{labels[0]}</span>
          <span>{labels[4]}</span>
        </div>
      )}

      <dl className="mt-6 flex flex-col">
        <div className="flex items-center justify-between border-t border-stone py-3">
          <dt className="flex items-center gap-2 text-graphite">
            <span className="inline-block size-3.5 rounded-full border-2 border-dashed border-burgundy" aria-hidden />
            처음 <span className="font-mono text-[11px] text-smoke tabular">{formatDate(Date.parse(before.at))}</span>
          </dt>
          <dd>{text(before.value)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-stone py-3">
          <dt className="flex items-center gap-2 text-graphite">
            <span className="inline-block size-3 rounded-full bg-navy" aria-hidden />
            지금 <span className="font-mono text-[11px] text-smoke tabular">{formatDate(Date.parse(after.at))}</span>
          </dt>
          <dd>{text(after.value)}</dd>
        </div>
      </dl>

      <figcaption className="mt-3 text-[14px] text-graphite">
        {result.kind === "same" && "처음과 같은 판단이에요."}
        {result.kind === "moved" && "처음과 다른 판단이에요."}
        {result.kind === "incomparable" && "한쪽이 '모르겠음'이라 나란히 놓지 않았어요."}
        {before.cardVersion !== after.cardVersion && ` 그 사이 카드가 v${before.cardVersion}에서 v${after.cardVersion}로 바뀌었어요.`}
      </figcaption>
    </figure>
  );
}
