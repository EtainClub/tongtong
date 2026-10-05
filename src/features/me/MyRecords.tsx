"use client";

import Link from "next/link";
import { useState } from "react";

import { CARDS } from "@/content/cards";
import { PLAN_ENTRY_OPEN } from "@/content/paths";
import { Category } from "@/content/schema";
import { CATEGORY_LABELS, formatDate, LIFE_STAGE_LABELS } from "@/features/labels";
import { InstallGuide } from "@/features/me/InstallGuide";
import { NotificationSettings } from "@/features/me/NotificationSettings";
import { useBlueprintChecks } from "@/features/plan/useBlueprintChecks";
import { Notice } from "@/features/ui/Notice";
import { apiFetch, describeError } from "@/lib/firebase/api";
import { linkGoogle, signOutToAnonymous, useAuth } from "@/lib/firebase/auth";
import { readBlueprintsForExport, useActiveBlueprint } from "@/lib/firebase/blueprint";
import { useUserData } from "@/lib/firebase/user-data";
import { summarize } from "@/lib/summary";

/**
 * 내 기록 (설계 64장).
 *
 * 동의 철회와 삭제가 여기 있다 — 정책 평가를 받는 날부터 거둬들이는 길도 있어야 한다
 * (검토 문서 3장 1번·9장). 숫자는 "몇 장 봤나"까지만 — 생각이 바뀐 카드 수 같은 것은
 * 세지 않는다 (검토 문서 2.5).
 */
export function MyRecords() {
  const { user } = useAuth();
  const data = useUserData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user || !data.ready) return <Notice>불러오는 중…</Notice>;
  if (data.error) return <Notice>기록을 불러오지 못했어요. 새로고침해 주세요.</Notice>;

  const states = [...data.states.values()];
  const summary = summarize(CARDS, data.states, Category.options);
  const consentAt = data.profile?.consent.opinion ?? null;
  const isYouth = data.profile?.audienceType === "youth";

  async function run(task: () => Promise<unknown>, done: string) {
    setBusy(true);
    setMessage(null);
    try {
      await task();
      setMessage(done);
    } catch (error) {
      setMessage(describeError(error, "처리하지 못했어요. 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  }

  const setConsent = (consentOpinion: boolean) => {
    if (!data.profile) return;
    if (!consentOpinion && !window.confirm("동의를 철회하면 저장된 정책 평가가 모두 지워져요. 계속할까요?")) return;
    void run(
      () => apiFetch(user, "/api/profile", { method: "PUT", body: { audienceType: data.profile!.audienceType, lifeStages: data.profile!.lifeStages, consentOpinion } }),
      consentOpinion ? "동의했어요." : "동의를 철회하고 정책 평가를 지웠어요.",
    );
  };

  const remove = (scope: "judgments" | "blueprints" | "account") => {
    const question = {
      account: "계정과 모든 기록을 지울까요? 되돌릴 수 없어요.",
      judgments: "판단 기록과 저장한 카드를 모두 지울까요? 되돌릴 수 없어요.",
      blueprints: "지금 청사진과 보관한 청사진, 고친 기록까지 모두 지울까요? 되돌릴 수 없어요.",
    }[scope];
    if (!window.confirm(question)) return;
    void run(() => apiFetch(user, `/api/me?scope=${scope}`, { method: "DELETE" }), "지웠어요.");
  };

  /**
   * 판단 이력은 사용자 것이다 (검토 문서 9장). 내 문서를 파일로 내려준다 — 서버(/api)를 거치지 않는다.
   * 청사진은 앱 전체 구독에 없어서 이때 한 번 읽는다 (보관한 것과 REV 기록까지).
   */
  const download = async () => {
    let blueprints: Awaited<ReturnType<typeof readBlueprintsForExport>>;
    try {
      blueprints = await readBlueprintsForExport(user.uid);
    } catch (error) {
      setMessage(describeError(error, "청사진을 읽지 못했어요. 다시 시도해 주세요."));
      return;
    }
    const exported = { exportedAt: new Date().toISOString(), profile: data.profile, cardStates: states, blueprints };
    const url = URL.createObjectURL(new Blob([JSON.stringify(exported, null, 2)], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `tongtong-${exported.exportedAt.slice(0, 10)}.json` });
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 익명 계정을 Google에 연결한다. uid가 그대로라 기록이 이어진다.
   * 이미 통통을 쓴 Google 계정이면 그 계정으로 옮겨 간다 — 지금 익명 계정의 기록은 두고 간다.
   */
  async function connectGoogle() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await linkGoogle(() =>
        window.confirm("이 Google 계정에는 이미 통통 기록이 있어요. 그 계정으로 옮기면 지금 기기의 기록은 이어지지 않아요. 옮길까요?"),
      );
      if (result === "linked") setMessage("Google 계정에 연결했어요. 기록이 그대로 이어져요.");
      if (result === "switched") setMessage("Google 계정의 기록으로 옮겼어요.");
    } catch (error) {
      // 팝업을 닫은 것은 오류가 아니다.
      if ((error as { code?: string }).code !== "auth/popup-closed-by-user") setMessage("연결하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-6 pb-16">
      <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-tight">내 기록</h1>

      {/* 몇 장을 봤는가까지만 센다. "생각이 바뀐 카드" 같은 수는 만들지 않는다 (검토 문서 2.5). */}
      <dl className="stagger mt-8 grid grid-cols-3 gap-2">
        {(
          [
            ["따져본 카드", summary.completed],
            ["저장한 카드", summary.saved],
            ["다시 판단한 카드", summary.revisited],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-card bg-taupe p-4">
            <dt className="text-[12px] leading-tight font-medium text-smoke">{label}</dt>
            <dd className="mt-2 font-mono text-[26px] font-medium text-ink tabular">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-3 divide-y divide-stone overflow-hidden rounded-card border border-stone">
        <RowLink href="/me/history" label="판단 이력" />
        <RowLink href="/saved" label="저장한 카드" meta={String(summary.saved)} />
        {PLAN_ENTRY_OPEN && !isYouth && <PlanLink />}
      </ul>

      {summary.byTopic.length > 0 && (
        <section aria-labelledby="by-topic" className="mt-12">
          <h2 id="by-topic" className="text-[18px] font-bold tracking-tight">
            주제별로 따져본 카드
          </h2>
          {/* 판단이 아니라 본 양이라 무채색 막대다. */}
          <ul className="stagger mt-4 flex flex-col gap-2">
            {summary.byTopic.map(({ topic, count }) => (
              <li key={topic}>
                <Link href={`/topics/${topic}`} className="flex items-center gap-3 hover:underline">
                  <span className="w-14 shrink-0 text-[14px]">{CATEGORY_LABELS[topic]}</span>
                  <span className="bar-grow h-2 rounded-pill bg-ink" style={{ width: `${(count / summary.byTopic[0].count) * 60}%` }} aria-hidden />
                  <span className="font-mono text-[13px] tabular">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="my-situation" className="mt-12 flex items-start justify-between gap-4 border-t border-stone pt-6">
        <div>
          <h2 id="my-situation" className="text-[18px] font-bold tracking-tight">
            내 상황 · 관심 주제
          </h2>
          <p className="mt-2 text-[15px] text-graphite">
            {[
              ...(isYouth ? ["청소년"] : []),
              ...(data.profile?.lifeStages ?? []).map((s) => LIFE_STAGE_LABELS[s]),
              ...(data.profile?.interests ?? []).map((t) => CATEGORY_LABELS[t]),
            ].join(" · ") ||
              "고른 것이 없어요."}
          </p>
          <p className="mt-1 text-[13px] text-smoke">카드 순서에만 쓰여요.</p>
        </div>
        <Link href="/me/profile" className="shrink-0 rounded-pill border border-ink px-4 py-2 text-[14px]">
          바꾸기
        </Link>
      </section>

      <h2 className="mt-12 text-[13px] font-semibold text-smoke">설정과 기록 관리</h2>

      <details className="mt-3 rounded-card border border-stone p-5">
        <summary className="disclosure text-[16px] font-semibold">정책 평가 저장 동의</summary>
        <p className="mt-2 text-[15px] text-graphite">
          {isYouth
            ? "청소년의 정책 평가는 이 기기에만 두고 저장하지 않아요. 청년이 되면 동의하고 저장할 수 있어요."
            : consentAt
              ? `${formatDate(Date.parse(consentAt))}에 동의했어요. 철회하면 저장된 정책 평가를 지워요.`
              : "동의하지 않았어요. 정책 평가는 저장하지 않아요."}
        </p>
        <button type="button" hidden={isYouth} disabled={busy || !data.profile} onClick={() => setConsent(!consentAt)} className="mt-4 rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
          {consentAt ? "동의 철회" : "동의하기"}
        </button>
      </details>

      <details className="mt-2 rounded-card border border-stone p-5">
        <summary className="disclosure text-[16px] font-semibold">기록 지키기</summary>
        {user.isAnonymous ? (
          <>
            <p className="mt-2 text-[15px] text-graphite">
              지금은 로그인 없는 익명 계정이에요. 브라우저 데이터를 지우거나 기기를 바꾸면 기록이 사라져요. Google 계정을 연결하면 기록이 그대로 이어져요.
            </p>
            <p className="mt-2 text-[13px] text-smoke">Google 계정은 로그인 확인에만 쓰고, 판단 기록에는 이름·이메일을 남기지 않아요.</p>
            <button type="button" disabled={busy} onClick={connectGoogle} className="mt-4 rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
              Google 계정 연결
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-[15px] text-graphite">Google 계정에 연결돼 있어요. 다른 기기에서 같은 계정으로 들어오면 기록이 이어져요.</p>
            <button type="button" disabled={busy} onClick={() => void run(signOutToAnonymous, "로그아웃했어요.")} className="mt-4 rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
              로그아웃
            </button>
          </>
        )}
      </details>

      <InstallGuide />
      <NotificationSettings user={user} blueprint={PLAN_ENTRY_OPEN && !isYouth} />

      <details className="mt-2 rounded-card border border-stone p-5">
        <summary className="disclosure text-[16px] font-semibold">기록 내려받기</summary>
        <p className="mt-2 text-[15px] text-graphite">내 프로필, 카드별 판단 기록, 청사진과 그 고친 기록을 JSON 파일로 받아요.</p>
        <button type="button" onClick={() => void download()} className="mt-4 rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
          내려받기
        </button>
      </details>

      <details className="mt-2 rounded-card border border-stone p-5">
        <summary className="disclosure text-[16px] font-semibold">기록 지우기</summary>
        <p className="mt-2 text-[15px] text-graphite">판단 기록이나 청사진만 지우거나, 계정까지 지울 수 있어요. 되돌릴 수 없어요.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => remove("judgments")} className="rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
            판단 기록 지우기
          </button>
          <button type="button" disabled={busy} onClick={() => remove("blueprints")} className="rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
            청사진 지우기
          </button>
          <button type="button" disabled={busy} onClick={() => remove("account")} className="rounded-pill border border-ink px-5 py-2.5 disabled:opacity-40">
            계정까지 지우기
          </button>
        </div>
      </details>

      <p className="mt-6 text-[13px] text-smoke">
        <Link href="/privacy" className="underline underline-offset-4">
          개인정보처리방침
        </Link>
      </p>

      {/* 버튼들이 화면 위쪽에 있어도 결과가 보이도록 아래에 붙인다. */}
      {message && (
        <p role="status" className="toast-enter sticky bottom-[calc(var(--bottom-nav,0px)+1rem)] mt-6 rounded-sm border border-ink bg-canvas px-4 py-3 text-[14px]">
          {message}
        </p>
      )}
    </main>
  );
}

/** 청사진 진입점 (청사진 설계 7.1). 청사진을 구독하므로 진입점이 열렸을 때만 그린다. */
function PlanLink() {
  const { blueprint } = useActiveBlueprint();
  // 청사진 설계 7.1 — "내 청사진 · REV.4 · 점검할 것 2". 점검은 /plan과 같은 계산.
  const { open } = useBlueprintChecks(blueprint);
  return (
    <RowLink
      href="/plan"
      label="내 청사진"
      note={open.length > 0 ? `점검할 것 ${open.length}` : undefined}
      meta={blueprint ? `REV.${blueprint.rev}` : undefined}
    />
  );
}

/** 목록 한 줄 — 이름, 오른쪽에 알림 한 줄·부가 정보(숫자)와 꺾쇠. */
function RowLink({ href, label, note, meta }: { href: string; label: string; note?: string; meta?: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-taupe/60">
        <span className="text-[15px] font-medium">{label}</span>
        <span className="flex items-center gap-2 text-[13px] text-smoke">
          {note && <span className="rounded-pill bg-taupe px-2 py-0.5 font-medium text-graphite">{note}</span>}
          {meta && <span className="font-mono tabular">{meta}</span>}
          <span aria-hidden="true" className="text-[18px] leading-none text-ash">
            ›
          </span>
        </span>
      </Link>
    </li>
  );
}
