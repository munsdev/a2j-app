import { describe, expect, it } from "vitest";
import { emptyDoc } from "@/data/doc";
import type { Doc } from "@/data/types";
import type { ContextKey, Onet } from "./catalog";
import { physicalOf, warnings } from "./rank";

/* One occupation with the given O*NET measures. */
function onet(c: Partial<Record<ContextKey, number>>): Onet {
  return {
    v: "test",
    r: [null],
    z: [null],
    q: [null],
    c: Object.fromEntries(Object.entries(c).map(([k, v]) => [k, [v]])) as Onet["c"],
  };
}
function doc(ruledOut: string[], setting: Record<string, number> = {}): Doc {
  const d = emptyDoc();
  d.assess = { ...d.assess, ruledOut, setting };
  return d;
}

describe("warnings from physical measures", () => {
  it("heavy lifting: ruled out, or a strong wish for desk work", () => {
    const O = onet({ strength: 43 });
    expect(warnings(doc(["lifting"]), O, 0)).toContain("w_lifting");
    expect(warnings(doc([], { physical: 1 }), O, 0)).toContain("w_lifting");
    expect(warnings(doc([], { physical: 2 }), O, 0)).not.toContain("w_lifting");
    expect(warnings(doc(["lifting"]), onet({ strength: 16 }), 0)).not.toContain("w_lifting");
  });
  it("heights and noise only when ruled out", () => {
    const O = onet({ heights: 85, noise: 88 });
    expect(warnings(doc([]), O, 0)).toEqual([]);
    expect(warnings(doc(["heights", "noise"]), O, 0)).toEqual(["w_heights", "w_noise"]);
    expect(warnings(doc(["heights", "noise"]), onet({ heights: 46, noise: 73 }), 0)).toEqual([]);
  });
  it("no data, no warning", () => {
    expect(warnings(doc(["lifting", "heights", "noise"]), onet({}), 0)).toEqual([]);
  });
});

describe("physicalOf", () => {
  it("is the mean of standing, bending and strength", () => {
    expect(physicalOf(onet({ standing: 90, hands: 60, strength: 30 }), 0)).toBeCloseTo(0.6);
    expect(physicalOf(onet({ standing: 40 }), 0)).toBeCloseTo(0.4);
    expect(physicalOf(onet({}), 0)).toBeNull();
  });
});
