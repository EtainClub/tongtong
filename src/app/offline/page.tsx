import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "오프라인",
  robots: { index: false },
};

/** 서비스 워커가 연결이 없고 담아 둔 화면도 없을 때 보여 주는 화면 (로드맵 M7). 정적이라 설치 때 미리 담긴다. */
export default function OfflinePage() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 pt-16 pb-16">
      <h1 className="text-[28px] leading-tight font-bold tracking-tight">인터넷에 연결되어 있지 않아요</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-graphite">
        이 화면은 아직 기기에 담기지 않았어요. 저장한 카드와 내 기록은 연결 없이도 볼 수 있어요. 판단을 남기는 것은 연결된 뒤에 할 수 있어요.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/saved" className="rounded-pill bg-ink px-5 py-3 font-semibold text-eggshell">
          저장한 카드
        </Link>
        <Link href="/me" className="rounded-pill border border-stone px-5 py-3 font-medium hover:border-graphite">
          내 기록
        </Link>
      </div>
    </main>
  );
}
