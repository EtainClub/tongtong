import { describe, expect, it } from "vitest";

import { applyState, classify, mainCategory, normalize, queryCodes, sidoOfAgency, type YouthcenterPolicy } from "./regional";

const seoulAll = ["11110", "11140", "11440", "11500"].join(",");
const policy = (patch: Partial<YouthcenterPolicy>): YouthcenterPolicy => ({ plcyNo: "p1", plcyNm: "정책", zipCd: seoulAll, rgtrInstCdNm: "서울특별시", ...patch });

describe("queryCodes", () => {
  it("시·군·구를 고르면 그 코드, 일반구가 있는 시면 일반구 코드들", () => {
    expect(queryCodes("11", "11440")).toEqual(["11440"]);
    expect(queryCodes("41", "41110")).toEqual(["41111", "41113", "41115", "41117"]); // 수원시
  });
  it("시·도만 고르면 그 시·도의 시·군·구 하나, 시·군·구가 없으면 시·도 코드", () => {
    expect(queryCodes("11")).toEqual(["11110"]);
    expect(queryCodes("36")).toEqual(["36110"]); // 세종
  });
});

describe("classify", () => {
  it("여러 시·도에 걸치면 전국 정책 — 뺀다", () => {
    expect(classify(policy({ zipCd: "11440,26110" }), "11", ["11440"], true)).toBeNull();
  });
  it("시·도 안의 여러 코드면 시·도 전체, 고른 시·군·구 코드만이면 그 시·군·구", () => {
    expect(classify(policy({}), "11", ["11440"], true)).toBe("sido");
    expect(classify(policy({ zipCd: "11440" }), "11", ["11440"], true)).toBe("district");
  });
  it("시·도만 골랐으면 한 시·군·구만의 정책은 빼고 시·도 전체만", () => {
    expect(classify(policy({ zipCd: "11110" }), "11", ["11110"], false)).toBeNull();
    expect(classify(policy({}), "11", ["11110"], false)).toBe("sido");
  });
  it("등록기관의 시·도가 다르면 섞인 데이터라 뺀다 — 옛 이름도 알아본다", () => {
    expect(classify(policy({ rgtrInstCdNm: "전라남도 목포시 미래전략산업국" }), "11", ["11440"], true)).toBeNull();
    expect(sidoOfAgency("광주광역시")).toBe("12");
    expect(classify(policy({ zipCd: "12330,12110", rgtrInstCdNm: "광주광역시" }), "12", ["12330"], true)).toBe("sido");
  });
  it("세종처럼 시·군·구가 없는 시·도는 코드 하나가 곧 시·도 전체", () => {
    expect(classify(policy({ zipCd: "36110", rgtrInstCdNm: "세종특별자치시" }), "36", ["36110"], false)).toBe("sido");
  });
});

describe("normalize", () => {
  it("신청 기간·상시·나이·링크·수정일을 화면 모양으로", () => {
    const p = normalize(
      policy({
        plcyExplnCn: "  청년  이사비를\n지원  ",
        lclsfNm: "주거",
        mclsfNm: "전월세 및 주거급여 지원",
        sprtTrgtMinAge: "19",
        sprtTrgtMaxAge: "39",
        aplyYmd: "20260401 ~ 20260414",
        aplyUrlAddr: "",
        refUrlAddr1: "https://youth.seoul.go.kr",
        lastMdfcnDt: "2026-06-25 13:21:39",
      }),
      "sido",
    );
    expect(p).toMatchObject({
      summary: "청년 이사비를 지원",
      category: "주거",
      subcategory: "전월세 및 주거급여 지원",
      age: { min: 19, max: 39 },
      apply: { kind: "period", start: "2026-04-01", end: "2026-04-14" },
      url: "https://youth.seoul.go.kr",
      updatedAt: "2026-06-25",
    });
    expect(normalize(policy({ aplyPrdSeCd: "0057002", sprtTrgtMinAge: "0", sprtTrgtMaxAge: "0" }), "sido")).toMatchObject({ apply: { kind: "always" }, age: null });
    // 1·99·100세는 '제한 없음' 자리 채움 값이다.
    expect(normalize(policy({ sprtTrgtMinAge: "1", sprtTrgtMaxAge: "100" }), "sido").age).toBeNull();
    expect(normalize(policy({ sprtTrgtMinAge: "19", sprtTrgtMaxAge: "99" }), "sido").age).toEqual({ min: 19, max: 0 });
    expect(normalize(policy({ aplyUrlAddr: "javascript:alert(1)" }), "sido").url).toBeNull();
  });

  it("분야 — 지자체마다 다르게 적은 대분류를 다섯으로 모은다", () => {
    expect(mainCategory("교육")).toBe("교육·직업훈련");
    expect(mainCategory("교육･직업훈련,교육･직업훈련")).toBe("교육·직업훈련");
    expect(mainCategory("복지문화")).toBe("금융·복지·문화");
    expect(mainCategory("참여권리,참여권리")).toBe("참여·기반");
    expect(mainCategory("일자리,교육")).toBe("일자리");
  });

  it("신청 상태는 날짜로", () => {
    const p = normalize(policy({ aplyYmd: "20261001 ~ 20261015" }), "sido");
    expect(applyState(p, "2026-09-30")).toBe("upcoming");
    expect(applyState(p, "2026-10-07")).toBe("open");
    expect(applyState(p, "2026-10-15")).toBe("open");
    expect(applyState(p, "2026-10-16")).toBe("closed");
  });
});
