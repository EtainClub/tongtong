/*
 * 사실을 먼저 본 정책 (청사진 설계 2.5).
 *
 * 정책 페이지는 사실을 바로 보여 준다. 그 사람에게 같은 정책 카드의 "처음 본 문장을 얼마나 믿나요"를
 * 물으면 판단이 오염된다 — 그래서 본 정책을 브라우저에만 기억하고, 카드는 훅 판단을 건너뛴다.
 * 판단 값이 아니고 서버로 보내지 않는다. 저장소를 못 쓰는 브라우저에서는 기억하지 못한다 — 그때는 묻는다.
 */

const KEY = "tongtong:seen-facts";

function read(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markFactsSeen(policyId: string) {
  try {
    const ids = read();
    if (!ids.includes(policyId)) localStorage.setItem(KEY, JSON.stringify([...ids, policyId]));
  } catch {
    // 저장소를 쓸 수 없다 — 기억하지 않는다.
  }
}

export function hasSeenFacts(policyId: string): boolean {
  return read().includes(policyId);
}
