import { describe, expect, it } from "vitest";

import { CARDS, policyOf } from "./cards";
import { RAW_CARDS } from "./cards/raw";
import { ALL_POLICIES } from "./policies";
import {
  cardExperienceSchema,
  cardVersion,
  policySchema,
  resolveCard,
  validateCard,
  validatePolicies,
  validatePolicy,
  type Card,
  type Planning,
  type Policy,
} from "./schema";

/** 통과하는 항목 하나를 복제해 한 군데씩 망가뜨린다. */
function brokenPolicy(mutate: (policy: Policy) => void): string[] {
  const policy = structuredClone(ALL_POLICIES[0]);
  mutate(policy);
  return validatePolicy(policy);
}

/** 통과하는 카드와 그 항목을 복제해 한 군데씩 망가뜨린다. */
function brokenCard(mutate: (card: Card, policy: Policy) => void): string[] {
  const card = structuredClone(CARDS[0]);
  const policy = structuredClone(policyOf(card.id));
  mutate(card, policy);
  return validateCard(card, policy);
}

const planning = (patch: Partial<Planning> = {}): Planning => ({
  roles: ["asset"],
  recurrence: { kind: "annual", claimIds: [ALL_POLICIES[0].claims[0].id] },
  exclusiveWith: [],
  after: [],
  stages: [],
  ...patch,
});

/** 항목 사이 관계 검사용 — 실제 항목 둘에 planning만 붙인다. */
function pair(a: Partial<Planning>, b: Partial<Planning>): Policy[] {
  const [first, second] = structuredClone(ALL_POLICIES.slice(0, 2));
  const claim = (p: Policy) => p.claims[0].id;
  first.planning = { ...planning(a), recurrence: { kind: "annual", claimIds: [claim(first)] } };
  second.planning = { ...planning(b), recurrence: { kind: "annual", claimIds: [claim(second)] } };
  return [first, second];
}

describe("실제 콘텐츠", () => {
  it("항목이 모두 불변식을 통과한다", () => {
    for (const policy of ALL_POLICIES) expect(validatePolicy(policy), policy.id).toEqual([]);
    expect(validatePolicies(ALL_POLICIES)).toEqual([]);
  });

  it("카드가 모두 불변식을 통과한다", () => {
    for (const card of CARDS) expect(validateCard(card, policyOf(card.id)), card.id).toEqual([]);
  });
});

describe("policySchema", () => {
  it("근거 없는 claim을 막는다", () => {
    const policy = structuredClone(ALL_POLICIES[0]);
    policy.claims[0].sourceIds = [];
    expect(policySchema.safeParse(policy).success).toBe(false);
  });
});

describe("cardExperienceSchema", () => {
  it("카드는 claim을 갖지 않는다 — 사실은 항목에만", () => {
    const raw = { ...(RAW_CARDS[0] as object), claims: ALL_POLICIES[0].claims };
    expect(cardExperienceSchema.safeParse(raw).success).toBe(false);
  });
});

describe("resolveCard", () => {
  const policy = ALL_POLICIES[0];
  const experience = cardExperienceSchema.parse(RAW_CARDS[0]);

  it("항목의 사실과 카드 경험을 합친다", () => {
    const card = resolveCard(policy, experience);
    expect(card.id).toBe(policy.id);
    expect(card.shortTitle).toBe(policy.name);
    expect(card.claims).toBe(policy.claims);
    expect(card.hook).toBe(experience.hook);
    expect(card).not.toHaveProperty("planning");
    expect(card).not.toHaveProperty("policyId");
  });

  it("카드 버전은 항목의 개정 이력을 따른다", () => {
    const revised = structuredClone(policy);
    revised.revisions.push({ version: 2, date: "2026-10-01", material: true, summary: "개정", claimIds: [] });
    expect(cardVersion(resolveCard(revised, experience))).toBe(2);
  });

  it("다른 항목에 붙이면 멈춘다", () => {
    expect(() => resolveCard(ALL_POLICIES[1], experience)).toThrow();
  });
});

describe("validatePolicy", () => {
  it("없는 source를 가리키는 claim", () => {
    expect(brokenPolicy((p) => (p.claims[0].sourceIds = ["nowhere"]))).toContainEqual(expect.stringContaining('없는 source "nowhere"'));
  });

  it("CLAIM은 누구의 주장인지 밝혀야 한다", () => {
    expect(brokenPolicy((p) => (p.claims[0].assertionType = "CLAIM"))).toContainEqual(expect.stringContaining("assertedBy"));
  });

  it("자매 서비스 링크는 그 서비스 주소여야 한다", () => {
    const errors = brokenPolicy((p) => {
      p.links.jamtong = { title: "다른 곳", url: "https://example.com/policy" };
      p.links.people = [{ name: "홍길동", role: "장관", imtongUrl: "https://jamtong.kr/people/hong" }];
    });
    expect(errors).toContainEqual(expect.stringContaining("jamtong.kr 주소"));
    expect(errors).toContainEqual(expect.stringContaining("홍길동"));
    expect(
      brokenPolicy((p) => {
        p.links.jamtong = { title: "청년 정책", url: "https://jamtong.kr/achievements/x" };
        p.links.people = [{ name: "홍길동", role: "장관", imtongUrl: "https://im.jamtong.kr/people/hong" }];
      }),
    ).toEqual([]);
  });

  it("revision version은 1부터 연속이어야 한다", () => {
    expect(brokenPolicy((p) => (p.revisions[0].version = 2))).toContainEqual(expect.stringContaining("version은 1부터"));
  });

  it("공개하려면 claim이 모두 검증되어야 한다", () => {
    const errors = brokenPolicy((p) => {
      p.publishStatus = "published";
      p.claims[0].verified = false;
    });
    expect(errors).toContainEqual(expect.stringContaining("검증 전"));
  });

  it("카드 없는 항목은 비판·한계 없이도 공개할 수 있다", () => {
    expect(brokenPolicy((p) => (p.counterpoints = []))).toEqual([]);
  });

  it("planning 값은 있는 claim을 근거로 삼는다", () => {
    const errors = brokenPolicy((p) => (p.planning = planning({ age: { max: 34, claimIds: ["ghost"] } })));
    expect(errors).toContainEqual(expect.stringContaining('planning.age → 없는 claim "ghost"'));
  });

  it("planning 나이 범위가 거꾸로면 오류", () => {
    const claimIds = [ALL_POLICIES[0].claims[0].id];
    expect(brokenPolicy((p) => (p.planning = planning({ age: { min: 35, max: 19, claimIds } })))).toContainEqual(expect.stringContaining("min이 max보다"));
    expect(brokenPolicy((p) => (p.planning = planning({ age: { claimIds } })))).toContainEqual(expect.stringContaining("min과 max 중 하나"));
  });

  it("planning이 자기 자신을 가리키면 오류", () => {
    const self = { policyId: ALL_POLICIES[0].id, claimIds: [ALL_POLICIES[0].claims[0].id] };
    expect(brokenPolicy((p) => (p.planning = planning({ after: [self] })))).toContainEqual(expect.stringContaining("자기 자신"));
  });
});

describe("validatePolicies", () => {
  const [a, b] = ALL_POLICIES.slice(0, 2);
  const link = (target: Policy, from: Policy) => ({ policyId: target.id, claimIds: [from.claims[0].id] });

  it("함께 받을 수 없는 정책은 양쪽에 적는다", () => {
    expect(validatePolicies(pair({ exclusiveWith: [link(b, a)] }, {}))).toContainEqual(expect.stringContaining(`${b.id}에도 ${a.id}를 적어야`));
    expect(validatePolicies(pair({ exclusiveWith: [link(b, a)] }, { exclusiveWith: [link(a, b)] }))).toEqual([]);
  });

  it("없는 항목을 가리키면 오류", () => {
    const errors = validatePolicies(pair({ after: [{ policyId: "nowhere", claimIds: [a.claims[0].id] }] }, {}));
    expect(errors).toContainEqual(expect.stringContaining('없는 항목 "nowhere"'));
  });

  it("선행 조건이 돌면 오류", () => {
    expect(validatePolicies(pair({ after: [link(b, a)] }, { after: [link(a, b)] }))).toContainEqual(expect.stringContaining("순환"));
    expect(validatePolicies(pair({ after: [link(b, a)] }, {}))).toEqual([]);
  });

  it("항목 id가 겹치면 오류", () => {
    expect(validatePolicies([a, a])).toContainEqual(expect.stringContaining("항목 id 중복"));
  });
});

describe("validateCard", () => {
  it("게임 정답이 없는 claim을 가리키면 오류", () => {
    const errors = brokenCard((c) => {
      if (c.game.type !== "eligibility") c.game.claimIds = ["ghost"];
    });
    expect(errors).toContainEqual(expect.stringContaining('없는 claim "ghost"'));
  });

  it("금액 게임 정답이 슬라이더 범위 밖이면 오류", () => {
    const errors = brokenCard((c) => {
      if (c.game.type === "guess_amount") c.game.max = 1_000_000;
    });
    expect(errors).toContainEqual(expect.stringContaining("범위 밖"));
  });

  it("새 게임 유형의 불변식", () => {
    const withGame = (game: Card["game"]) => brokenCard((c) => (c.game = game));
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
    const errors = brokenCard((c) => {
      c.publishStatus = "published";
      c.flow.opinion = true;
      c.reasonOptions = [{ id: "one", label: "하나" }];
    });
    expect(errors).toContainEqual(expect.stringContaining("reasonOptions"));
  });

  it("공개하려면 비판·한계가 필요하다", () => {
    const errors = brokenCard((c) => {
      c.publishStatus = "published";
      c.counterpoints = [];
    });
    expect(errors).toContainEqual(expect.stringContaining("counterpoints"));
  });

  it("항목이 초안이면 카드를 공개할 수 없다", () => {
    const errors = brokenCard((c, p) => {
      c.publishStatus = "published";
      p.publishStatus = "draft";
    });
    expect(errors).toContainEqual(expect.stringContaining("초안이다"));
  });
});
