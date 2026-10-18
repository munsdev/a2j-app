import { describe, expect, it } from "vitest";
import { extractJSON, parseLoose, stripComments, topObjects } from "./parse";

describe("reading an AI answer", () => {
  it("finds the JSON inside a code fence and the text around it", () => {
    const text = `Here are three courses:
1. Forklift licence – short and AZAV.

\`\`\`json
{"courses":[{"name":"Staplerschein","url":"https://example.org/a"}]}
\`\`\`
Good luck!`;
    expect(extractJSON(text)).toEqual({ courses: [{ name: "Staplerschein", url: "https://example.org/a" }] });
  });

  it("repairs trailing commas and comments", () => {
    const o = `{"courses":[{"name":"A", // the first
      "covers":["x",],}, /* none */],}`;
    expect(parseLoose(o)).toEqual({ courses: [{ name: "A", covers: ["x"] }] });
  });

  it("repairs smart quotes", () => {
    expect(parseLoose("{“name”: „Kurs“}")).toEqual({ name: "Kurs" });
  });

  it("joins lists from several blocks", () => {
    const text = `{"courses":[{"name":"A"}]} and later {"courses":[{"name":"B"}],"note":"x"}`;
    expect(extractJSON(text)).toEqual({ courses: [{ name: "A" }, { name: "B" }], note: "x" });
  });

  it("keeps German keys as written", () => {
    expect(extractJSON('Antwort: {"kurse":[{"name":"Lager"}]}')).toEqual({ kurse: [{ name: "Lager" }] });
    expect(extractJSON('{"stellen":[{"name":"Lagerist"}]}')).toEqual({ stellen: [{ name: "Lagerist" }] });
  });

  it("ignores braces and slashes inside strings", () => {
    expect(topObjects('x {"a":"}{"} y {"b":1}')).toEqual(['{"a":"}{"}', '{"b":1}']);
    expect(stripComments('{"url":"https://a.de/x"} // c')).toBe('{"url":"https://a.de/x"} \n');
    expect(extractJSON('{"url":"https://a.de/x", /* c */ "n":"\\"q\\""}')).toEqual({
      url: "https://a.de/x",
      n: '"q"',
    });
  });

  it("returns null when nothing parses", () => {
    expect(extractJSON("I cannot search the web.")).toBeNull();
    expect(extractJSON("{not json at all}")).toBeNull();
    expect(extractJSON(null)).toBeNull();
    expect(extractJSON('["a"]')).toBeNull();
  });
});
