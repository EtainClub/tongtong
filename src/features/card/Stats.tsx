"use client";

import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import type { Card } from "@/content/schema";
import { firebaseDb } from "@/lib/firebase/client";
import { HOOK_ACCURACY_LABELS, SCALE_LABELS, type HookAccuracy } from "@/lib/judgment";
import { MIN_PUBLIC, type CardStat, type ScaleDistribution } from "@/lib/stats";

/**
 * 다른 통통 사용자들의 응답 (설계 34장).
 *
 * 자기 판단을 마친 뒤에만 이 컴포넌트가 그려진다 — 먼저 보면 앵커링이 된다.
 * 분포는 데이터라서 navy로 칠한다. 응답이 MIN_PUBLIC 미만이면 서버가 분포를 쓰지 않으므로
 * 여기서는 "아직 모이지 않았다"고만 말한다. 여론조사가 아니라는 말을 늘 붙인다.
 */
export function CardStats({ card }: { card: Card }) {
  const [stat, setStat] = useState<CardStat | null | undefined>(undefined);

  useEffect(() => {
    getDoc(doc(firebaseDb, "cardStats", card.id))
      .then((snapshot) => setStat(snapshot.exists() ? (snapshot.data() as CardStat) : null))
      .catch(() => setStat(null));
  }, [card.id]);

  if (stat === undefined) return null;

  const scaleRows = (d: ScaleDistribution, labels: readonly string[]) => [
    ...labels.map((label, i) => ({ label, count: d[String(i + 1) as "1"] })),
    { label: "모르겠음", count: d.unknown },
  ];

  const blocks = [
    card.flow.opinion && stat?.opinion && { title: "이 정책은", n: stat.opinion.n, rows: scaleRows(stat.opinion.distribution, SCALE_LABELS.opinion) },
    card.flow.trust &&
      stat?.hookAccuracy && {
        title: "처음 본 문장은",
        n: stat.hookAccuracy.n,
        rows: (Object.keys(HOOK_ACCURACY_LABELS) as HookAccuracy[]).map((key) => ({ label: HOOK_ACCURACY_LABELS[key], count: stat.hookAccuracy!.distribution[key] })),
      },
  ].filter((b): b is { title: string; n: number; rows: { label: string; count: number }[] } => Boolean(b));

  return (
    <section aria-labelledby={`stats-${card.id}`} className="mt-12 border-t border-stone pt-8">
      <h2 id={`stats-${card.id}`} className="text-[18px] font-bold tracking-tight">
        다른 사용자들은
      </h2>
      <p className="mt-1 text-[13px] text-smoke">통통 사용자들의 응답이며 여론조사가 아닙니다. 한 사람의 가장 최근 판단만 셉니다.</p>

      {blocks.length === 0 ? (
        <p className="mt-4 text-[15px] text-graphite">응답이 {MIN_PUBLIC}명 넘게 모이면 보여드려요.</p>
      ) : (
        blocks.map((block) => (
          <figure key={block.title} className="mt-6">
            <figcaption className="flex justify-between text-[15px]">
              <span>{block.title}</span>
              <span className="font-mono text-[12px] text-smoke tabular">n={block.n}</span>
            </figcaption>
            <ul className="mt-3 flex flex-col gap-2">
              {block.rows.map((row) => {
                const share = block.n ? row.count / block.n : 0;
                return (
                  <li key={row.label} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-[13px]">
                    <span className="text-graphite">{row.label}</span>
                    <span className="h-2 rounded-pill bg-navy-tint">
                      <span className="bar-grow block h-2 rounded-pill bg-navy" style={{ width: `${share * 100}%` }} />
                    </span>
                    <span className="text-right font-mono text-smoke tabular">{Math.round(share * 100)}%</span>
                  </li>
                );
              })}
            </ul>
          </figure>
        ))
      )}
    </section>
  );
}
