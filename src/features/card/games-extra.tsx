"use client";

import { useState } from "react";

import { ActualDot, GuessRing, Next, pill, primaryAction, revealed, Stepper, ValueBar, type GameProps } from "@/features/card/game-parts";
import { eyo, formatManwon } from "@/features/labels";

/*
 * M5에서 더한 게임 다섯 가지 (설계 9장, 로드맵 4.2).
 * 모두 버튼만으로 끝낼 수 있다 — 슬라이더·순서 바꾸기에는 −/+, ↑/↓ 버튼이 있다.
 * 공개는 "통!" 한 번. 색은 데이터(내 예상 vs 실제)에만.
 */

const Question = ({ text, premise }: { text: string; premise?: string }) => (
  <>
    <p className="text-[22px] leading-snug font-bold tracking-tight">{text}</p>
    {premise && <p className="mt-3 text-[14px] text-graphite">{premise}</p>}
  </>
);

const Result = ({ children }: { children: string }) => (
  <p className="mt-6 text-[18px]">
    <span className="tong-pop">{children}</span>
  </p>
);

/** 숫자 맞히기 — 횟수·개월·% (금액은 guess_amount). */
export function Slider({ game, onDone, onReveal }: GameProps<"slider">) {
  const format = (value: number) => `${value.toLocaleString("ko-KR")}${game.unit}`;
  const [value, setValue] = useState(() => game.min + Math.round((game.max - game.min) / 2 / game.step) * game.step);
  const [locked, setLocked] = useState(false);

  return (
    <div>
      <Question text={game.question} premise={game.premise} />
      <div className="mt-8">
        <Stepper label="예상 값" value={value} onChange={setValue} min={game.min} max={game.max} step={game.step} format={format} disabled={locked} />
      </div>
      <input
        type="range"
        min={game.min}
        max={game.max}
        step={game.step}
        value={value}
        disabled={locked}
        onChange={(event) => setValue(Number(event.target.value))}
        aria-label="예상 값"
        aria-valuetext={format(value)}
        className="mt-4 w-full accent-ink"
      />
      {!locked ? (
        <button type="button" onClick={() => {
            setLocked(true);
            onReveal(value === game.answer);
          }} className={primaryAction}>
          이 값으로 정하기
        </button>
      ) : (
        <div aria-live="polite">
          <div className="mt-8">
            <ValueBar min={game.min} max={game.max} actual={[game.answer]} guess={value} format={format} />
          </div>
          <Result>{value === game.answer ? `통! ${format(game.answer)}, 맞았어요.` : `정답은 ${eyo(format(game.answer))}.`}</Result>
          <Legend rows={[["실제", format(game.answer)], ["내 예상", format(value)]]} />
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

/** 네/아니요. */
export function YesNo({ game, onDone, onReveal }: GameProps<"yes_no">) {
  const [picked, setPicked] = useState<boolean | null>(null);
  const label = (value: boolean) => (value ? "네" : "아니요");

  return (
    <div>
      <Question text={game.question} />
      <div className="mt-6 grid grid-cols-2 gap-2">
        {[true, false].map((option) => (
          <button
            key={String(option)}
            type="button"
            disabled={picked !== null}
            aria-pressed={picked === option}
            onClick={() => {
              setPicked(option);
              onReveal(option === game.answer);
            }}
            className={`text-center ${picked === null ? pill(false) : revealed(option === game.answer, option === picked)}`}
          >
            {label(option)}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div aria-live="polite">
          <Result>{picked === game.answer ? "통! 맞았어요." : `정답은 '${label(game.answer)}'예요.`}</Result>
          <p className="mt-3 text-[16px] text-graphite">{game.note}</p>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

/** 순서 맞히기. ↑/↓ 버튼으로 옮긴다. */
export function Sort({ game, onDone, onReveal }: GameProps<"sort">) {
  const [order, setOrder] = useState(() => game.items.map((i) => i.id));
  const [locked, setLocked] = useState(false);
  const item = (id: string) => game.items.find((i) => i.id === id)!;

  const move = (index: number, delta: -1 | 1) =>
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });

  const hits = order.filter((id, i) => game.answerOrder[i] === id).length;
  const arrow = "size-10 shrink-0 rounded-full border border-stone text-[16px] hover:border-graphite disabled:opacity-30";

  return (
    <div>
      <Question text={game.question} />
      {!locked ? (
        <>
          <ol className="mt-6 flex flex-col gap-2">
            {order.map((id, index) => (
              <li key={id} className="flex items-center gap-3 rounded-pill border border-stone py-2 pr-2 pl-5">
                <span className="font-mono text-[13px] text-smoke tabular">{index + 1}</span>
                <span className="min-w-0 flex-1 text-[16px]">{item(id).label}</span>
                <button type="button" aria-label={`${item(id).label} 위로`} disabled={index === 0} onClick={() => move(index, -1)} className={arrow}>
                  ↑
                </button>
                <button type="button" aria-label={`${item(id).label} 아래로`} disabled={index === order.length - 1} onClick={() => move(index, 1)} className={arrow}>
                  ↓
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => {
              setLocked(true);
              onReveal(order.every((id, i) => game.answerOrder[i] === id));
            }} className={primaryAction}>
            이 순서로 정하기
          </button>
        </>
      ) : (
        <div aria-live="polite">
          <ol className="stagger mt-6 flex flex-col">
            {game.answerOrder.map((id, index) => {
              const mine = order.indexOf(id);
              return (
                <li key={id} className="flex items-baseline gap-3 border-t border-stone py-3">
                  <span className="font-mono text-[13px] text-smoke tabular">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    {item(id).label}
                    <span className="mt-0.5 block text-[13px] text-smoke">{mine === index ? "내 순서와 같아요" : `내 순서 ${mine + 1}번째`}</span>
                  </span>
                  <span className="tong-pop shrink-0 text-right text-[15px]">{item(id).value}</span>
                </li>
              );
            })}
          </ol>
          <Result>{hits === order.length ? "통! 순서가 모두 맞았어요." : `${order.length}개 가운데 ${hits}개 자리가 맞았어요.`}</Result>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

/** 예전과 지금 중 고르기. 고르면 두 칸의 실제 내용이 열린다. */
export function BeforeAfter({ game, onDone, onReveal }: GameProps<"before_after">) {
  const [picked, setPicked] = useState<"before" | "after" | null>(null);
  const sides = [
    ["before", game.before],
    ["after", game.after],
  ] as const;

  return (
    <div>
      <Question text={game.question} />
      <div className="mt-6 grid grid-cols-2 gap-2">
        {sides.map(([key, period]) => {
          const isAnswer = key === game.answer;
          const reveal = picked !== null;
          const tone = !reveal ? "border-stone hover:border-graphite" : isAnswer ? "tong-pop border-ink bg-ink text-eggshell" : "border-stone text-graphite";
          return (
            <button
              key={key}
              type="button"
              disabled={reveal}
              aria-pressed={picked === key}
              onClick={() => {
                setPicked(key);
                onReveal(key === game.answer);
              }}
              className={`flex min-h-28 flex-col items-start gap-2 rounded-card border p-4 text-left ${tone}`}
            >
              <span className={`text-[18px] ${reveal && picked === key && !isAnswer ? "line-through" : ""}`}>{period.label}</span>
              {reveal && <span className="text-[14px] leading-snug">{period.detail}</span>}
              {reveal && picked === key && <span className="mt-auto text-[12px] opacity-70">내 선택</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div aria-live="polite">
          <Result>{picked === game.answer ? "통! 맞았어요." : `정답은 ${eyo(`'${(game.answer === "before" ? game.before : game.after).label}'`)}.`}</Result>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

/** 총액 나눠 보기. 공개는 정답이 아니라 실제 구성이다. */
export function Budget({ game, onDone, onReveal }: GameProps<"budget">) {
  const [alloc, setAlloc] = useState<Record<string, number>>(() => Object.fromEntries(game.items.map((i) => [i.id, 0])));
  const [locked, setLocked] = useState(false);
  const used = Object.values(alloc).reduce((s, v) => s + v, 0);
  const left = game.total - used;

  return (
    <div>
      <Question text={game.question} premise={game.premise} />
      {!locked ? (
        <>
          <p className="mt-6 text-[14px] text-graphite">
            남은 금액 <span className="font-mono text-ink tabular">{formatManwon(left)}</span> / {formatManwon(game.total)}
          </p>
          <ul className="mt-4 flex flex-col gap-5">
            {game.items.map((item) => (
              <li key={item.id}>
                <p className="text-[16px]">{item.label}</p>
                <div className="mt-2">
                  <Stepper
                    label={item.label}
                    value={alloc[item.id]}
                    onChange={(value) => setAlloc((prev) => ({ ...prev, [item.id]: value }))}
                    min={0}
                    max={alloc[item.id] + left}
                    step={game.step}
                    format={formatManwon}
                  />
                </div>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => {
              setLocked(true);
              onReveal(null);
            }} disabled={left !== 0} className={primaryAction}>
            {left === 0 ? "이렇게 나누기" : `${formatManwon(left)}을 더 나눠 주세요`}
          </button>
        </>
      ) : (
        <div aria-live="polite">
          <Result>실제로는 이렇게 나뉘어요.</Result>
          <ul className="stagger mt-4 flex flex-col gap-4">
            {game.items.map((item) => (
              <li key={item.id} className="border-t border-stone pt-3">
                <p className="flex items-baseline justify-between gap-4">
                  <span>{item.label}</span>
                  <span className="font-mono tabular">{formatManwon(item.actual)}</span>
                </p>
                <div className="mt-1">
                  <ValueBar min={0} max={game.total} actual={[item.actual]} guess={alloc[item.id]} showRange={false} />
                </div>
                <p className="flex items-center gap-2 text-[13px] text-smoke">
                  <GuessRing /> 내 예상 <span className="font-mono tabular">{formatManwon(alloc[item.id])}</span>
                </p>
              </li>
            ))}
          </ul>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

function Legend({ rows }: { rows: [label: "실제" | "내 예상", value: string][] }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {rows.map(([label, value]) => (
        <li key={label} className={`flex items-baseline justify-between border-t border-stone pt-3 ${label === "내 예상" ? "text-smoke" : ""}`}>
          <span className="flex items-center gap-2">
            {label === "실제" ? <ActualDot /> : <GuessRing />}
            {label}
          </span>
          <span className="font-mono tabular">{value}</span>
        </li>
      ))}
    </ul>
  );
}
