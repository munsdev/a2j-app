import { beforeEach, describe, expect, it } from "vitest";
import { commit, getDoc, redoDoc, replaceDoc, undoDoc, update, useDocStore } from "./store";
import { emptyDoc, shape } from "./doc";

/* The store runs without localStorage in Node: storage reports not ok, everything else works in memory. */
beforeEach(() => {
  replaceDoc(emptyDoc());
  useDocStore.setState({ undoStack: [], redoStack: [] });
});

describe("document store", () => {
  it("makes one undo step per update and redoes it", () => {
    update((d) => void (d.profile.name = "Ada"));
    update((d) => void (d.profile.location = "Augsburg"));
    expect(undoDoc()).toBe(true);
    expect(getDoc().profile).toMatchObject({ name: "Ada", location: "" });
    expect(undoDoc()).toBe(true);
    expect(getDoc().profile.name).toBe("");
    expect(redoDoc()).toBe(true);
    expect(getDoc().profile.name).toBe("Ada");
  });

  it("folds quiet changes into the next step", () => {
    update((d) => void (d.assess.answers = { plan_1: 3 }), { quiet: true });
    update((d) => void (d.assess.answers!.plan_2 = 4), { quiet: true });
    commit();
    expect(useDocStore.getState().undoStack).toHaveLength(1);
    undoDoc();
    expect(getDoc().assess.answers).toBeUndefined();
  });

  it("does not record an unchanged document", () => {
    update(() => {});
    expect(useDocStore.getState().undoStack).toHaveLength(0);
  });

  it("clears redo after a new change", () => {
    update((d) => void (d.profile.name = "A"));
    undoDoc();
    update((d) => void (d.profile.name = "B"));
    expect(redoDoc()).toBe(false);
  });
});

describe("shape", () => {
  it("refuses other versions and fixes broken parts", () => {
    expect(shape({ version: 1, jobs: [{}] }).jobs).toEqual([]);
    const d = shape({
      version: 2,
      jobs: [{ title: "Baker", role: "nope" }],
      courses: [{ name: "x" }],
      mainGoal: "j9",
      assess: { ruledOut: ["shifts", "phone"] },
    });
    expect(d.jobs[0]).toMatchObject({ id: "j1", role: "maybe", org: "", when: "" });
    expect(d.courses[0]).toMatchObject({ id: "c1", goals: [], covers: [] });
    expect(d.mainGoal).toBeNull();
    expect(d.assess.ruledOut).toEqual(["phone", "nights", "earlylate"]);
  });
});
