import { describe, expect, it } from "vitest";
import examples from "@/data/examples.json";
import { shape } from "@/data/doc";
import type { Doc } from "@/data/types";
import { libText } from "./library";

const EX = (examples as unknown as { examples: Record<string, Record<string, unknown>> }).examples;
const doc = (): Doc => {
  const d = shape(structuredClone(EX.holmes.en));
  d.jobads = [
    { id: "a1", name: "Fraud analyst", org: "Bank AG", reqs: "Two years in investigations", goals: [] },
  ];
  return d;
};

describe("application prompts", () => {
  it("a cover letter quotes the chosen ad and never the person's name or contact", () => {
    const d = doc();
    const text = libText(d, null, "en", "cover", { ad: "Fraud analyst" });
    expect(text).toContain("Fraud analyst\nBank AG\nTwo years in investigations");
    expect(text).not.toContain(d.profile.name);
    if (d.profile.contact) expect(text).not.toContain(d.profile.contact);
  });
  it("without a saved ad, asks to paste one", () => {
    const d = doc();
    d.jobads = [];
    expect(libText(d, null, "de", "cover")).toContain("[Fügen Sie hier die Stellenanzeige ein.]");
  });
  it("a CV is for the chosen goal", () => {
    expect(libText(doc(), null, "en", "cv", { goal: "Fraud investigator" })).toContain(
      "for jobs as Fraud investigator in Germany",
    );
  });
});
