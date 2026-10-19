import { describe, expect, it } from "vitest";
import { produce } from "immer";
import type { Doc } from "./types";
import { emptyDoc, shape } from "./doc";
import {
  addRoute,
  courseForJob,
  currentRoute,
  fillRouteCourse,
  fixRoutes,
  removeRoute,
  setRoute,
  switchToJob,
} from "./routes";

/* A small document: three jobs, three courses. */
function doc(): Doc {
  const d = emptyDoc();
  d.jobs = [
    { id: "j1", title: "Fraud investigator", occ: 1, role: "goal", org: "", when: "" },
    { id: "j2", title: "Data analyst", occ: 2, role: "maybe", org: "", when: "" },
    { id: "j3", title: "Lab technician", occ: 3, role: "maybe", org: "", when: "" },
    { id: "j4", title: "Clerk", occ: 4, role: "maybe", org: "", when: "" },
  ];
  d.courses = [
    { id: "c1", name: "SQL", goals: ["j1", "j2"], covers: [10] },
    { id: "c2", name: "IHK", goals: ["j1"], covers: [11, 12, 13] },
    { id: "c3", name: "Lab", goals: ["j3"], covers: [] },
  ];
  d.mainGoal = "j1";
  return d;
}
const change = (d: Doc, fn: (d: Doc) => void): Doc =>
  produce(d, (x) => {
    fn(x as Doc);
    fixRoutes(x as Doc);
  });

describe("routes", () => {
  it("a document without routes gets one per goal, with the course saved for it that covers most", () => {
    const d = shape(JSON.parse(JSON.stringify({ ...doc(), routes: undefined, route: undefined })));
    expect(d.routes).toEqual([{ id: "A", job: "j1", course: "c2" }]);
    expect(d.route).toBe("A");
    expect(currentRoute(d)?.job).toBe("j1");
  });

  it("only the route's course counts for its job", () => {
    let d = shape(doc());
    expect(courseForJob(d, "j1")?.id).toBe("c2");
    d = change(d, (x) => void addRoute(x, "j1", "c1"));
    expect(d.routes.map((r) => [r.id, r.job, r.course])).toEqual([
      ["A", "j1", "c2"],
      ["B", "j1", "c1"],
    ]);
    /* on route B the same job counts the SQL course instead */
    d = change(d, (x) => void (x.route = "B"));
    expect(courseForJob(d, "j1")?.id).toBe("c1");
    expect(d.mainGoal).toBe("j1");
  });

  it("keeps three at most, never the same route twice, and letters stay put", () => {
    let d = shape(doc());
    d = change(d, (x) => {
      expect(addRoute(x, "j2")).toBe("B");
      expect(addRoute(x, "j3")).toBe("C");
      expect(addRoute(x, "j4")).toBeNull();
      expect(addRoute(x, "j2", "c1")).toBe("B");
    });
    expect(d.jobs.find((j) => j.id === "j4")?.role).toBe("maybe");
    d = change(d, (x) => removeRoute(x, "B"));
    expect(d.routes.map((r) => r.id)).toEqual(["A", "C"]);
    expect(d.jobs.find((j) => j.id === "j2")?.role).toBe("maybe");
    d = change(d, (x) => void addRoute(x, "j4"));
    expect(d.routes.map((r) => r.id)).toEqual(["A", "C", "B"]);
  });

  it("a goal made elsewhere gets a route; with no room it goes back to the shortlist", () => {
    let d = shape(doc());
    d = change(d, (x) => void (x.jobs[1].role = "goal"));
    expect(d.routes.map((r) => r.job)).toEqual(["j1", "j2"]);
    d = change(d, (x) => {
      addRoute(x, "j3");
      x.jobs[3].role = "goal";
    });
    expect(d.routes.length).toBe(3);
    expect(d.jobs[3].role).toBe("maybe");
  });

  it("removing a job or its goal takes its routes; a deleted course leaves the route without one", () => {
    let d = shape(doc());
    d = change(d, (x) => void addRoute(x, "j2", "c1"));
    d = change(d, (x) => void (x.courses = x.courses.filter((c) => c.id !== "c1")));
    expect(d.routes.find((r) => r.id === "B")?.course).toBeNull();
    d = change(d, (x) => void (x.jobs = x.jobs.filter((j) => j.id !== "j1")));
    expect(d.routes.map((r) => r.id)).toEqual(["B"]);
    expect(d.route).toBe("B");
    expect(d.mainGoal).toBe("j2");
  });

  it("changing a route's job sends the old one back to the shortlist; a duplicate is refused", () => {
    let d = shape(doc());
    d = change(d, (x) => void addRoute(x, "j2", "c1"));
    d = change(d, (x) => expect(setRoute(x, "B", "j1", "c2")).toBe(false));
    d = change(d, (x) => expect(setRoute(x, "A", "j3", null)).toBe(true));
    expect(d.jobs.find((j) => j.id === "j1")?.role).toBe("maybe");
    expect(d.jobs.find((j) => j.id === "j3")?.role).toBe("goal");
  });

  it("a route without a course takes the next one saved for its job", () => {
    let d = shape(doc());
    d = change(d, (x) => void addRoute(x, "j3", null));
    d = change(d, (x) => fillRouteCourse(x, "c3", "j3"));
    expect(d.routes.find((r) => r.job === "j3")?.course).toBe("c3");
    d = change(d, (x) => expect(switchToJob(x, "j3")).toBe(true));
    expect(d.route).toBe("B");
  });
});
