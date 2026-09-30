import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";

import { findCard } from "@/content/cards";
import { askAnswerSchema, askInput, buildCardContext, buildTopicIndex, isOnTopic, sanitizeAnswer, SYSTEM_PROMPT } from "@/lib/ask/grounding";
import { askCacheKey } from "@/lib/ask/cache-key";
import { clientIp, takeDailyBudget, takeRate } from "@/lib/ask/limits";
import { verifyCaller } from "@/lib/guard/identity";
import { checkOrigin } from "@/lib/guard/origin";
import { Refusal, refusalResponse } from "@/lib/guard/refusal";
import { readAskCache, writeAskCache } from "@/lib/server/ask-cache";

export const runtime = "nodejs";

/*
 * AI에게 따져보기 (설계 28–31장 → 검토 문서 5.4).
 *
 * 방어는 네 겹이다 (잼통 /api/ask): Origin → 로그인+App Check → 주제 선별(모델 호출 없음) →
 * 사람당 한도·일일 총량. 질문과 답은 저장하지 않는다 — 질문에 나이·소득이 섞인다 (검토 문서 4.4).
 * 예외는 카드에 적힌 추천 질문의 답뿐이다 — 고정 문장이라 개인 사정이 없다 (lib/ask/cache-key, 7일).
 */

/** 모델은 ASK_MODEL로 바꾼다 (운영: claude-haiku-4-5). 공백이 섞여 들어오면 API가 거절하므로 다듬는다. */
const MODEL = process.env.ASK_MODEL?.trim() || "claude-opus-5-5";
/** Haiku 4.5는 effort를 받지 않는다(400). */
const SUPPORTS_EFFORT = !MODEL.startsWith("claude-haiku");
/** 안전 분류기가 거절하면 서버가 대체 모델로 다시 돌린다. 이 목록의 모델만 받는다. */
const SUPPORTS_FALLBACK = ["claude-opus-5-5", "claude-opus-5", "claude-fable-5-1", "claude-sonnet-5-5"].includes(MODEL);

const client = new Anthropic();

export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { uid } = await verifyCaller(req);
    const parsed = askInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw new Refusal(400, "invalid-body");

    const card = findCard(parsed.data.cardId);
    if (!card) throw new Refusal(404, "unknown-card");

    // 카드와 무관한 말로만 된 질문은 모델에게 묻지 않는다. 비용 0, 지어낼 여지도 0.
    if (!isOnTopic(parsed.data.question, buildTopicIndex(card))) {
      return Response.json({ grounded: false, answer: "이 카드의 자료와 관련된 질문이 아니에요. 이 정책에 대해 물어봐 주세요.", claimIds: [] });
    }

    // 추천 질문이면 먼저 캐시를 본다. 맞으면 모델을 부르지 않으니 한도도 쓰지 않는다.
    const cacheKey = askCacheKey(card, parsed.data.question);
    const cached = cacheKey ? await readAskCache(cacheKey) : null;
    if (cached) return Response.json(cached, { headers: { "x-ask-cache": "hit" } });

    // 여기부터 돈이 든다.
    takeRate([`uid:${uid}`, `ip:${clientIp(req)}`]);
    takeDailyBudget();

    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      ...(SUPPORTS_FALLBACK ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      // 프롬프트 캐시는 걸지 않는다 — 규칙+카드 자료가 모델의 최소 캐시 길이에 못 미쳐 걸어도 적용되지 않는다.
      // 카드 자료가 길어지면 규칙 블록에 cache_control을 달고 usage.cache_read_input_tokens로 확인한다.
      system: [
        { type: "text", text: SYSTEM_PROMPT },
        { type: "text", text: buildCardContext(card, new Date()) },
      ],
      output_config: {
        // 짧은 근거 인용이라 깊게 생각할수록 느려지기만 한다.
        ...(SUPPORTS_EFFORT ? { effort: "low" as const } : {}),
        format: betaZodOutputFormat(askAnswerSchema),
      },
      messages: [{ role: "user", content: parsed.data.question }],
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ grounded: false, answer: "이 질문에는 답하지 못했어요. 질문을 바꿔 다시 물어봐 주세요.", claimIds: [] });
    }
    if (!response.parsed_output) throw new Refusal(502, "ask-unparsed");

    const answer = sanitizeAnswer(card, response.parsed_output);
    if (cacheKey) await writeAskCache(cacheKey, answer, MODEL);
    return Response.json(answer);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return refusalResponse(new Refusal(429, "ask-upstream-rate-limited"));
    if (error instanceof Anthropic.AuthenticationError) return refusalResponse(new Refusal(503, "ask-credentials"));
    if (error instanceof Anthropic.APIError) {
      console.error("[ask] 모델 호출 실패", error.status, error.message);
      return refusalResponse(new Refusal(502, "ask-upstream"));
    }
    return refusalResponse(error);
  }
}
