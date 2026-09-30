import { ImageResponse } from "next/og";

import { CARDS, findCard } from "@/content/cards";
import { C, Logo, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "통통 정책 카드";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return CARDS.map((card) => ({ id: card.id }));
}

/**
 * 카드 공유 미리보기 — 훅 문장과 정책 이름만. 받은 사람도 먼저 판단해 보게 답은 싣지 않는다.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const card = findCard((await params).id);
  if (!card) return new Response(null, { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: C.eggshell,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: C.graphite }}>{card.shortTitle}</div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 300, lineHeight: 1.25, letterSpacing: "-0.02em", color: C.ink, wordBreak: "keep-all" }}>
          “{card.hook}”
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `2px solid ${C.stone}`, paddingTop: 32 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 300, color: C.smoke }}>이 말, 얼마나 맞을까요? 직접 따져보세요.</div>
          <Logo width={180} />
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts },
  );
}
