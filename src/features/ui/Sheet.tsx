"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * 아래에서 올라오는 시트 (로드맵 4.2). 넓은 화면에서는 가운데 창.
 *
 * 네이티브 <dialog>를 쓴다 — 포커스 가두기, Esc로 닫기, 배경 막기를 브라우저가 한다.
 * 닫혀 있어도 내용은 그대로 둔다: AI 대화처럼 다시 열었을 때 이어져야 하는 것이 있다.
 */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // 시트 바깥(배경)을 누르면 닫는다. 시트 안쪽 클릭은 target이 dialog가 아니다.
      onClick={(event) => event.target === event.currentTarget && ref.current?.close()}
      className="sheet m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-y-auto rounded-t-card-lg bg-eggshell p-0 text-ink backdrop:bg-ink/30 sm:m-auto sm:max-w-xl sm:rounded-card-lg"
    >
      <header className="sticky top-0 flex items-center justify-between border-b border-stone bg-eggshell px-5 py-4">
        <h2 id={titleId} className="text-[18px] font-medium">
          {title}
        </h2>
        <button type="button" onClick={() => ref.current?.close()} className="rounded-pill border border-stone px-4 py-1.5 text-[14px] hover:border-graphite">
          닫기
        </button>
      </header>
      <div className="px-5 pt-4 pb-10">{children}</div>
    </dialog>
  );
}
