"use client";

import { useState, ViewTransition } from "react";

import type { Card } from "@/content/schema";

/**
 * 숏츠 — 대본에서 그리는 글자 씬 (검토 문서 5.3), 영상이 있으면 영상 (로드맵 M9-3).
 *
 * 대본이 카드 데이터에 있으므로 정책이 바뀌면 다음 빌드에서 글자 씬도 바뀐다. 영상은 바뀌지 않으니 글자 씬을 늘 남긴다.
 * 자동으로 넘기지 않는다 — 멈출 수 없는 자동 재생은 접근성 실패다(잼통 모션 규칙).
 */
export function Shorts({
  hook,
  lines,
  video,
  onDone,
  morphName,
}: {
  hook: string;
  lines: string[];
  video?: Card["video"];
  onDone: () => void;
  morphName: string;
}) {
  const [mode, setMode] = useState<"video" | "text">(video ? "video" : "text");

  return (
    <section aria-label="15초 요약">
      {/* 피드 카드의 훅이 여기로 옮겨 온다 (features/feed/SwipeDeck). */}
      <ViewTransition name={morphName} share="morph" default="none">
        <p className="text-[30px] leading-[1.2] font-bold tracking-tight">{hook}</p>
      </ViewTransition>

      {video && mode === "video" ? (
        <VideoScene youtubeId={video.youtubeId} hook={hook} onDone={onDone} onText={() => setMode("text")} />
      ) : (
        <TextScenes lines={lines} onDone={onDone} onVideo={video ? () => setMode("video") : undefined} />
      )}
    </section>
  );
}

/**
 * 누르기 전에는 YouTube에 아무것도 요청하지 않는다(썸네일도) — 개인정보처리방침 "카드 영상".
 * 누른 뒤에만 youtube-nocookie 플레이어를 넣고 재생한다. 자막은 켜 둔다.
 */
function VideoScene({ youtubeId, hook, onDone, onText }: { youtubeId: string; hook: string; onDone: () => void; onText: () => void }) {
  const [playing, setPlaying] = useState(false);
  const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&playsinline=1&cc_load_policy=1&rel=0`;

  return (
    <>
      <div className="mx-auto mt-8 aspect-[9/16] w-full max-w-[min(300px,calc((100dvh-24rem)*9/16))] min-w-[200px] overflow-hidden rounded-card bg-ink">
        {playing ? (
          <iframe
            src={src}
            title={`${hook} — 숏츠 영상`}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-eggshell"
          >
            <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-eggshell text-ink">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
            <span className="text-[17px] font-bold">영상 보기</span>
            <span className="text-[13px] leading-[1.5] text-eggshell/70">누르면 YouTube에 연결돼요</span>
          </button>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <button type="button" onClick={onDone} className="w-full rounded-pill bg-ink px-6 py-4 text-eggshell">
          계속하기
        </button>
        <button type="button" onClick={onText} className="text-[14px] text-graphite underline-offset-4 hover:underline">
          글자로 보기
        </button>
      </div>
    </>
  );
}

/** 한 번 누를 때마다 한 줄씩. 전부 보여 주는 버튼도 둔다. */
function TextScenes({ lines, onDone, onVideo }: { lines: string[]; onDone: () => void; onVideo?: () => void }) {
  const [shown, setShown] = useState(1);
  const finished = shown >= lines.length;

  return (
    <>
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
        {onVideo && (
          <button type="button" onClick={onVideo} className="text-[14px] text-graphite underline-offset-4 hover:underline">
            영상으로 보기
          </button>
        )}
      </div>
    </>
  );
}
