import { useEffect } from "react";
import { commit } from "./store";

/** Changes made quietly while on a screen (answers in a run, thumbs on skills, course wishes) become one undo
 *  step when the person leaves it, however they leave. */
export function useCommitOnLeave(): void {
  useEffect(() => () => commit(), []);
}
