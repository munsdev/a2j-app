/* The document: everything a person enters, saved in their browser. Format version 2.
   One list of jobs (done, goal, maybe), skill ratings as the only record of what someone can do,
   courses and job ads linked to the goals they count for. Backups are this object as JSON. */

export type Lang = "en" | "de";
export const LANGS: readonly Lang[] = ["en", "de"];

/** A catalogue skill (ESCO index) or a skill in the person's own words. */
export type SkillRef = number | string;

export type JobRole = "done" | "goal" | "maybe";

export interface Job {
  id: string;
  title: string;
  /** ESCO occupation index; -1 = not in the catalogue; null = not matched yet. */
  occ: number | null;
  role: JobRole;
  org: string;
  when: string;
  current?: boolean;
  /** Needs outside the catalogue, shown as extra tiles. */
  extra?: string[];
  /** The match was made automatically (the person did not pick it). */
  auto?: boolean;
}

export type GermanLevel = "native" | "c" | "b2" | "b1" | "a2" | "a1" | "unknown";
export type ComputerLevel = "low" | "basic" | "daily" | "work";
export type Situation = "employed" | "seeking" | "training" | "returning" | "other";
export type Hours = "full" | "part" | "flex";
export type Place = "onsite" | "hybrid" | "remote" | "any";

export interface CoursePrefs {
  lang: "de" | "en" | "any";
  where: "near" | "online" | "any";
  time: "full" | "part" | "eve" | "any";
  start: "soon" | "6" | "any";
  voucher: boolean;
}

export interface Profile {
  name: string;
  location: string;
  languages: string;
  contact: string;
  german: GermanLevel | "";
  computer: ComputerLevel | "";
  situation: Situation | "";
  current: string;
  want: string;
  avoid: string;
  hours: Hours | "";
  place: Place | "";
  limits: string;
  hobbies: string;
  projects: string;
  coursePrefs: CoursePrefs | null;
}
export const PROFILE_KEYS = [
  "name",
  "location",
  "languages",
  "contact",
  "german",
  "computer",
  "situation",
  "current",
  "want",
  "avoid",
  "hours",
  "place",
  "limits",
  "hobbies",
  "projects",
] as const satisfies readonly (keyof Profile)[];

export interface OwnSkill {
  name: string;
  level: number;
  /** linked catalogue skill, when the words match one */
  esco?: number;
}

/** A reaction to an occupation: thumbs on the job (d), on single skills (sk) and on work conditions (ctx). */
export interface Vote {
  o: number;
  d: 1 | 0 | -1;
  sk: [number, 1 | -1][];
  ctx?: [string, 1 | -1][];
}

export interface EscoState {
  /** skill index → level 0..5 */
  rated: Record<string, number>;
  own: OwnSkill[];
  /** skill index → 1 (want more) or -1 (want less) */
  want: Record<string, 1 | -1>;
  votes: Vote[];
  hidden: number[];
  /** the skill deck also shows optional skills */
  more: boolean;
}

export type PartKey = "apt" | "int" | "set" | "val" | "story" | "skills";

export interface Assess {
  /** item id (e.g. "plan_1", "R_2") → 1..5 */
  answers?: Record<string, number>;
  /** aptitude id → level the person set by hand */
  adjusted?: Record<string, number>;
  /** setting id → 1..5 */
  setting?: Record<string, number>;
  ruledOut?: string[];
  /** up to three work value ids, in order */
  values?: string[];
  /** part → ISO date it was finished */
  done?: Partial<Record<PartKey, string>>;
}

export type ItemStatus = "interested" | "contacted" | "applied" | "rejected" | "accepted";

export interface Course {
  id: string;
  name: string;
  provider?: string;
  url?: string;
  start?: string;
  length?: string;
  schedule?: string;
  format?: string;
  language?: string;
  price?: string;
  funding?: string;
  cert?: string;
  notes?: string;
  /** "provider" = the provider says it is AZAV-certified; never shown as verified */
  azav?: "provider" | "no" | "";
  goals: string[];
  covers: SkillRef[];
  status?: ItemStatus;
  source?: "hand" | "ai" | "sample";
}

export interface JobAd {
  id: string;
  name: string;
  org?: string;
  place?: string;
  url?: string;
  deadline?: string;
  hours?: string;
  pay?: string;
  reqs?: string;
  notes?: string;
  goals: string[];
  status?: ItemStatus;
  source?: "hand" | "ai" | "sample";
}

export type PlanSection =
  "head" | "goal" | "strengths" | "skills" | "gaps" | "course" | "evidence" | "other" | "next";

export interface Summary {
  lang?: Lang;
  /** the app language the page language was last set for */
  langFor?: Lang;
  goal?: string;
  course?: string;
  courseFor?: string;
  inc?: Partial<Record<PlanSection, boolean>>;
  why?: string;
  /** the suggested "why" text, so an unedited suggestion keeps up with the profile */
  whyAuto?: string;
  other?: string;
  next?: string;
}

/** A way to a job: one job (a goal) and the one course that gets you there (null: none picked yet).
 *  Up to three, named by their letter. The person is always on one of them (Doc.route). */
export type RouteId = "A" | "B" | "C";
export const ROUTE_IDS: readonly RouteId[] = ["A", "B", "C"];
export interface Route {
  id: RouteId;
  /** a job with role "goal" */
  job: string;
  course: string | null;
}

export interface Doc {
  app: "a2j";
  version: 2;
  profile: Profile;
  jobs: Job[];
  /** the job of the route the person is on (kept for older app versions reading a backup) */
  mainGoal: string | null;
  routes: Route[];
  /** the route the person is on */
  route: RouteId | null;
  esco: EscoState;
  assess: Assess;
  courses: Course[];
  jobads: JobAd[];
  summary: Summary;
  seen: Record<string, unknown>;
  /** id of the sample profile when one is open */
  example?: string;
  /** date of the backup, in exported files */
  saved?: string;
}
