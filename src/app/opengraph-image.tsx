import { ImageResponse } from "next/og";

import { C, Logo, OG_CONTENT_TYPE, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "통통 — 정책을 보고, 따져보고, 내 생각을 기록해요";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: C.eggshell,
          fontFamily: "Pretendard",
        }}
      >
        <Logo width={420} />
        <div style={{ marginTop: 36, fontSize: 40, fontWeight: 300, letterSpacing: "-0.02em", color: C.ink }}>
          정책을 보고, 따져보고, 내 생각을 기록해요
        </div>
      </div>
    ),
    { ...size, fonts: ogFonts },
  );
}
