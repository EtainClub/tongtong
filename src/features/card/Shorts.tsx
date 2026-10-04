"use client";

import { useState, ViewTransition } from "react";

/**
 * 숏츠 — 영상 파일이 아니라 대본에서 그리는 글자 씬 (검토 문서 5.3).
 *
 * 대본이 카드 데이터에 있으므로 정책이 바뀌면 다음 빌드에서 숏츠도 바뀐다.
 * 자동으로 넘기지 않는다 — 멈출 수 없는 자동 재생은 접근성 실패다(잼통 모션 규칙).
 * 한 번 누를 때마다 한 줄씩. 전부 보여 주는 버튼도 둔다.
 */
export function Shorts({ hook, lines, onDone, morphName }: { hook: string; lines: string[]; onDone: () => void; morphName: string }) {
  const [shown, setShown] = useState(1);
  const finished = shown >= lines.length;

  return (
    <section aria-label="15초 요약">
      {/* 피드 카드의 훅이 여기로 옮겨 온다 (features/feed/SwipeDeck). */}
      <ViewTransition name={morphName} share="morph" default="none">
        <p className="text-[30px] leading-[1.2] font-bold tracking-tight">{hook}</p>
      </ViewTransition>

      {/* 씬 진행은 막대로 보여 준다. 숫자로 쓰면 머리의 단계 표시(01 / 06)와 헷갈린다. */}
      <div className="mt-8 flex gap-1" role="progressbar" aria-label="요약 진행" aria-valuemin={1} aria-valuemax={lines.length} aria-valuenow={shown}>
        {lines.map((_, index) => (
          <span key={index} className={`h-1 flex-1 rounded-pill ${index < shown ? "bg-ink" : "bg-stone"}`} />
        ))}
      </div>

      <ol className="mt-8 flex flex-col gap-3" aria-live="polite">
        {lines.slice(0, shown).map((line, index) => (
          <li
            key={index}
            className={`text-[20px] leading-[1.35] ${index === shown - 1 ? "shorts-line text-ink" : "text-smoke"}`}
          >
            {line}
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-col gap-2">
        {finished ? (
          <button type="button" onClick={onDone} className="w-full rounded-pill bg-ink px-6 py-4 text-eggshell">
            계속하기
          </button>
        ) : (
          <>
            <button type="button" onClick={() => setShown(shown + 1)} className="w-full rounded-pill bg-ink px-6 py-4 text-eggshell">
              다음
            </button>
            <button type="button" onClick={() => setShown(lines.length)} className="text-[14px] text-graphite underline-offset-4 hover:underline">
              한 번에 보기
            </button>
          </>
        )}
      </div>
    </section>
  );
}
