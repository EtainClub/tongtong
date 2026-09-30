"use client";

import { useState } from "react";

import type { Game } from "@/content/schema";
import { ActualDot, GuessRing, Next, pill, revealed, Stepper, ValueBar, type GameProps } from "@/features/card/game-parts";
import { BeforeAfter, Budget, Slider, Sort, YesNo } from "@/features/card/games-extra";
import { eyo, formatWon } from "@/features/labels";

/*
 * 게임 (검토 문서 4.2·6장, 로드맵 M5). 결과를 보여준 뒤 onDone으로 공개 단계에 넘긴다.
 * 게임 답은 판단이 아니다 — 서버에 보내지 않는다.
 */

export function GameView({ game, onDone, onReveal }: { game: Game; onDone: () => void; onReveal: (correct: boolean | null) => void }) {
  switch (game.type) {
    case "multiple_choice":
      return <MultipleChoice game={game} onDone={onDone} onReveal={onReveal} />;
    case "guess_amount":
      return <GuessAmount game={game} onDone={onDone} onReveal={onReveal} />;
    case "eligibility":
      return <Eligibility game={game} onDone={onDone} onReveal={onReveal} />;
    case "slider":
      return <Slider game={game} onDone={onDone} onReveal={onReveal} />;
    case "yes_no":
      return <YesNo game={game} onDone={onDone} onReveal={onReveal} />;
    case "sort":
      return <Sort game={game} onDone={onDone} onReveal={onReveal} />;
    case "before_after":
      return <BeforeAfter game={game} onDone={onDone} onReveal={onReveal} />;
    case "budget":
      return <Budget game={game} onDone={onDone} onReveal={onReveal} />;
  }
}

function MultipleChoice({ game, onDone, onReveal }: GameProps<"multiple_choice">) {
  const [picked, setPicked] = useState<string | null>(null);
  const answer = game.options.find((o) => o.id === game.answerOptionId)!;

  return (
    <div>
      <p className="text-[24px] leading-tight font-light">{game.question}</p>
      <div className="mt-6 flex flex-col gap-2">
        {game.options.map((option) => {
          const isAnswer = option.id === answer.id;
          const isPicked = option.id === picked;
          return (
            <button
              key={option.id}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(option.id);
                onReveal(option.id === game.answerOptionId);
              }}
              aria-pressed={isPicked}
              className={picked === null ? pill(false) : revealed(isAnswer, isPicked)}
            >
              {option.label}
              {picked !== null && isAnswer && <span className="ml-2 text-[13px]"> 정답</span>}
              {picked !== null && isPicked && !isAnswer && <span className="ml-2 inline-block text-[13px]"> 내 선택</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div aria-live="polite">
          <p className="mt-6 text-[18px]">
            <span className="tong-pop">{picked === answer.id ? "통! 맞았어요." : `정답은 ${eyo(`"${answer.label}"`)}.`}</span>
          </p>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

function GuessAmount({ game, onDone, onReveal }: GameProps<"guess_amount">) {
  const [guess, setGuess] = useState(Math.round((game.min + game.max) / 2 / game.step) * game.step);
  const [locked, setLocked] = useState(false);

  return (
    <div>
      <p className="text-[24px] leading-tight font-light">{game.question}</p>
      <p className="mt-3 text-[14px] text-graphite">{game.premise}</p>

      <div className="mt-8">
        {/* 슬라이더를 끌지 않아도 −/+ 로 정할 수 있다. */}
        <Stepper label="예상 금액" value={guess} onChange={setGuess} min={game.min} max={game.max} step={game.step} format={formatWon} disabled={locked} />
      </div>
      <input
        type="range"
        min={game.min}
        max={game.max}
        step={game.step}
        value={guess}
        disabled={locked}
        onChange={(event) => setGuess(Number(event.target.value))}
        aria-label="예상 금액"
        aria-valuetext={formatWon(guess)}
        className="mt-4 w-full accent-ink"
      />

      {!locked ? (
        <button type="button" onClick={() => {
            setLocked(true);
            onReveal(null);
          }} className="mt-8 w-full rounded-pill bg-ink px-6 py-4 text-eggshell">
          이 금액으로 정하기
        </button>
      ) : (
        <div aria-live="polite">
          <div className="mt-8">
            <ValueBar min={game.min} max={game.max} actual={game.answers.map((a) => a.value)} guess={guess} />
          </div>
          <ul className="mt-6 flex flex-col gap-2">
            {game.answers.map((answer) => (
              <li key={answer.label} className="flex items-baseline justify-between border-t border-stone pt-3">
                <span className="flex items-center gap-2 text-graphite">
                  <ActualDot />
                  {answer.label}
                </span>
                <span className="tong-pop font-mono text-[20px] tabular">{formatWon(answer.value)}</span>
              </li>
            ))}
            <li className="flex items-baseline justify-between border-t border-stone pt-3 text-smoke">
              <span className="flex items-center gap-2">
                <GuessRing />
                내 예상
              </span>
              <span className="font-mono tabular">{formatWon(guess)}</span>
            </li>
          </ul>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}

type Outcome = "pass" | "fail" | "unknown";

const MARKS: Record<Outcome, { symbol: string; label: string }> = {
  pass: { symbol: "✓", label: "해당" },
  fail: { symbol: "✗", label: "해당 안 됨" },
  unknown: { symbol: "?", label: "확인 필요" },
};

/**
 * 한 단계씩 묻고, 해당 안 되는 답이 나오면 거기서 멈춘다.
 * 결과는 "가능성"까지만 말한다 — 최종 판정은 신청 기관이 한다 (검토 문서 3장 5번).
 */
function Eligibility({ game, onDone, onReveal }: GameProps<"eligibility">) {
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const failed = outcomes.includes("fail");
  const finished = failed || outcomes.length === game.steps.length;
  const step = game.steps[outcomes.length];

  const verdict = failed
    ? "지금 조건으로는 해당되지 않을 가능성이 높아요."
    : outcomes.includes("unknown")
      ? "가능성은 있지만, 확인이 필요한 조건이 있어요."
      : "대상일 가능성이 높아요.";

  return (
    <div>
      <p className="text-[24px] leading-tight font-light">{game.question}</p>
      <p className="mt-2 text-[14px] text-smoke">답은 이 화면에만 있고 저장하지 않아요.</p>

      <ol className="mt-6 flex flex-col gap-2">
        {game.steps.slice(0, outcomes.length).map((done, index) => (
          <li key={done.id} className="flex justify-between gap-4 border-t border-stone pt-3 text-[14px]">
            <span className="text-graphite">{done.question}</span>
            <span className="shrink-0 font-mono">
              <span aria-hidden="true">{MARKS[outcomes[index]].symbol}</span>
              <span className="sr-only">{MARKS[outcomes[index]].label}</span>
            </span>
          </li>
        ))}
      </ol>

      {!finished && step && (
        <div className="mt-6">
          {/* "조건"을 붙인다 — 숫자만 쓰면 머리의 단계 표시(03 / 06)와 헷갈린다. */}
          <p className="text-[13px] text-smoke">
            조건 <span className="font-mono tabular">{outcomes.length + 1}</span> / <span className="font-mono tabular">{game.steps.length}</span>
          </p>
          <p className="mt-2 text-[18px]">{step.question}</p>
          {/* 엄지로 누르기 쉽게 같은 폭으로 나눈다. */}
          <div className={`mt-4 grid gap-2 ${step.answers.length <= 3 ? "grid-flow-col auto-cols-fr" : ""}`}>
            {step.answers.map((answer) => (
              <button
                key={answer.label}
                type="button"
                onClick={() => {
                  const next = [...outcomes, answer.outcome];
                  setOutcomes(next);
                  if (answer.outcome === "fail" || next.length === game.steps.length) onReveal(null);
                }}
                className="rounded-pill border border-stone bg-eggshell px-4 py-3.5 text-[16px] transition-colors duration-150 hover:border-graphite"
              >
                {answer.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div aria-live="polite">
          <p className="mt-8 text-[20px]">
            <span className="tong-pop">{verdict}</span>
          </p>
          <p className="mt-2 text-[14px] text-graphite">최종 대상 여부는 신청 기관의 심사로 정해집니다.</p>
          <Next onClick={onDone} />
        </div>
      )}
    </div>
  );
}
