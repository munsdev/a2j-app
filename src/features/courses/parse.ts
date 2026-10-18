/* Reading an AI answer: find every top-level {...} in the text and parse what can be parsed.
   AI chats wrap JSON in code fences, add trailing commas and comments, curl the quotes, or split the answer
   into several blocks. Pure functions, ported from the previous app. */

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export type JsonObject = { [k: string]: Json };

/** Remove // and block comments outside of strings. */
export function stripComments(t: string): string {
  let out = "";
  let inS = false;
  let bs = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inS) {
      out += c;
      if (bs) bs = false;
      else if (c === "\\") bs = true;
      else if (c === '"') inS = false;
      continue;
    }
    if (c === '"') {
      inS = true;
      out += c;
      continue;
    }
    if (c === "/" && t[i + 1] === "/") {
      while (i < t.length && t[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (c === "/" && t[i + 1] === "*") {
      i += 2;
      while (i < t.length && !(t[i] === "*" && t[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += c;
  }
  return out;
}

/** Every balanced top-level {...} in a text, braces inside strings ignored. */
export function topObjects(t: string): string[] {
  const objs: string[] = [];
  let depth = 0;
  let start = -1;
  let inS = false;
  let bs = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inS) {
      if (bs) bs = false;
      else if (c === "\\") bs = true;
      else if (c === '"') inS = false;
      continue;
    }
    if (c === '"') {
      if (depth > 0) inS = true;
      continue;
    }
    if (c === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (c === "}" && depth > 0) {
      depth--;
      if (depth === 0) objs.push(t.slice(start, i + 1));
    }
  }
  return objs;
}

/** Parse JSON as written, then without comments and trailing commas, then with straight quotes. */
export function parseLoose(o: string): Json | null {
  const fixed = stripComments(o).replace(/,\s*([}\]])/g, "$1");
  for (const s of [o, fixed, fixed.replace(/[“”„]/g, '"')]) {
    try {
      return JSON.parse(s) as Json;
    } catch {
      /* try the next repair */
    }
  }
  return null;
}

/** All objects in a text merged into one; lists under the same key are joined. Null when nothing parses. */
export function extractJSON(text: unknown): JsonObject | null {
  let data: JsonObject | null = null;
  topObjects(String(text || "")).forEach((o) => {
    const d = parseLoose(o);
    if (d && typeof d === "object" && !Array.isArray(d)) {
      const acc: JsonObject = (data ??= {});
      Object.keys(d).forEach((k) => {
        const a = acc[k];
        const b = d[k];
        if (Array.isArray(a) && Array.isArray(b)) acc[k] = a.concat(b);
        else acc[k] = b;
      });
    }
  });
  return data;
}

/** A field value as text: lists joined, objects dropped. */
export const str = (v: Json | undefined): string =>
  v == null ? "" : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? "" : String(v).trim();
