/** 요청 거절. reason은 로그에, clientCode는 응답에 간다. (임통 guard/refusal) */
export class Refusal extends Error {
  constructor(
    public readonly status: number,
    public readonly reason: string,
    public readonly clientCode = reason,
  ) {
    super(reason);
  }
}

export function refusalResponse(error: unknown): Response {
  if (error instanceof Refusal) {
    console.warn("request-refused", { reason: error.reason });
    return Response.json({ error: error.clientCode }, { status: error.status });
  }
  console.error("request-failed", error);
  return Response.json({ error: "internal" }, { status: 500 });
}
