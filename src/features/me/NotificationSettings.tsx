"use client";

import type { User } from "firebase/auth";
import { useState } from "react";

import { apiFetch, describeError } from "@/lib/firebase/api";
import { PUSH_UNAVAILABLE_TEXT, requestPushToken, useNotifySettings } from "@/lib/firebase/notify";
import { anyOn, NOTIFY_KINDS, NOTIFY_LABELS, type NotifyKind } from "@/lib/notify";

/*
 * 알림 설정 (로드맵 M7-B, 4.9). 내 기록의 설정 묶음 안. 세 가지를 따로 켜고 끈다 — 기본은 모두 꺼짐.
 * 켜는 순간에만 브라우저 권한을 묻는다. 모두 끄면 서버가 이 사람의 기기 토큰을 지운다.
 */
export function NotificationSettings({ user, blueprint }: { user: User; blueprint: boolean }) {
  // 청사진 점검 알림은 청사진을 쓸 수 있는 사람에게만 보인다 (청사진 설계 7.1·B5).
  const kinds = NOTIFY_KINDS.filter((kind) => kind !== "blueprint" || blueprint);
  const { ready, settings } = useNotifySettings(user.uid);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(kind: NotifyKind) {
    const next = { ...settings, [kind]: !settings[kind] };
    setBusy(true);
    setMessage(null);
    try {
      let token: string | undefined;
      if (anyOn(next)) {
        // 켜는 쪽이면 이 기기의 토큰을 받아 함께 보낸다(이미 켠 기기여도 토큰이 바뀌었을 수 있다).
        const result = await requestPushToken();
        if ("unavailable" in result) {
          setMessage(PUSH_UNAVAILABLE_TEXT[result.unavailable]);
          return;
        }
        token = result.token;
      }
      await apiFetch(user, "/api/notifications", { method: "PUT", body: { ...next, ...(token && { token }) } });
      setMessage(anyOn(next) ? "이 기기로 알림을 보내요. 하루 한 번까지예요." : "알림을 모두 껐어요. 이 기기 정보도 지웠어요.");
    } catch (error) {
      setMessage(describeError(error, "알림 설정을 바꾸지 못했어요. 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-2 rounded-card border border-stone p-5">
      <summary className="disclosure text-[16px] font-semibold">알림</summary>
      <p className="mt-2 text-[15px] text-graphite">
        저장한 카드{blueprint && "와 내 청사진"}에 대해서만, 하루 한 번까지 보내요. 알림에는 정책 이름과 날짜만 담고 내 평가{blueprint && "·청사진 메모"}는 담지 않아요.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-stone">
        {kinds.map((kind) => (
          <li key={kind}>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span>
                <span className="block text-[15px] font-medium">{NOTIFY_LABELS[kind].title}</span>
                <span className="block text-[13px] text-smoke">{NOTIFY_LABELS[kind].detail}</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={settings[kind]}
                disabled={!ready || busy}
                onChange={() => void toggle(kind)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-7 w-12 shrink-0 rounded-pill bg-stone transition-colors peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-ink peer-disabled:opacity-40 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-eggshell after:transition-transform peer-checked:after:translate-x-5"
              />
            </label>
          </li>
        ))}
      </ul>
      {message && (
        <p role="status" className="mt-2 text-[13px] text-graphite">
          {message}
        </p>
      )}
    </details>
  );
}
