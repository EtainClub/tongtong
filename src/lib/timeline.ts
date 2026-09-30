import type { StoredJudgment } from "@/lib/user-state";

export type TimelineRole = "first" | "latest" | "middle";
export type TimelineEntry = {
  judgment: StoredJudgment;
  /** 같은 축(신뢰끼리, 평가끼리)에서의 자리. 척도 값이 없는 줄(훅 정확도·모르겠음)은 null. */
  role: TimelineRole | null;
  /** 재평가를 부른 계기. 앞선 평가 이후 카드 버전이 올랐으면 "정책 변경". */
  trigger: "updated" | "revisit" | null;
};

/**
 * 판단 이력 시간축 (설계 65장, 로드맵 4.6).
 * 같은 축 안에서 처음(burgundy 점선)과 가장 최근(navy)을 가른다. 한 번뿐이면 "가장 최근"으로 본다.
 * 축이 다른 값은 잇지 않는다 — 사실을 믿는 것과 정책을 좋게 보는 것은 다른 일이다.
 */
export function timeline(judgments: readonly StoredJudgment[]): TimelineEntry[] {
  const scaled = (j: StoredJudgment) => j.axis !== "hookAccuracy" && j.value !== null;
  const byAxis = new Map<string, number[]>();
  judgments.forEach((j, i) => {
    if (scaled(j)) byAxis.set(j.axis, [...(byAxis.get(j.axis) ?? []), i]);
  });

  return judgments.map((judgment, index) => {
    const same = byAxis.get(judgment.axis);
    const role: TimelineRole | null = !scaled(judgment) || !same ? null : index === same.at(-1) ? "latest" : index === same[0] ? "first" : "middle";

    let trigger: TimelineEntry["trigger"] = null;
    if (judgment.phase === "revisit") {
      const previous = judgments.slice(0, index).findLast((j) => j.axis === "opinion");
      trigger = previous && judgment.cardVersion > previous.cardVersion ? "updated" : "revisit";
    }
    return { judgment, role, trigger };
  });
}
