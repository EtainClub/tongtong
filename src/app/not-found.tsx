import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "없는 주소", robots: { index: false, follow: true } };

/** 낡은 링크로 들어온 사람에게 갈 곳을 알려 준다. 기본 404는 영어 한 줄이고 나갈 길이 없다. */
export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-16">
      <p className="font-mono text-[13px] text-smoke">404</p>
      <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-tight">이 주소에는 카드가 없어요</h1>
      <p className="mt-4 text-[15px] text-graphite">주소가 바뀌었거나 아직 공개하지 않은 카드예요.</p>
      <Link href="/" className="mt-10 block w-full rounded-pill bg-ink px-6 py-4 text-center text-eggshell">
        피드로 가기
      </Link>
    </main>
  );
}
