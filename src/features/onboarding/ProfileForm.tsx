"use client";

import Link from "next/link";
import { useState } from "react";

import { Category, LifeStage } from "@/content/schema";
import { CATEGORY_LABELS, LIFE_STAGE_LABELS } from "@/features/labels";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { useAuth } from "@/lib/firebase/auth";

type Stage = (typeof LifeStage.options)[number];
type Topic = (typeof Category.options)[number];

/**
 * 내 상황과 관심 주제 (설계 2·6장, 로드맵 4.8). 첫 진입과 내 기록의 "바꾸기"가 같이 쓴다.
 *
 * 두 단계를 한 화면에 쌓지 않는다 — 생활 상황 다음에 관심 주제. 관심 주제는 건너뛸 수 있다.
 * 둘 다 피드 순서에만 쓰고, 정치 성향 추정에는 쓰지 않는다.
 * 동의 값은 보내지 않는다 — 서버가 기존 값을 그대로 둔다.
 */
export function ProfileForm({
  mode,
  initial,
  onSaved,
}: {
  mode: "onboarding" | "edit";
  initial?: { lifeStages: Stage[]; interests: Topic[] };
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [stages, setStages] = useState<Stage[]>(initial?.lifeStages ?? []);
  const [interests, setInterests] = useState<Topic[]>(initial?.interests ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 고르기를 바꾸면 지난 실패는 더 이상 지금 상태의 이야기가 아니다. 다시 누를 때 새로 알린다.
  const toggle =
    <T,>(set: (update: (prev: T[]) => T[]) => void) =>
    (value: T) => {
      setError(null);
      set((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

  async function save(chosen: Topic[]) {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(user, "/api/profile", { method: "PUT", body: { audienceType: "young_adult", lifeStages: stages, interests: chosen } });
      onSaved?.();
    } catch (caught) {
      setError(describeError(caught, "저장하지 못했어요. 다시 시도해 주세요."));
      setBusy(false);
    }
    // 첫 진입이면 프로필 구독이 바뀌어 부모가 이 화면을 내린다.
  }

  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-16">
      {mode === "onboarding" ? (
        <>
          <h1 className="text-[48px] leading-[1.08] font-light tracking-[-0.02em]">통통</h1>
          <p className="mt-4 text-[18px] text-graphite">정책을 보고, 따져보고, 내 생각이 어떻게 바뀌는지 기록해요.</p>
        </>
      ) : (
        <>
          <Link href="/me" className="text-[14px] text-graphite underline-offset-4 hover:underline">
            ← 내 기록
          </Link>
          <h1 className="mt-10 text-[36px] leading-[1.17] font-light tracking-[-0.02em]">내 상황 · 관심 주제</h1>
        </>
      )}

      <div className="mt-12 flex gap-1" role="progressbar" aria-label="진행" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step}>
        {[1, 2].map((n) => (
          <span key={n} className={`h-1 flex-1 rounded-pill ${n <= step ? "bg-ink" : "bg-stone"}`} />
        ))}
      </div>

      {/* 단계가 바뀌면 새 내용이 떠오른다. */}
      <div key={step} className="step-enter">
        {step === 1 ? (
          <>
            {mode === "onboarding" && (
              <>
                <h2 className="mt-10 text-[18px] font-medium">나는 지금</h2>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" aria-pressed="true" className="rounded-pill border border-ink bg-ink px-5 py-3 text-eggshell">
                    청년 <span className="font-mono text-[13px] opacity-70">19–34</span>
                  </button>
                  {/* 청소년 트랙은 닫혀 있다 — 만 14세 미만 법정대리인 동의 방침 전까지 (검토 문서 3장 2번). 서버도 거절한다. */}
                  <button type="button" disabled className="rounded-pill border border-stone px-5 py-3 text-smoke">
                    청소년 <span className="text-[13px]">준비 중</span>
                  </button>
                </div>
              </>
            )}
            <h2 className="mt-10 text-[18px] font-medium">지금 나와 가까운 것은?</h2>
            <p className="mt-1 text-[14px] text-smoke">여러 개 골라도 돼요. 카드 순서에만 쓰여요.</p>
            <Chips options={LifeStage.options} labels={LIFE_STAGE_LABELS} value={stages} onToggle={toggle(setStages)} />
            <button type="button" onClick={() => setStep(2)} className="mt-12 w-full rounded-pill bg-ink px-6 py-4 text-eggshell">
              다음
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-10 text-[18px] font-medium">관심 있는 주제는?</h2>
            <p className="mt-1 text-[14px] text-smoke">고르지 않아도 돼요. 이것도 카드 순서에만 쓰여요.</p>
            <Chips options={Category.options} labels={CATEGORY_LABELS} value={interests} onToggle={toggle(setInterests)} />
            <button type="button" onClick={() => save(interests)} disabled={busy || !user} className="mt-12 w-full rounded-pill bg-ink px-6 py-4 text-eggshell disabled:opacity-40">
              {mode === "onboarding" ? "시작하기" : "저장"}
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStep(1)} disabled={busy} className="rounded-pill border border-stone px-6 py-3 disabled:opacity-40">
                이전
              </button>
              {mode === "onboarding" && (
                <button type="button" onClick={() => save([])} disabled={busy || !user} className="rounded-pill border border-stone px-6 py-3 disabled:opacity-40">
                  건너뛰기
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="toast-enter mt-4 rounded-sm border border-ink px-4 py-3 text-[14px]">
          {error}
        </p>
      )}
    </main>
  );
}

function Chips<T extends string>({ options, labels, value, onToggle }: { options: readonly T[]; labels: Record<T, string>; value: T[]; onToggle: (value: T) => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(option)}
            className={`rounded-pill border px-4 py-2 ${selected ? "pick-pop border-ink bg-ink text-eggshell" : "border-stone hover:border-graphite"}`}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}
