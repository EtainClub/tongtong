import Link from "next/link";

import type { Card } from "@/content/schema";
import { APPLICATION_LABELS, formatShortDate } from "@/features/labels";
import { PASS_COOLDOWN_DAYS } from "@/lib/feed";
import { currentApplication, endOf, startOf } from "@/lib/policy-state";
import type { CardState } from "@/lib/user-state";

/**
 * 피드를 다 넘긴 뒤 (카드가 적을 때 자주 온다).
 *
 * "다 봤어요"에서 끝내지 않고 지금 할 수 있는 것을 보여 준다 — 따져봤거나 저장한 정책의 다가오는 신청 일정,
 * 넘긴 카드 다시 보기, 저장한 카드·판단 이력. 새 카드가 언제 오는지는 약속하지 않는다.
 */
export function FeedDone({ cards, states, now }: { cards: readonly Card[]; states: ReadonlyMap<string, CardState>; now: Date }) {
  // 따져봤거나 저장한 정책 가운데 아직 신청이 끝나지 않은 회차 — 다시 올 이유가 된다.
  const schedule = cards
    .filter((card) => {
      const state = states.get(card.id);
      return state?.completedAt || state?.saved;
    })
    .map((card) => ({ card, current: currentApplication(card.policy.applications, now) }))
    .filter((entry): entry is { card: Card; current: NonNullable<typeof entry.current> } => entry.current !== null && entry.current.state !== "closed")
    .sort((a, b) => startOf(a.current.app.startAt) - startOf(b.current.app.startAt));

  const passed = cards.filter((card) => {
    const state = states.get(card.id);
    return state?.passedAt && !state.completedAt;
  });
  const saved = cards.filter((card) => states.get(card.id)?.saved).length;
  const completed = cards.filter((card) => states.get(card.id)?.completedAt).length;

  return (
    <section className="mt-12">
      <p className="text-[24px] leading-tight font-light">지금 있는 카드를 모두 살펴봤어요.</p>
      <p className="mt-2 text-graphite">
        카드 <span className="font-mono tabular">{cards.length}</span>장 가운데 <span className="font-mono tabular">{completed}</span>장을 따져봤어요. 새 카드는 준비하고 있어요 — 올라오면 이 화면에 바로 나타나요.
      </p>

      {schedule.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[18px] font-medium">따져봤거나 저장한 정책의 신청 일정</h2>
          <ul className="mt-3 flex flex-col">
            {schedule.map(({ card, current }) => (
              <li key={card.id} className="border-t border-stone">
                <Link href={`/policy/${card.id}`} className="flex items-baseline justify-between gap-3 py-3 hover:underline">
                  <span>{card.shortTitle}</span>
                  <span className="shrink-0 text-[14px] text-graphite">
                    {APPLICATION_LABELS[current.state]} ·{" "}
                    <span className="font-mono tabular">
                      {current.state === "open" ? `${formatShortDate(endOf(current.app.endAt))}까지` : `${formatShortDate(startOf(current.app.startAt))}부터`}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[13px] text-smoke">신청 전에 공식 공고로 다시 확인하세요.</p>
        </div>
      )}

      {passed.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[18px] font-medium">넘긴 카드</h2>
          <p className="mt-1 text-[14px] text-graphite">넘긴 카드는 {PASS_COOLDOWN_DAYS}일 동안 피드에 나오지 않아요. 지금 다시 볼 수 있어요.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {passed.map((card) => (
              <li key={card.id}>
                <Link href={`/card/${card.id}`} className="inline-block rounded-pill border border-ink px-4 py-2 text-[14px]">
                  {card.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-2">
        <Link href="/saved" className="rounded-pill border border-stone px-5 py-3 text-center hover:border-graphite">
          저장한 카드 <span className="font-mono tabular">{saved}</span>
        </Link>
        <Link href="/me/history" className="rounded-pill border border-stone px-5 py-3 text-center hover:border-graphite">
          판단 이력
        </Link>
      </div>
    </section>
  );
}
