"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CARDS } from "@/content/cards";
import { SwipeDeck, type SwipeCommand, type SwipeDirection } from "@/features/feed/SwipeDeck";
import { revisitLabel } from "@/features/labels";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { Notice } from "@/features/ui/Notice";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";
import { useUserData } from "@/lib/firebase/user-data";
import { orderFeed } from "@/lib/feed";
import { revisitReason, type RevisitReason } from "@/lib/revisit";

/**
 * 피드 — 카드 더미 (설계 58장, 로드맵 4.1).
 *
 * 버튼이 기본이다. 드래그로만 되는 조작을 만들지 않는다(잼통 접근성 규칙).
 * 스와이프와 키보드 ←(패스) ↑(보류) →(보기)는 버튼의 지름길이다.
 * "관심 없음"은 의견이 아니다 — 30일 쉬게 할 뿐이다.
 */
export function Feed() {
  const router = useRouter();
  const { user, error: authError } = useAuth();
  const data = useUserData();
  const [now] = useState(() => new Date());
  /** 넘긴 카드와 "나중에"로 저장한 카드. 서버 기록이 돌아오기 전에도, 그리고 이번 방문 동안 보이지 않게 한다. */
  const [hidden, setHidden] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const queue = useMemo(
    () => (data.profile ? orderFeed(CARDS, data.profile, data.states, now).filter((c) => !hidden.includes(c.id)) : []),
    [data.profile, data.states, now, hidden],
  );
  const card = queue[0];
  const revisits = useMemo(
    () =>
      CARDS.map((c) => ({ card: c, reason: revisitReason(c, data.states.get(c.id), now) })).filter(
        (entry): entry is { card: (typeof CARDS)[number]; reason: RevisitReason } => entry.reason !== null,
      ),
    [data.states, now],
  );

  /**
   * 서버 응답을 기다리지 않고 바로 다음 카드로 넘어간다. 실패하면 되돌린다.
   * 잠그지 않는다 — 빠르게 연달아 넘겨도 카드마다 따로 기록된다.
   */
  async function act(action: "pass" | "save") {
    if (!user || !card) return;
    const cardId = card.id;
    setHidden((prev) => [...prev, cardId]);
    setError(null);
    try {
      await apiFetch(user, "/api/card-state", { method: "POST", body: { cardId, action } });
    } catch (caught) {
      setHidden((prev) => prev.filter((id) => id !== cardId));
      setError(describeError(caught, "기록하지 못했어요. 다시 시도해 주세요."));
    }
  }

  const open = (cardId: string) => router.push(`/card/${cardId}`);

  /** 버튼·키보드도 스와이프와 같은 장면을 타도록 카드 더미에 명령을 보낸다. */
  const [command, setCommand] = useState<SwipeCommand | null>(null);
  const send = (direction: SwipeDirection) => setCommand((prev) => ({ direction, n: (prev?.n ?? 0) + 1 }));

  // 다음 두 장을 미리 불러온다 (설계 45장). 카드 페이지는 정적이라 데이터 부담이 작다.
  const upcoming = queue.slice(0, 3).map((c) => c.id).join(",");
  useEffect(() => {
    for (const id of upcoming.split(",").filter(Boolean)) router.prefetch(`/card/${id}`);
  }, [router, upcoming]);

  useEffect(() => {
    if (!card) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "ArrowLeft") send("left");
      if (event.key === "ArrowRight") send("right");
      if (event.key === "ArrowUp") {
        event.preventDefault();
        send("up");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (authError) return <Notice>익명 로그인에 실패했어요. 새로고침해 주세요.</Notice>;
  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;
  if (!data.profile) return <Onboarding />;

  const hasPassed = [...data.states.values()].some((state) => state.passedAt);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-6 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-[20px] font-light tracking-[-0.02em]">통통</h1>
        <Link href="/me" className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
          내 기록
        </Link>
      </header>

      {revisits.length > 0 && (
        <section aria-labelledby="revisit-title" className="mt-6">
          <h2 id="revisit-title" className="text-[14px] text-graphite">
            다시 볼 카드
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {revisits.map(({ card: c, reason }) => (
              <li key={c.id}>
                <Link href={`/card/${c.id}`} className="inline-flex items-center gap-2 rounded-pill border border-ink px-4 py-2 text-[14px]">
                  {c.shortTitle}
                  <span className="rounded-pill bg-pending-tint px-2 py-0.5 text-[11px] text-pending">{revisitLabel(reason)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {card ? (
        <>
          <SwipeDeck
            key={card.id}
            card={card}
            next={queue[1]}
            now={now}
            command={command}
            onSwipe={(direction) => (direction === "left" ? act("pass") : direction === "up" ? act("save") : open(card.id))}
          />

          <div className="mt-6 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => send("left")} className="rounded-pill border border-stone px-3 py-4">
              패스
            </button>
            <button type="button" onClick={() => send("up")} className="rounded-pill border border-stone px-3 py-4">
              보류
            </button>
            <Link
              href={`/card/${card.id}`}
              // 새 탭(⌘·Ctrl 클릭)은 그대로 두고, 그냥 누르면 스와이프와 같은 "통통" 장면을 탄다.
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                send("right");
              }}
              className="rounded-pill bg-ink px-3 py-4 text-center text-eggshell"
            >
              보기
            </Link>
          </div>
          <p className="mt-3 text-center text-[13px] text-smoke">
            {/* 처음 몇 장은 조작과 의미를 알려 준다. 한 번이라도 넘겨 본 뒤에는 남은 카드 수만. */}
            {hasPassed ? (
              <>
                남은 카드 <span className="font-mono tabular">{queue.length}</span>
              </>
            ) : (
              "← 패스 · ↑ 보류 · → 보기로 넘겨도 돼요. 패스는 어떤 집계에도 들어가지 않고, 보류한 카드는 저장한 카드에 모여요."
            )}
          </p>
        </>
      ) : (
        <section className="mt-24 text-center">
          <p className="text-[24px] font-light">지금 볼 카드를 다 봤어요.</p>
          <p className="mt-3 text-graphite">새 카드가 올라오면 여기에 나타나요.</p>
        </section>
      )}

      {error && (
        <p role="alert" className="toast-enter mt-4 rounded-sm border border-ink px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
    </main>
  );
}
