"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, type ReactNode } from "react";

import type { Card } from "@/content/schema";
import { AskPanel } from "@/features/card/AskPanel";
import { CorrectionPanel } from "@/features/card/CorrectionPanel";
import { SourceList } from "@/features/card/Reveal";
import { Sheet } from "@/features/ui/Sheet";

/*
 * "조금 더 따져볼까요?" (설계 61장, 로드맵 4.2).
 *
 * 근거·AI·인물·관련 정책을 한곳에 모은 곁가지다 — 하나도 안 열어도 다음으로 간다 (검토 문서 7.2).
 * 열린 시트는 주소(?panel=)에 남긴다. 링크로 바로 열 수 있고, 뒤로 가기가 시트를 닫는다.
 * 없는 항목은 그리지 않는다.
 */

const PANELS = ["sources", "ask", "people", "correction"] as const;
type Panel = (typeof PANELS)[number];

export function Investigate({ card, now }: { card: Card; now: Date }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get("panel");
  const panel = PANELS.find((p) => p === requested) ?? null;
  /** 이 화면에서 연 시트는 뒤로 가기로 닫는다. 링크로 바로 들어왔으면 주소만 바꾼다. */
  const pushed = useRef(false);

  const href = (next: Panel | null) => {
    const query = new URLSearchParams(params);
    if (next) query.set("panel", next);
    else query.delete("panel");
    return query.size ? `${pathname}?${query}` : pathname;
  };
  const open = (next: Panel) => {
    pushed.current = true;
    router.push(href(next), { scroll: false });
  };
  const close = () => {
    if (!panel) return;
    if (pushed.current) router.back();
    else router.replace(href(null), { scroll: false });
    pushed.current = false;
  };

  const { people, jamtong } = card.links;

  return (
    <section aria-labelledby="investigate-title" className="mt-12">
      <h2 id="investigate-title" className="text-[18px] font-bold tracking-tight">
        조금 더 따져볼까요?
      </h2>
      <div className="stagger mt-4 grid grid-cols-2 gap-2">
        <Tile onClick={() => open("sources")} title="원자료" hint={`출처 ${card.sources.length}곳`} sourceLink />
        <Tile onClick={() => open("ask")} title="AI에게 묻기" hint="등록된 자료로만 답해요" />
        {people.length > 0 && <Tile onClick={() => open("people")} title="이 사람은?" hint={`${people.length}명 · 임통`} />}
        {jamtong && (
          <a href={jamtong.url} target="_blank" rel="noreferrer" className={tileClass}>
            <span className="text-[16px]">관련 정책 ↗</span>
            <span className="text-[13px] text-smoke">잼통 · {jamtong.title}</span>
          </a>
        )}
      </div>
      <button type="button" onClick={() => open("correction")} className="mt-4 text-[14px] text-graphite underline underline-offset-4">
        이 정보가 틀렸나요?
      </button>

      <Sheet open={panel === "sources"} title="원자료" onClose={close}>
        <SourceList card={card} now={now} />
      </Sheet>
      <Sheet open={panel === "ask"} title="AI에게 묻기" onClose={close}>
        <AskPanel card={card} now={now} />
      </Sheet>
      {people.length > 0 && (
        <Sheet open={panel === "people"} title="이 사람은?" onClose={close}>
          <p className="text-[13px] text-smoke">누가 무슨 말을 했는지는 임통에 모여 있어요.</p>
          <ul className="mt-4 flex flex-col">
            {people.map((person) => (
              <li key={person.imtongUrl} className="border-t border-stone py-4">
                <a href={person.imtongUrl} target="_blank" rel="noreferrer" className="flex items-baseline justify-between gap-4">
                  <span>
                    <span className="text-[16px]">{person.name}</span>
                    <span className="mt-0.5 block text-[14px] text-graphite">{person.role}</span>
                  </span>
                  <span className="shrink-0 text-[14px] text-graphite underline underline-offset-4">임통 ↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
      <Sheet open={panel === "correction"} title="이 정보가 틀렸나요?" onClose={close}>
        <CorrectionPanel card={card} />
      </Sheet>
    </section>
  );
}

const tileClass = "flex min-h-24 flex-col justify-between gap-2 rounded-card border border-stone p-4 text-left hover:border-graphite";

/** sourceLink — 원자료를 여는 칸. 원자료 클릭률에 센다 (data-source-link, 로드맵 M8). */
function Tile({ title, hint, onClick, sourceLink }: { title: ReactNode; hint: string; onClick: () => void; sourceLink?: boolean }) {
  return (
    <button type="button" onClick={onClick} data-source-link={sourceLink || undefined} className={tileClass}>
      <span className="text-[16px]">{title}</span>
      <span className="text-[13px] text-smoke">{hint}</span>
    </button>
  );
}
