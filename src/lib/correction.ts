import { z } from "zod";

/**
 * 정정 요청 (검토 문서 9장). 카드 내용이 틀렸다는 제보는 공개하지 않고 운영자만 본다.
 * 이름 없이 받는다 — 회신을 원하면 연락처를 적는다.
 */
export const correctionInput = z.object({
  cardId: z.string().min(1).max(100),
  claimId: z.string().min(1).max(100).optional(),
  body: z.string().trim().min(10).max(1000),
  contact: z.string().trim().max(200).optional(),
});

export type CorrectionInput = z.infer<typeof correctionInput>;

/** 한 사람이 한 시간에 보낼 수 있는 수. 제보 창구가 스팸 통로가 되지 않게. */
export const CORRECTION_HOURLY_LIMIT = 5;
