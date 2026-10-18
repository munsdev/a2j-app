import type { Doc, Lang } from "./types";
import { shape } from "./doc";

/* Sample profiles: fictional and public-domain characters, each filling every part of the app.
   Loaded on demand (about 40 KB), so they never slow down the first visit. */

export type ExampleId = "holmes" | "robin" | "geppetto";
export const EXAMPLE_IDS: readonly ExampleId[] = ["holmes", "robin", "geppetto"];

interface ExampleFile {
  pick: Record<ExampleId, Record<Lang, string>>;
  examples: Record<ExampleId, Record<Lang, unknown>>;
}
let file: ExampleFile | null = null;
let loading: Promise<ExampleFile> | null = null;

export function loadExamples(): Promise<ExampleFile> {
  if (file) return Promise.resolve(file);
  /* a failed chunk load (offline before the service worker is ready) is tried again next time */
  loading ??= import("./examples.json")
    .then((m) => (file = m.default as unknown as ExampleFile))
    .catch((e: unknown) => {
      loading = null;
      throw e;
    });
  return loading;
}
/** The examples, when already loaded (call loadExamples first). */
export const examplesLoaded = (): ExampleFile | null => file;

/** A sample as a document in a language. */
export function exampleDoc(id: string, lang: Lang): Doc {
  if (!file) throw new Error("examples not loaded");
  const ex = file.examples[(EXAMPLE_IDS as readonly string[]).includes(id) ? (id as ExampleId) : "holmes"];
  return { ...shape(structuredClone(ex[lang] ?? ex.en)), example: id };
}
/** One line on who the sample is. */
export const examplePick = (id: ExampleId, lang: Lang): string => file?.pick[id][lang] ?? "";
export const exampleName = (id: ExampleId, lang: Lang): string =>
  file ? String((file.examples[id][lang] as Doc).profile.name) : "";
