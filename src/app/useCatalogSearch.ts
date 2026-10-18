import { useDeferredValue, useMemo } from "react";
import { type Esco, searchOcc, searchSkill } from "@/domain/catalog";

/* Search-as-you-type over the catalogue (3,039 occupations, 13,934 skills; 10–20 ms per scan on a laptop,
   several times that on a phone). The search runs on a deferred copy of the text, so typing stays responsive,
   is memoised, and starts at two characters. */

export function useOccSearch(E: Esco | null, text: string, n = 8): number[] {
  const q = useDeferredValue(text.trim());
  return useMemo(() => (E && q.length > 1 ? searchOcc(E, q, n) : []), [E, q, n]);
}
export function useSkillSearch(E: Esco | null, text: string, n = 8): number[] {
  const q = useDeferredValue(text.trim());
  return useMemo(() => (E && q.length > 1 ? searchSkill(E, q, n) : []), [E, q, n]);
}
