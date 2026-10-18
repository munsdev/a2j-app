# Redesign: Profile, Goals, Plan

BUILD PLAN · 17 October 2026 · branch `ccr-fdd618a7-k269hr`

**STATUS · 17 October 2026:** built in one pass on this branch, steps 1 to 8. Computers: two or three idea cards side by side, Goals and the job page in two columns, Home stages in a row, wider pages. Open: German copy review of the new strings, the name, and checks on real phones.

The app works; it is too complicated to use. This plan turns six tabs into three stages, replaces the radial map with job cards and a progress board, and folds course search into the goal it belongs to. It records the decisions made in review so the rebuild can be done in one pass.

Design references (private, ask Casey for access): the three-stage overview, the goal chart mock-up and the concepts canvas (quilt, bingo, board game).

---

## 1 · DECISIONS

### Agreed in review, 16 and 17 October 2026

**Structure**

- Three tabs: **Profile · Goals · Plan** (German: **Profil · Ziele · Plan**). Home stays behind the logo.
- The radial skill map is removed. No skill map of any kind replaces it as a destination.
- Old hash links (`#cards`, `#map`, `#paths`, `#saved`) need no redirects, and old backups need no migration; the app has not been in real use.
- Built in **one clean pass** (section 3): new views on a new data model, reusing the logic that works.
- Name: **From A to Job**, address **a2j.app**, short name **A2J** (set up 17 October). Always shown together, since "A2J" alone also means "access to justice". Brand and address live in `BRAND` and `SITE` in `i18n.js`.

**Home**

- Understandable without explanation: one sentence on what you get, three rows (Profile, Goals, Plan) that fill with results as you go, one Continue button.
- The progress board for the main goal sits on Home once there is one; before that, a single **?** tile: "Pick a job to aim for".
- Install card only after Profile is started; privacy line once, short.

**Profile**

- One guided sequence: How you work, What you enjoy, Where you want to work (one row per screen), What matters, Your story, Your skills (the card deck).
- Jobs are typed once, in Your story; the catalogue match shows as you type. Skills step 1 ("Your jobs in the catalogue") goes.
- Results page leads with the summary (top strengths, interest code, setting, values, skills); all 15 aptitudes behind "Show all".

**Goals**

- **Job cards**, one per job. Front: title, one line of what you do, and **one match score (0–100) with its two reasons**: a ring with the score and its band (Strong / Good / Partial / Low match) plus a one-line summary, then Interests and Skills as labelled bars ("4 of 15 core skills · +4 with your courses"). On the main goal, once a saved course covers something: "Low match today · Rises to 45, partial match, with your courses". Lists (shortlist, compare) show it compactly: a small ink score square and "Partial match · Interests 59 · Skills 3". Back: the job's skills as stamped tiles, sorted have → course covers → to learn. No bingo-row rule.
- **Action bar** at the bottom on phones, under the card on computers: 👎 · See skills · 👍.
- After 👍 or 👎 the card shows its back in **rating mode**: the skills as rows, each with two buttons, "I like this" and "Rather not" (pressing the pressed one clears it); the bar becomes Undo · Next. Rating single skills is optional. There is no third card side.
- 👍 puts a job on the **shortlist**. **Make this my goal** is a separate action.
- **Compare** (the quilt): up to 3 shortlisted jobs side by side, only the skills those jobs need, check for have, accent for "a saved course covers this".
- **One main goal** drives the board, the courses and the Plan. Other goals may exist and are marked on their cards.
- **Board**: a path with milestones from You to the job: You have N (the skills as chips) → Your courses cover N (the saved courses with the skills each covers; the guide stands here) → Still to learn N → the job. One next step stands out in ink: the first skill no course covers, with Find a course (then starting a course once all are covered, then job ads once you have them all). Down the left on phones, as columns on wide boxes. Every skill opens its sheet.
- On a computer, several cards side by side instead of one deck.

**Courses and job ads**

- Saved per goal; one course can count for several goals. When a course covers skills of another goal or shortlisted job, ask "Also counts for …?"
- **Find a course** opens one sheet with three buttons: **mein NOW** (opens its search with the term filled in), **copy search words** (ready-made words to paste into any search engine), **copy AI prompt** (to paste into any AI chat). No buttons that open a search engine or an AI service.
- Course preferences are asked once, saved in Profile and shown in the sheet ready to change: course language (German, English, either), where (near town, online, either), time (full time, part time, evenings), start (soon, within 6 months, any), Bildungsgutschein / AZAV (on by default).
- **Every prompt is shown in a text area** the user can edit or select and copy by hand, with a **Copy** button and a **Reset prompt** button that restores the generated text. The same goes for the search words.
- The AI prompt uses the preferences, the goal's missing skills, German level and place; never name or contact details. It asks for 3 to 5 real courses with links and a machine-readable answer block, and for which listed skills each course covers.
- Paste-back shows the courses found as small cards with checkboxes; kept ones arrive filled in with their skill tiles pre-marked, which the user confirms by tapping. AZAV shows as **"Provider says"**, never as verified.
- Adding by hand: short form (name required; provider, link, start), "More details" for the rest, then "What does it cover?" by tapping the goal's tiles.
- Job ads use the same sheet with the Jobbörse instead of mein NOW and place/hours instead of course preferences.

**Plan**

- The Summary, renamed, built from the main goal and its courses and job ads.

---

## 2 · DATA MODEL

### One list of jobs, ratings as the source of truth (new format, no migration)

Today a job lives in up to three places (`intake.jobs`, `esco.jobs`, `careers`) and `applyEsco()` copies ratings into map structures (`skills`, `categories`, `gaps`). The new screens read ratings directly, so the copies go.

**New format (version 2). Version 1 backups are refused with a clear message; no users hold them.**

| Field | New shape | From |
|---|---|---|
| `jobs` | `[{title, occ, role: "done"\|"goal"\|"maybe", org, when, liked}]` | replaces `esco.jobs`, `careers`, `intake.jobs` |
| `mainGoal` | job title | new |
| `esco.rated`, `esco.own` | unchanged; the only record of skill levels | |
| `esco.votes` | unchanged; job 👍 sets `liked`, skill 👍/👎 per tile as now | |
| `courses[]` | add `goals: [job titles]` (replaces `qualifies`), `covers: [skill ids or names]`, `azav: "provider"\|""`, `source: "hand"\|"ai"` | |
| `jobads[]` | `for` stays, renamed `goals` for symmetry | |
| `profile.coursePrefs` | `{lang, where, time, start, voucher}` | new |
| `skills`, `categories`, `gaps`, `projects` | dropped; skills come from `esco.rated` + `esco.own`, gaps are computed per goal at render time | |

Job states: past and current become **done**; goal stays **goal**; fallback, secondary and worth exploring become **maybe**. Courses are their own list, not a job state.

**Where a skill came from** is derived, not stored: a rated skill belongs to every done job whose ESCO occupation lists it (essential or optional), the rule `buildDeck()` already uses. Skills in `esco.own` show as "added by you".

**Known matching gap**: own skills typed in plain words ("Turn wood") are not linked to catalogue skills ("woodturning"), so they count as missing. Step 3 of the build links an own skill to its closest catalogue skill when the match is clear and asks when it is not.

---

## 3 · BUILD

### One clean pass on this branch, reusing the logic that works

Nobody uses the app yet, so there is nothing to keep compatible. Building the new views on the new data model in one pass avoids writing bridges between the old screens and the new model that would be thrown away. The app may be broken between commits on this branch; it ships when the whole pass is done.

**Kept and adapted (logic, not screens)**

- `items.js` (questions and scales) and the scoring in `assess.js`
- ESCO loading, occupation and skill search in `esco.js`; `coverage()`; the deck builder
- Ranking in `directions.js` (`rankAll()`, interest fit, votes, wants, warnings, preparation levels), search links
- Prompt building and privacy rules in `library.js`; paste-back parsing in `app.js` (`extractJSON()`, `analyze()`)
- Undo and redo, storage, backup file, language switch, dark mode, install, service worker, sample picker
- Summary page and print styles in `summary.js`

**Removed**

- The map view and D3, Paths, Saved, Skills step 1, the reactions panel, the old wizard as a separate view, the Home steps list, Edit my data in its current eight-tab form (rebuilt for the new model)

**Build order (commits on this branch)**

1. **Data model**: new `emptyDoc()` and `shape()`, helpers `jobs()`, `mainGoal()`, `skillLevel(id)`, `coverage(job)`, `skillSources(id)`, `coursesFor(job)`; backup writes and reads version 2.
2. **Shell**: three tabs, Home, menu (adds AI prompts), shared action bar (bottom on phones, inline on desktop), no "Next:" links, intros shown once.
3. **Profile**: parts 1 to 4 (part 3 one row per screen), Your story with inline catalogue match, skill deck as part 6, own-skill linking, results page.
4. **Goals**: job card (front, back, rating mode), ideas deck, shortlist, Make this my goal, Compare for up to 3, board (also on Home), several cards side by side on desktop.
5. **Courses and job ads**: Find a course sheet (mein NOW, copy search words, copy AI prompt), preferences saved in Profile, paste-back with pick list and pre-marked tiles, short hand form with tile tapping, "Also counts for …?", job ads with the Jobbörse.
6. **Plan**: Summary from the main goal, its board numbers, courses and job ads.
7. **Edit my data** for the new model, sample profiles rebuilt with `tools/examples/build.mjs`, `sw.js` SHELL list, `tools/ux/walk.mjs` rewritten for the new screens.
8. **Check and docs**: phone (390 px) and desktop (1280 px) walk in English and German, German against `docs/german-review.md`, `README.md` and `docs/spec.md` updated.

Every string goes into both `STR.en` and `STR.de` as it is written.

---

## 4 · OPEN ITEMS

- **Name**: trademark search for From A to Job (DPMA, EUIPO, classes 35, 41, 42).
- **Sample profiles**: Geppetto's CNC goal covers only 2 of 19 skills while Cabinet maker covers 10 of 20. Keep as is (it shows the compare view well) or adjust the story.
- **Real devices**: back gesture, on-screen keyboard and German at 360 px on a real Android phone and iPhone, still open from the October audit.
