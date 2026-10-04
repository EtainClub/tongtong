"use client";

import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition, type PointerEvent } from "react";

import type { Card } from "@/content/schema";
import { APPLICATION_LABELS, CATEGORY_LABELS } from "@/features/labels";
import { estimateSeconds, formatEstimate } from "@/lib/estimate";
import { currentApplication } from "@/lib/policy-state";

/*
 * 카드 더미와 스와이프 (설계 20·22·23·58장, 로드맵 4.1).
 *
 * 스와이프는 버튼의 지름길이다 — ← 패스(관심 없음), → 보기, ↑ 보류(나중에 볼 카드로 저장).
 * 위로 끌기가 페이지 스크롤과 부딪치지 않도록 카드 위에서만 터치 스크롤을 끈다(touch-action: none).
 * 아래로 끌면 아무 일도 없다. 카드 밖(머리·버튼 줄)은 그대로 스크롤된다.
 * 스크린 리더와 키보드는 아래 버튼을 쓴다 — 버튼·키보드도 command로 같은 장면을 탄다.
 *
 * 모션 (잼통 모션 규칙 — 끄는 동안에는 전환을 끈다, 곡선 하나, reduced-motion이면 최종 상태만):
 *   ← 패스   "패스" 도장이 찍히고 카드가 왼쪽으로 날아간다
 *   ↑ 보류   "보류" 도장이 찍히고 카드가 위로 빠지며 작아진다
 *   → 보기   카드가 제자리로 돌아와 두 번 튄다 — "통통!" (420ms). 그다음 훅 문장이 카드 화면의
 *            훅으로 옮겨 간다 (ViewTransition, globals.css .morph).
 *   다음 카드 뒤에 비치던 카드가 앞자리로 올라온다 (320ms).
 */

export type SwipeDirection = "left" | "right" | "up";
/** 버튼·키보드가 보내는 명령. n이 바뀔 때마다 한 번 실행한다. */
export type SwipeCommand = { direction: SwipeDirection; n: number };

/** 폭(가로)·높이(위)의 이만큼 끌거나, 이보다 빠르게 튕기면 확정한다. */
const COMMIT_RATIO_X = 0.3;
const COMMIT_RATIO_Y = 0.2;
const COMMIT_VELOCITY = 0.5; // px/ms
/** 가로·세로를 가르기 전에 기다리는 거리. */
const AXIS_SLOP = 8;
const MAX_TILT_DEG = 6;
const EXIT_MS = 250;
/** 패스·보류 도장을 읽을 틈. 도장이 먼저 찍히고 카드가 떠난다. */
const STAMP_HOLD_MS = 120;
/** "통통" 두 번 튀는 시간. globals.css의 .tongtong과 맞춘다. */
const TONGTONG_MS = 420;

const STAMPS: Record<SwipeDirection, { label: string; filled: boolean }> = {
  left: { label: "패스", filled: false },
  up: { label: "보류", filled: false },
  right: { label: "통통!", filled: true },
};

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Drag = { id: number; x: number; y: number; t: number; axis: "x" | "y" | "ignore" | null };

export function SwipeDeck({
  card,
  next,
  now,
  disabled = false,
  command,
  onSwipe,
}: {
  card: Card;
  next: Card | undefined;
  now: Date;
  disabled?: boolean;
  command: SwipeCommand | null;
  onSwipe: (direction: SwipeDirection) => void;
}) {
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exit, setExit] = useState<SwipeDirection | null>(null);
  const [size, setSize] = useState({ width: 360, height: 560 });
  const drag = useRef<Drag | null>(null);
  /** 이번 누름에서 카드를 끌었는가. 끌었으면 손을 뗄 때의 클릭을 버린다. */
  const moved = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  /** 이 카드가 처음 그려질 때 받은 명령은 이미 지난 것이다 — 그 뒤에 온 것만 실행한다. */
  const seen = useRef(command?.n ?? 0);

  const measure = (element: HTMLElement) => setSize({ width: element.offsetWidth, height: element.offsetHeight });

  function commit(direction: SwipeDirection) {
    if (exit) return;
    setExit(direction);
    setDragging(false);
    // 모션을 끈 사용자는 도장·날아가는 장면 없이 바로 넘어간다.
    const delay = prefersReducedMotion() ? 0 : direction === "right" ? TONGTONG_MS : STAMP_HOLD_MS + EXIT_MS;
    window.setTimeout(() => onSwipe(direction), delay);
  }

  useEffect(() => {
    if (!command || command.n === seen.current) return;
    seen.current = command.n;
    if (disabled || exit) return;
    if (root.current) measure(root.current);
    commit(command.direction);
    // commit은 매 렌더 새로 만들어지지만 명령 번호가 바뀔 때만 실행하면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (disabled || exit || event.button !== 0) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, t: event.timeStamp, axis: null };
    moved.current = false;
    measure(event.currentTarget);
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d || d.id !== event.pointerId || d.axis === "ignore") return;
    const moveX = event.clientX - d.x;
    const moveY = event.clientY - d.y;
    if (!d.axis) {
      if (Math.abs(moveX) < AXIS_SLOP && Math.abs(moveY) < AXIS_SLOP) return;
      // 가로면 패스/보기, 위면 보류. 아래로 끄는 것은 쓰지 않는다.
      d.axis = Math.abs(moveX) > Math.abs(moveY) ? "x" : moveY < 0 ? "y" : "ignore";
      if (d.axis === "ignore") return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      moved.current = true;
    }
    if (d.axis === "x") setDx(moveX);
    if (d.axis === "y") setDy(Math.min(0, moveY));
  }

  function onPointerEnd(event: PointerEvent<HTMLElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d || (d.axis !== "x" && d.axis !== "y")) return;
    const elapsed = Math.max(1, event.timeStamp - d.t);
    const released = event.type === "pointerup";
    if (d.axis === "x") {
      const moveX = event.clientX - d.x;
      const far = Math.abs(moveX) > size.width * COMMIT_RATIO_X;
      const fast = Math.abs(moveX / elapsed) > COMMIT_VELOCITY && Math.abs(moveX) > AXIS_SLOP * 3;
      if (released && (far || fast)) return commit(moveX < 0 ? "left" : "right");
    } else {
      const lift = -(event.clientY - d.y);
      const far = lift > size.height * COMMIT_RATIO_Y;
      const fast = lift / elapsed > COMMIT_VELOCITY && lift > AXIS_SLOP * 3;
      if (released && (far || fast)) return commit("up");
    }
    setDragging(false);
    setDx(0);
    setDy(0);
  }

  // 오른쪽은 날려 보내지 않고 제자리로 돌려 튀게 한다 — 카드가 "열리는" 느낌.
  const offsetX = exit === "left" ? -1.2 * size.width : exit ? 0 : dx;
  const offsetY = exit === "up" ? -1.1 * size.height : exit ? 0 : dy;
  const progressX = Math.min(1, Math.abs(offsetX) / (size.width * COMMIT_RATIO_X));
  const progressY = Math.min(1, Math.abs(offsetY) / (size.height * COMMIT_RATIO_Y));
  const progress = exit === "right" ? 0 : Math.max(progressX, progressY);
  const tilt = Math.max(-MAX_TILT_DEG, Math.min(MAX_TILT_DEG, (offsetX / size.width) * MAX_TILT_DEG * 2));
  const shrink = exit === "up" ? 0.92 : 1;
  const leaving = exit === "left" || exit === "up";
  const motion = dragging
    ? "none"
    : `transform ${EXIT_MS}ms var(--ease-out-expo) ${leaving ? STAMP_HOLD_MS : 0}ms, opacity ${EXIT_MS}ms ease-out ${leaving ? STAMP_HOLD_MS : 0}ms`;

  return (
    <div ref={root} className="mt-4 grid flex-1 pb-3">
      {/* 다음 카드가 아래 가장자리로 비친다. 앞 카드를 끌수록 제자리로 올라온다. */}
      {next && (
        <div
          // inert — 뒤 카드 안의 링크에 포커스·클릭이 가지 않게. aria-hidden만으로는 포커스가 남는다.
          inert
          className="pointer-events-none origin-bottom [grid-area:1/1]"
          style={{ transform: `translateY(${12 * (1 - progress)}px) scale(${0.94 + 0.06 * progress})`, transition: motion }}
        >
          <div key={next.id} className="deck-behind h-full">
            <HookCard card={next} now={now} morph={false} />
          </div>
        </div>
      )}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // 끈 뒤에 손을 떼면 그 자리의 링크(주제)가 눌린 것으로 치지 않는다.
        onClickCapture={(event) => {
          if (!moved.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        className="relative touch-none select-none [grid-area:1/1]"
        style={{
          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${tilt}deg) scale(${shrink})`,
          opacity: exit === "up" ? 0 : 1,
          transition: motion,
        }}
      >
        {/* 끄는 층(위)과 튀는 층(여기)을 나눈다 — 한 요소에 transform 두 개를 걸면 서로 덮는다. */}
        <div className={`h-full ${exit === "right" ? "tongtong" : "deck-enter"}`}>
          <HookCard card={card} now={now} morph />
        </div>
        {/* 끄는 방향의 행동 이름. 색 없이 — 판단이 아니라 조작이다. */}
        {!exit && (
          <>
            <SwipeHint position="right-6 top-6" label="패스" opacity={dx < 0 ? progressX : 0} />
            <SwipeHint position="left-6 top-6" label="보기" opacity={dx > 0 ? progressX : 0} />
            <SwipeHint position="bottom-6 left-1/2 -translate-x-1/2" label="보류" opacity={progressY} />
          </>
        )}
        {exit && <Stamp {...STAMPS[exit]} />}
      </div>
    </div>
  );
}

/** 넘기는 순간 카드 가운데 찍히는 도장. 보기만 채운 ink — 패스·보류는 테두리만. */
function Stamp({ label, filled }: { label: string; filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`tong-stamp pointer-events-none absolute top-1/2 left-1/2 rounded-pill border-2 border-ink px-7 py-3 text-[30px] font-bold tracking-tight ${filled ? "bg-ink text-eggshell" : "bg-eggshell text-ink"}`}
    >
      {label}
    </span>
  );
}

function SwipeHint({ position, label, opacity }: { position: string; label: string; opacity: number }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute rounded-pill border border-ink bg-eggshell px-4 py-1.5 text-[14px] font-semibold text-ink ${position}`} style={{ opacity }}>
      {label}
    </span>
  );
}

/**
 * 피드의 Hook 카드 한 장. 주제·예상 시간, 훅, 숏츠 첫 줄, 신청 상태 (로드맵 4.1).
 * morph — 훅 문장이 카드 화면의 훅으로 옮겨 간다. 같은 이름은 한 화면에 하나만 있어야 해서 뒤 카드는 끈다.
 */
export function HookCard({ card, now, morph }: { card: Card; now: Date; morph: boolean }) {
  const application = currentApplication(card.policy.applications, now);
  const hook = <p className="mt-5 text-[30px] leading-[1.2] font-bold tracking-tight">{card.hook}</p>;
  return (
    // 잼통 홈의 대표 카드처럼 어두운 판에 밝은 글자. 사진 대신 무채색 그러데이션 — 색은 데이터에만 (디자인 시스템).
    <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-card-lg bg-ink bg-[radial-gradient(120%_70%_at_100%_0%,#3b3631_0%,transparent_60%),radial-gradient(90%_60%_at_0%_100%,#2a2723_0%,transparent_70%)] p-7 text-eggshell shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)]">
      <div>
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <Link href={`/topics/${card.category}`} className="rounded-[6px] bg-eggshell/15 px-2 py-0.5 font-semibold text-eggshell hover:bg-eggshell/25">
            {CATEGORY_LABELS[card.category]}
          </Link>
          <span className="rounded-[6px] bg-eggshell px-2 py-0.5 font-semibold text-ink">{card.shortTitle}</span>
          <span className="ml-auto text-ash">{formatEstimate(estimateSeconds(card))}</span>
        </div>
        {morph ? (
          <ViewTransition name={hookTransitionName(card.id)} share="morph" default="none">
            {hook}
          </ViewTransition>
        ) : (
          hook
        )}
        {/* 들어갈 이유 한 줄. 숏츠의 첫 줄을 흐리게 미리 보여 준다. */}
        <p className="mt-4 text-[16px] leading-[1.5] text-eggshell/70">{/[.?!…]$/.test(card.shorts[0]) ? card.shorts[0] : `${card.shorts[0]}…`}</p>
      </div>
      {/* 빈 가운데를 채우는 큰 주제 글자 — 꾸밈이라 읽지 않는다. */}
      <span aria-hidden="true" className="pointer-events-none absolute right-6 bottom-16 text-[96px] leading-none font-black tracking-tighter text-eggshell/[0.06] select-none">
        {CATEGORY_LABELS[card.category]}
      </span>
      {application && (
        <p
          className={`relative mt-8 self-start rounded-pill px-3 py-1.5 text-[13px] font-medium ${application.state === "open" ? "bg-eggshell text-ink" : "border border-eggshell/30 text-eggshell/85"}`}
        >
          {application.app.label} {APPLICATION_LABELS[application.state]}
        </p>
      )}
    </article>
  );
}

/** 피드 카드 훅 ↔ 카드 화면 숏츠 훅이 같은 이름을 쓴다. */
export const hookTransitionName = (cardId: string) => `hook-${cardId}`;
