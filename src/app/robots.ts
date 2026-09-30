import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * /me는 막지 않는다 — 페이지의 noindex를 검색엔진이 읽어야 한다.
 * 개인 기록 보호는 robots가 아니라 인증과 보안 규칙이 맡는다.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], sitemap: `${SITE_URL}/sitemap.xml` };
}
