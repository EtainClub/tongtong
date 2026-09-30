import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * 공유 미리보기(opengraph-image) 공통 부품. 잼통 lib/og/card와 같은 방식.
 *
 * satori는 CDN 웹폰트와 WOFF2를 못 읽는다. 한글 글리프가 담긴 정적 OTF를 넘긴다 (assets/fonts).
 * 이미지는 빌드 때 만들어진다 — 카드 페이지가 정적이라 이미지도 정적이다.
 *
 * 공유 이미지에는 판단 값을 넣지 않는다 (검토 문서 9장 — 정책 평가는 민감정보일 수 있다).
 */

const [light, semibold, logo] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Pretendard-Light.otf")),
  readFile(join(process.cwd(), "assets/fonts/Pretendard-SemiBold.otf")),
  readFile(join(process.cwd(), "assets/og/logo.png")),
]);

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const ogFonts = [
  { name: "Pretendard", data: light, weight: 300 as const, style: "normal" as const },
  { name: "Pretendard", data: semibold, weight: 600 as const, style: "normal" as const },
];

/** globals.css 토큰 값. 한 곳에서 갈라지면 안 된다. */
export const C = { eggshell: "#fdfcfc", stone: "#ebe8e4", ink: "#000000", graphite: "#44403b", smoke: "#777169" };

/** 로고 원본 비율 1942 × 809. */
const LOGO_RATIO = 809 / 1942;
const logoUri = `data:image/png;base64,${logo.toString("base64")}`;

export function Logo({ width }: { width: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- satori는 <img>만 그린다.
  return <img src={logoUri} alt="" width={width} height={Math.round(width * LOGO_RATIO)} />;
}
