"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useState } from "react";

import { findSido, REGIONS } from "@/content/regions";
import { describeError } from "@/lib/firebase/api";
import { regionLabel, saveRegion, useRegion } from "@/lib/region";
import type { Profile } from "@/lib/user-state";

/*
 * 사는 지역 고르기 (docs/regional-benefits-review.md R1). 내 기록의 "내 상황" 아래.
 * 시·도는 꼭, 시·군·구는 골라도 되고 안 골라도 된다. 읍·면·동은 묻지 않는다.
 * 청년만 — 청소년의 거주지는 받지 않는다.
 */
export function RegionSetting({ user, profile }: { user: User; profile: Profile }) {
  const region = useRegion();
  const [editing, setEditing] = useState(false);
  const [sido, setSido] = useState(region?.sido ?? "");
  const [sigungu, setSigungu] = useState(region?.sigungu ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const districts = findSido(sido)?.districts ?? [];
  const selectClass = "w-full rounded-input border border-stone bg-eggshell px-3 py-2.5 text-[15px] focus:border-graphite";

  function open() {
    setSido(region?.sido ?? "");
    setSigungu(region?.sigungu ?? "");
    setError(null);
    setEditing(true);
  }

  async function save(next: { sido: string; sigungu?: string } | null) {
    setBusy(true);
    setError(null);
    try {
      await saveRegion(user, profile, next);
      setEditing(false);
    } catch (caught) {
      setError(describeError(caught, "저장하지 못했어요. 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="my-region" className="mt-6 border-t border-stone pt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="my-region" className="text-[18px] font-bold tracking-tight">
            사는 지역
          </h2>
          <p className="mt-2 text-[15px] text-graphite">{region ? regionLabel(region) : "고르지 않았어요."}</p>
          <p className="mt-1 text-[13px] text-smoke">우리 지역 청년 정책을 보여 주는 데만 써요. 통계나 AI에는 쓰지 않아요.</p>
          {region && !editing && (
            <Link href="/regional" className="mt-2 inline-block text-[14px] font-medium underline underline-offset-4">
              우리 지역 청년 정책 보기
            </Link>
          )}
        </div>
        {!editing && (
          <button type="button" onClick={open} className="shrink-0 rounded-pill border border-ink px-4 py-2 text-[14px]">
            {region ? "바꾸기" : "고르기"}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[14px]">
            <span>시·도</span>
            <select
              value={sido}
              onChange={(e) => {
                setSido(e.target.value);
                setSigungu("");
              }}
              className={selectClass}
            >
              <option value="">고르세요</option>
              {REGIONS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          {districts.length > 0 && (
            <label className="flex flex-col gap-1.5 text-[14px]">
              <span>
                시·군·구 <span className="text-smoke">(선택)</span>
              </span>
              <select value={sigungu} onChange={(e) => setSigungu(e.target.value)} className={selectClass}>
                <option value="">고르지 않음</option>
                {districts.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !sido}
              onClick={() => void save({ sido, ...(sigungu && { sigungu }) })}
              className="rounded-pill bg-ink px-5 py-2.5 text-eggshell disabled:opacity-40"
            >
              저장
            </button>
            <button type="button" disabled={busy} onClick={() => setEditing(false)} className="rounded-pill border border-stone px-5 py-2.5 disabled:opacity-40">
              그대로 두기
            </button>
            {region && (
              <button type="button" disabled={busy} onClick={() => void save(null)} className="rounded-pill border border-stone px-5 py-2.5 text-graphite disabled:opacity-40">
                지역 지우기
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-[14px] text-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
