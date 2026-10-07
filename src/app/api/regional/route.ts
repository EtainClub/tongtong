import { z } from "zod";

import { findDistrict, findSido } from "@/content/regions";
import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { regionalPolicies } from "@/lib/server/youthcenter";

export const runtime = "nodejs";

const input = z.object({ sido: z.string().regex(/^\d{2}$/), sigungu: z.string().regex(/^\d{5}$/).optional() }).strict();

/**
 * 우리 지역 청년 정책 (docs/regional-benefits-review.md R1). 몸통 { sido, sigungu? }.
 * POST인 까닭: 같은 사이트의 GET에는 브라우저가 Origin을 붙이지 않아 Origin 검사를 지날 수 없다(다른 API와 같게).
 * 지역 코드만 받는다 — 누가 물었는지는 남기지 않는다. 로그인(익명 포함)은 인증키 호출을 남용에서 지키려고 본다.
 */
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await verifyCaller(req);
    const parsed = input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");
    const { sido, sigungu } = parsed.data;
    if (!findSido(sido) || (sigungu && !findDistrict(sido, sigungu))) throw new Refusal(400, "unknown-region");
    const policies = await regionalPolicies(sido, sigungu);
    return Response.json({ policies, source: "온통청년 청년정책 API (한국고용정보원)" });
  } catch (error) {
    return refusalResponse(error);
  }
}
