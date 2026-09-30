import { Refusal } from "@/lib/guard/refusal";

// 사이트 주소와, 같은 앱을 서빙하는 다른 주소(도메인을 붙인 뒤에도 App Hosting 기본 주소가 열려 있다).
function allowedOrigins(): string[] {
  return [process.env.NEXT_PUBLIC_SITE_URL, ...(process.env.EXTRA_ALLOWED_ORIGINS ?? "").split(",")]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

/** 다른 사이트에 심긴 스크립트가 사용자 토큰으로 우리 API를 부르지 못하게 한다. (임통 guard/origin) */
export function checkOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = allowedOrigins();
  if (!allowed.length && process.env.NODE_ENV !== "production" && origin?.startsWith("http://localhost:")) return;
  if (!origin || !allowed.includes(origin)) throw new Refusal(403, "origin-mismatch");
}
