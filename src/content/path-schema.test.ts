import { describe, expect, it } from "vitest";

import { stageAt, validatePath, type Path } from "./path-schema";
import { ALL_PATHS } from "./paths";
import { ALL_POLICIES } from "./policies";

const policies = new Map(ALL_POLICIES.map((policy) => [policy.id, policy]));
const phd = () => structuredClone(ALL_PATHS.find((path) => path.id === "phd-stem")!);

/** 통과하는 견본을 복제해 한 군데씩 망가뜨린다. */
function broken(mutate: (path: Path) => void): string[] {
  const path = phd();
  mutate(path);
  return validatePath(path, policies);
}

describe("실제 경로 견본", () => {
  it("모두 불변식을 통과한다", () => {
    for (const path of ALL_PATHS) expect(validatePath(path, policies), path.id).toEqual([]);
  });
});

describe("stageAt", () => {
  it("그 시점까지 지난 마지막 이정표의 단계", () => {
    const path = phd();
    expect(stageAt(path, 0)).toBe("undergrad");
    expect(stageAt(path, 23)).toBe("undergrad");
    expect(stageAt(path, 24)).toBe("grad_master");
    expect(stageAt(path, 96)).toBe("grad_phd"); // stage 없는 이정표는 앞의 단계를 잇는다
  });
});

describe("validatePath", () => {
  const slot = (path: Path, id: string) => path.slots.find((s) => s.id === id)!;

  it("항목의 대상 단계가 아닌 시점에 칸을 두면 오류", () => {
    // 연구생활장려금은 대학원생 대상 — 학부 때로 옮기면 틀린다.
    expect(broken((p) => (slot(p, "stipend").fromOffset = 0))).toContainEqual(expect.stringContaining("그 시점 단계(undergrad)"));
  });

  it("항목의 역할이 아닌 역할로 놓으면 오류", () => {
    expect(broken((p) => (slot(p, "stipend").role = "housing"))).toContainEqual(expect.stringContaining("역할 housing"));
  });

  it("없는 항목·이정표를 가리키면 오류", () => {
    const errors = broken((p) => {
      slot(p, "loan").policyId = "nowhere";
      slot(p, "work").milestoneId = "nowhere";
    });
    expect(errors).toContainEqual(expect.stringContaining('없는 정책 항목 "nowhere"'));
    expect(errors).toContainEqual(expect.stringContaining('없는 이정표 "nowhere"'));
  });

  it("끝이 시작보다 이르면 오류", () => {
    expect(broken((p) => (slot(p, "rent").toOffset = 10))).toContainEqual(expect.stringContaining("끝이 시작보다"));
  });

  it("공개하려면 모든 칸의 항목이 공개이고 한계가 검증되어야 한다", () => {
    const errors = broken((p) => {
      p.publishStatus = "published";
    });
    expect(errors).toContainEqual(expect.stringContaining("national-scholarship가 초안이다"));
    expect(errors).toContainEqual(expect.stringContaining('caveat "bk21-ends"가 검증 전이다'));
    expect(broken((p) => ((p.publishStatus = "published"), (p.caveats = [])))).toContainEqual(expect.stringContaining("caveats"));
  });
});
