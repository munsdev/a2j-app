import { describe, expect, it } from "vitest";
import { defineStrings, makeT } from "./index";

const a = defineStrings({ only_a: "A {x}" }, { only_a: "A-de {x}" });
const b = defineStrings({ only_b: "B" }, { only_b: "B-de" });

describe("makeT", () => {
  it("accepts the keys of every dictionary and the shared ones", () => {
    const t = makeT("de", a, b);
    expect(t("only_a", { x: 1 })).toBe("A-de 1");
    expect(t("only_b")).toBe("B-de");
    expect(t("save")).toBe("Speichern");
  });
});
