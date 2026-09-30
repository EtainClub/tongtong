import type { MetadataRoute } from "next";

import { CARDS } from "@/content/cards";
import { SITE_URL } from "@/lib/site";

/**
 * 공개 카드와, 공개 카드가 있는 주제만. 빈 주제 페이지는 싣지 않는다.
 * 카드의 lastModified는 원문을 다시 대조한 날(reviewedAt)이다 — 빌드 시각이 아니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const published = CARDS.filter((card) => card.publishStatus === "published");
  const topics = [...new Set(published.map((card) => card.category))];
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/privacy` },
    ...published.map((card) => ({ url: `${SITE_URL}/card/${card.id}`, lastModified: card.reviewedAt })),
    ...topics.map((topic) => ({ url: `${SITE_URL}/topics/${topic}` })),
  ];
}
