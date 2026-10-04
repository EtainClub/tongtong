"use client";

import Link from "next/link";

import { checkText, fixLabel } from "@/features/plan/checkText";
import { policyName } from "@/features/plan/Timeline";
import type { Check, Fix } from "@/lib/blueprint/check";

/*
 * 점검 묶음 (청사진 설계 7.3·7.5) — 시간축 위, 접이식.
 *
 * 점검마다 무엇이 바뀌었는지 → 고칠 수 있는 길 → [닫기]. 닫는 길은 셋이다(5.1):
 *   고치기(fix)          REV가 오른다. trigger는 이 점검이다
 *   "이대로 둘게요"(accept) 계획의 근거(항목 버전)가 바뀌니 REV
 *   닫기                  알림만 닫는다 — REV 없음. 근거(회차·버전)가 바뀌면 다시 뜬다
 */

export function ChecksPanel({
  checks,
  busy,
  onFix,
  onDismiss,
  onOpen,
}: {
  checks: Check[];
  busy: boolean;
  onFix: (check: Check, fix: Fix) => void;
  onDismiss: (check: Check) => void;
  onOpen: (placementId: string) => void;
}) {
  if (checks.length === 0) return <p className="mt-6 text-[14px] text-smoke">지금 점검할 것이 없어요.</p>;

  return (
    <details open className="mt-6 rounded-card border border-stone p-5">
      <summary className="disclosure text-[16px] font-semibold">
        <span>
          점검할 것 <span className="font-mono tabular">{checks.length}</span>
        </span>
      </summary>
      <ul className="mt-4 flex flex-col">
        {checks.map((check) => {
          const text = checkText(check);
          return (
            <li key={check.key} className="border-t border-stone py-4">
              <p className="text-[15px] leading-relaxed">
                {check.policyId && <span className="font-medium">{policyName(check.policyId)} </span>}
                {text.message}
              </p>
              {text.detail && <p className="mt-1 text-[14px] text-graphite">{text.detail}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {check.fixes.map((fix) => (
                  <button
                    key={fix.id}
                    type="button"
                    disabled={busy}
                    onClick={() => onFix(check, fix)}
                    className="rounded-pill border border-ink px-4 py-1.5 text-[14px] disabled:opacity-40"
                  >
                    {fixLabel(check, fix.id)}
                  </button>
                ))}
                {text.link &&
                  (text.link.external ? (
                    <a href={text.link.href} target="_blank" rel="noreferrer" className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
                      {text.link.label}
                    </a>
                  ) : (
                    <Link href={text.link.href} className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
                      {text.link.label}
                    </Link>
                  ))}
                {check.placementId && (
                  <button type="button" onClick={() => onOpen(check.placementId!)} className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
                    보기
                  </button>
                )}
                {check.dismissible && (
                  <button type="button" disabled={busy} onClick={() => onDismiss(check)} className="px-2 py-1.5 text-[14px] text-graphite underline underline-offset-4 disabled:opacity-40">
                    닫기
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
