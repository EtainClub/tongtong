import Link from "next/link";

import { PLAN_ENTRY_OPEN } from "@/content/paths";
import { POLICIES } from "@/content/policies";
import type { Audience, Card } from "@/content/schema";
import { APPLICATION_LABELS, formatShortDate } from "@/features/labels";
import { PASS_COOLDOWN_DAYS } from "@/lib/feed";
import { currentApplication, endOf, startOf } from "@/lib/policy-state";
import type { CardState } from "@/lib/user-state";

/**
 * 피드를 다 넘긴 뒤 (카드가 적을 때 자주 온다).
 *
 * "다 봤어요"에서 끝내지 않고 지금 할 수 있는 것을 보여 준다 — 청사진, 따져봤거나 저장한 정책의 다가오는 신청 일정,
 * 넘긴 카드 다시 보기, 카드가 없는 정책 항목, 저장한 카드·판단 이력. 새 카드가 언제 오는지는 약속하지 않는다.
 */
export function FeedDone({ audience, cards, states, now }: { audience: Audience; cards: readonly Card[]; states: ReadonlyMap<string, CardState>; now: Date }) {
  // 카드가 없는 공개 항목 — 피드에는 넣지 않지만(청사진 설계 2.4) 여기서는 갈 곳이 된다.
  const policies = POLICIES.filter((policy) => policy.audience.includes(audience) && !cards.some((card) => card.id === policy.id));

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
      <p className="text-[22px] leading-snug font-bold tracking-tight">지금 있는 카드를 모두 살펴봤어요.</p>
      <p className="mt-2 text-graphite">
        카드 <span className="font-mono tabular">{cards.length}</span>장 가운데 <span className="font-mono tabular">{completed}</span>장을 따져봤어요. 새 카드는 준비하고 있어요 — 올라오면 이 화면에 바로 나타나요.
      </p>

      {/* 청사진 진입점과 같은 조건 (청사진 설계 7.1) — 공개 견본이 있고 청년일 때. */}
      {PLAN_ENTRY_OPEN && audience === "young_adult" && (
        <Link href="/plan" className="mt-8 block rounded-card border border-ink p-5">
          <span className="block text-[17px]">내 청사진 만들기 →</span>
          <span className="mt-1 block text-[14px] text-graphite">박사 진학·창업 같은 목표를 정하면, 언제 어떤 정책을 쓸지 시간축에 놓아 볼 수 있어요.</span>
        </Link>
      )}
      {/* 지자체 청년 정책 — 온통청년 공식 데이터 (docs/regional-benefits-review.md). 청년만. */}
      {audience === "young_adult" && (
        <Link href="/regional" className="mt-3 block rounded-card border border-stone p-5 hover:border-graphite">
          <span className="block text-[17px]">우리 지역 청년 정책 →</span>
          <span className="mt-1 block text-[14px] text-graphite">사는 지역의 시·도, 시·군·구 청년 정책을 모아 봐요. 공식 데이터를 그대로 옮긴 목록이에요.</span>
        </Link>
      )}

      {schedule.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[18px] font-bold tracking-tight">따져봤거나 저장한 정책의 신청 일정</h2>
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
          <h2 className="text-[18px] font-bold tracking-tight">넘긴 카드</h2>
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

      {policies.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[18px] font-bold tracking-tight">카드는 없지만 살펴볼 정책</h2>
          <p className="mt-1 text-[14px] text-graphite">따져보기는 없고, 원문으로 확인한 사실과 신청 정보만 정리했어요.</p>
          <ul className="mt-3 flex flex-col">
            {policies.map((policy) => (
              <li key={policy.id} className="border-t border-stone">
                <Link href={`/policy/${policy.id}`} className="block py-3 hover:underline">
                  {policy.name}
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
