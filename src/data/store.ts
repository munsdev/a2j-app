import { create } from "zustand";
import { produce, type Draft } from "immer";
import type { Doc } from "./types";
import { emptyDoc, shape } from "./doc";
import { fixRoutes } from "./routes";
import { storage } from "@/lib/storage";

/* =================== THE DOCUMENT STORE ===================
   One document per browser, saved to localStorage on every change.
   - update(fn) changes the document and makes one undo step.
   - update(fn, { quiet: true }) saves too, but folds into the next undo step. Use it between the questions
     of a run, so one Undo does not take back a single answer at a time.
   - Up to 60 undo steps, kept in memory only. */

export const DOC_KEY = "a2j:v2";
export const META_KEY = "a2j:meta";
export const OWN_KEY = "a2j:own";
const MAX_UNDO = 60;

export interface Meta {
  /** changes since the last backup */
  changes: number;
  /** time of the last backup (ms) */
  exported: number | null;
}

interface DocState {
  doc: Doc;
  undoStack: string[];
  redoStack: string[];
  /** false when this browser does not keep what we write (private mode, storage full) */
  storageOk: boolean;
  meta: Meta;
}

function loadDoc(): Doc {
  const raw = storage.get(DOC_KEY);
  if (raw)
    try {
      return shape(JSON.parse(raw));
    } catch {
      /* unreadable: start empty */
    }
  return emptyDoc();
}
function loadMeta(): Meta {
  const m: Meta = { changes: 0, exported: null };
  try {
    return { ...m, ...JSON.parse(storage.get(META_KEY) || "{}") };
  } catch {
    return m;
  }
}

const initial = loadDoc();
let last = JSON.stringify(initial);

export const useDocStore = create<DocState>(() => ({
  doc: initial,
  undoStack: [],
  redoStack: [],
  storageOk: storage.probe(),
  meta: loadMeta(),
}));

/** Read the document in a component. Prefer a narrow selector: useDoc(d => d.jobs). */
export function useDoc(): Doc;
export function useDoc<T>(select: (d: Doc) => T): T;
export function useDoc<T>(select?: (d: Doc) => T) {
  return useDocStore((s) => (select ? select(s.doc) : s.doc));
}
export const getDoc = (): Doc => useDocStore.getState().doc;

function persist(s: string): boolean {
  return storage.setChecked(DOC_KEY, s);
}
function bumpMeta(state: DocState): Meta {
  const meta = { ...state.meta, changes: state.meta.changes + 1 };
  storage.set(META_KEY, JSON.stringify(meta));
  return meta;
}

/** Change the document. The recipe gets an Immer draft: mutate it freely. */
export function update(recipe: (d: Draft<Doc>) => void, opts: { quiet?: boolean } = {}): void {
  const state = useDocStore.getState();
  /* routes and goals stay in step whatever the recipe changed (a whole new document was shaped already) */
  const next = produce(state.doc, (d) => {
    const out = recipe(d) as Doc | undefined;
    if (out === undefined) fixRoutes(d as Doc);
    return out;
  });
  if (next === state.doc && !opts.quiet) return commit();
  const s = JSON.stringify(next);
  if (opts.quiet) {
    useDocStore.setState({
      doc: next,
      storageOk: persist(s),
      meta: s === last ? state.meta : bumpMeta(state),
    });
    return;
  }
  if (s === last) {
    useDocStore.setState({ doc: next, storageOk: persist(s) });
    return;
  }
  const undoStack = [...state.undoStack, last].slice(-MAX_UNDO);
  last = s;
  useDocStore.setState({ doc: next, undoStack, redoStack: [], storageOk: persist(s), meta: bumpMeta(state) });
}

/** Close the current undo step: quiet changes since the last step become one step. */
export function commit(): void {
  const state = useDocStore.getState();
  const s = JSON.stringify(state.doc);
  if (s === last) return;
  const undoStack = [...state.undoStack, last].slice(-MAX_UNDO);
  last = s;
  useDocStore.setState({ undoStack, redoStack: [], storageOk: persist(s) });
}

/** Replace the whole document (restore a backup, open a sample, start over). One undo step. */
export function replaceDoc(doc: Doc): void {
  update(() => doc as Draft<Doc>);
}

function restore(s: string): void {
  last = s;
  const doc = shape(JSON.parse(s));
  useDocStore.setState((st) => ({ doc, storageOk: persist(s), meta: bumpMeta(st) }));
}
export function undoDoc(): boolean {
  commit();
  const { undoStack, redoStack } = useDocStore.getState();
  if (!undoStack.length) return false;
  const prev = undoStack[undoStack.length - 1];
  useDocStore.setState({ undoStack: undoStack.slice(0, -1), redoStack: [...redoStack, last] });
  restore(prev);
  return true;
}
export function redoDoc(): boolean {
  const { undoStack, redoStack } = useDocStore.getState();
  if (!redoStack.length) return false;
  const next = redoStack[redoStack.length - 1];
  useDocStore.setState({ redoStack: redoStack.slice(0, -1), undoStack: [...undoStack, last] });
  restore(next);
  return true;
}

/** Swap the document without an undo step and without counting it as a change: the same profile, presented
 *  differently (an unchanged sample following the interface language). */
export function replaceSilently(doc: Doc): void {
  const s = JSON.stringify(doc);
  last = s;
  useDocStore.setState({ doc, storageOk: persist(s) });
}

/** After a backup: nothing unsaved any more. */
export function markExported(): void {
  const meta: Meta = { changes: 0, exported: Date.now() };
  storage.set(META_KEY, JSON.stringify(meta));
  useDocStore.setState({ meta });
}
/** Restore a backup without counting it as a change to back up. */
export function resetChanges(): void {
  const meta: Meta = { ...useDocStore.getState().meta, changes: 0 };
  storage.set(META_KEY, JSON.stringify(meta));
  useDocStore.setState({ meta });
}
/** Forget the undo history (after deleting all data). */
export function clearHistory(): void {
  useDocStore.setState({ undoStack: [], redoStack: [] });
}
