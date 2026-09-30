import { describe, expect, it } from "vitest";

import { CARDS } from "./cards";
import { cardSchema, validateCard, type Card } from "./schema";

/** 통과하는 카드 하나를 복제해 한 군데씩 망가뜨린다. */
function broken(mutate: (card: Card) => void): string[] {
  const card = structuredClone(CARDS[0]);
  mutate(card);
  return validateCard(card);
}

describe("실제 카드", () => {
  it("모두 불변식을 통과한다", () => {
    for (const card of CARDS) expect(validateCard(card), card.id).toEqual([]);
  });
});

describe("cardSchema", () => {
  it("근거 없는 claim을 막는다", () => {
    const card = structuredClone(CARDS[0]);
    card.claims[0].sourceIds = [];
    expect(cardSchema.safeParse(card).success).toBe(false);
  });
});

describe("validateCard", () => {
  it("없는 source를 가리키는 claim", () => {
    expect(broken((c) => (c.claims[0].sourceIds = ["nowhere"]))).toContainEqual(expect.stringContaining('없는 source "nowhere"'));
  });

  it("게임 정답이 없는 claim을 가리키면 오류", () => {
    const errors = broken((c) => {
      if (c.game.type !== "eligibility") c.game.claimIds = ["ghost"];
    });
    expect(errors).toContainEqual(expect.stringContaining('없는 claim "ghost"'));
  });

  it("금액 게임 정답이 슬라이더 범위 밖이면 오류", () => {
    const errors = broken((c) => {
      if (c.game.type === "guess_amount") c.game.max = 1_000_000;
    });
    expect(errors).toContainEqual(expect.stringContaining("범위 밖"));
  });

  it("CLAIM은 누구의 주장인지 밝혀야 한다", () => {
    expect(broken((c) => (c.claims[0].assertionType = "CLAIM"))).toContainEqual(expect.stringContaining("assertedBy"));
  });

  it("자매 서비스 링크는 그 서비스 주소여야 한다", () => {
    const errors = broken((c) => {
      c.links.jamtong = { title: "다른 곳", url: "https://example.com/policy" };
      c.links.people = [{ name: "홍길동", role: "장관", imtongUrl: "https://jamtong.kr/people/hong" }];
    });
    expect(errors).toContainEqual(expect.stringContaining("jamtong.kr 주소"));
    expect(errors).toContainEqual(expect.stringContaining("홍길동"));
    expect(
      broken((c) => {
        c.links.jamtong = { title: "청년 정책", url: "https://jamtong.kr/achievements/x" };
        c.links.people = [{ name: "홍길동", role: "장관", imtongUrl: "https://im.jamtong.kr/people/hong" }];
      }),
    ).toEqual([]);
  });

  it("새 게임 유형의 불변식", () => {
    const withGame = (game: Card["game"]) => broken((c) => (c.game = game));
    const claimIds = [CARDS[0].claims[0].id];
    expect(withGame({ type: "slider", question: "?", min: 1, max: 5, step: 1, unit: "회", answer: 9, claimIds })).toContainEqual(expect.stringContaining("범위 밖"));
    const items = [
      { id: "a", label: "A", value: "1" },
      { id: "b", label: "B", value: "2" },
      { id: "c", label: "C", value: "3" },
    ];
    expect(withGame({ type: "sort", question: "?", items, answerOrder: ["a", "b"], claimIds })).toContainEqual(expect.stringContaining("한 번씩"));
    expect(withGame({ type: "sort", question: "?", items, answerOrder: ["a", "b", "c"], claimIds })).toContainEqual(expect.stringContaining("처음 순서가 정답과 같다"));
    expect(
      withGame({ type: "budget", question: "?", total: 100, step: 10, items: [{ id: "a", label: "A", actual: 50 }, { id: "b", label: "B", actual: 40 }], claimIds }),
    ).toContainEqual(expect.stringContaining("항목 합"));
    expect(withGame({ type: "yes_no", question: "?", answer: true, note: "", claimIds: ["ghost"] })).toContainEqual(expect.stringContaining('없는 claim "ghost"'));
  });

  it("공개 카드가 정책 평가를 물으면 이유가 3개 이상", () => {
    const errors = broken((c) => {
      c.publishStatus = "published";
      c.flow.opinion = true;
      c.reasonOptions = [{ id: "one", label: "하나" }];
    });
    expect(errors).toContainEqual(expect.stringContaining("reasonOptions"));
  });

  it("revision version은 1부터 연속이어야 한다", () => {
    expect(broken((c) => (c.revisions[0].version = 2))).toContainEqual(expect.stringContaining("version은 1부터"));
  });

  it("공개하려면 비판·한계와 검증이 필요하다", () => {
    const errors = broken((c) => {
      c.publishStatus = "published";
      c.counterpoints = [];
      c.claims[0].verified = false;
    });
    expect(errors).toContainEqual(expect.stringContaining("counterpoints"));
    expect(errors).toContainEqual(expect.stringContaining("검증 전"));
  });
});
