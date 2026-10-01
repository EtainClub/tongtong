import type { MetadataRoute } from "next";

import { CARDS } from "@/content/cards";
import { POLICIES } from "@/content/policies";
import { SITE_URL } from "@/lib/site";

/**
 * 공개 카드·공개 정책 항목과, 그중 하나라도 있는 주제만. 빈 주제 페이지는 싣지 않는다.
 * lastModified는 원문을 다시 대조한 날(reviewedAt)이다 — 빌드 시각이 아니다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const cards = CARDS.filter((card) => card.publishStatus === "published");
  const policies = POLICIES.filter((policy) => policy.publishStatus === "published");
  const topics = [...new Set([...cards, ...policies].map((item) => item.category))];
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/privacy` },
    ...cards.map((card) => ({ url: `${SITE_URL}/card/${card.id}`, lastModified: card.reviewedAt })),
    ...policies.map((policy) => ({ url: `${SITE_URL}/policy/${policy.id}`, lastModified: policy.reviewedAt })),
    ...topics.map((topic) => ({ url: `${SITE_URL}/topics/${topic}` })),
  ];
}
