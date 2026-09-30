import { describe, expect, it } from "vitest";

import { eyo, formatManwon } from "./labels";

describe("eyo", () => {
  it("받침이 있으면 이에요, 없으면 예요", () => {
    expect(eyo("청년")).toBe("청년이에요");
    expect(eyo("회사")).toBe("회사예요");
    expect(eyo('"청년과 회사 둘 다"')).toBe('"청년과 회사 둘 다"예요');
    expect(eyo("3회")).toBe("3회예요");
    expect(eyo("3")).toBe("3이에요");
    expect(eyo("12개월")).toBe("12개월이에요");
  });
});

describe("formatManwon", () => {
  it("만 원 단위는 짧게", () => {
    expect(formatManwon(2_500_000)).toBe("250만 원");
    expect(formatManwon(12_345)).toBe("12,345원");
  });
});
