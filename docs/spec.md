# CHART MY SKILLS: SPEC v2
### Self-assessment, directions, prompts, collection and caseworker summary
**Drafted 14 October 2026 for approval. Builds on the app in `munsdev/chartmyskills` at commit c615e67. Nothing in this document is built yet.**

---

## 01. WHAT THE APP IS FOR
### A private workspace for finding out what you can do and where it can take you

**PURPOSE**

Help people in a career transition discover their own profile, widen their view of what they could do, research jobs and courses with their own AI chat, keep what they find, and walk into a caseworker meeting with a plan they can explain.

**PRIMARY USERS**

Adults in German reorientation courses, most of them Jobcenter or Arbeitsagentur clients. Research points to a mixed group:

- About 15% under 25 and 16% over 55 in one agency sample. 38% low-qualified.
- Roughly 30 to 50% non-native German speakers, inferred from Jobcenter client data.
- 26% of SGB II recipients go online only by smartphone. 7% have no internet at all.
- Common reasons for the course: job loss, health, long tenure in one field, foreign qualifications, family breaks.

**FIXED DECISIONS**

- No accounts, no server, no AI connection. Data stays in the browser. Backup is a file.
- No import of New Plan results.
- No course catalogue. Users add their own courses and jobs.
- Skills and occupations come from ESCO, plus anything the user adds.
- Aptitudes come from our own list, rated in a short self-assessment upfront.

**POSITIONING**

The BA already offers measured tests: New Plan Kompetenz-Checks, Check-U, MYSKILLS. This app does not compete with them. It is the self-guided notebook between them: biography into skills, skills into directions, directions into searches, searches into a collection, and all of it into one printable page.

---

## 02. WHAT ALREADY EXISTS
### The current app covers about half of this, so v2 is an extension, not a rewrite

**IN THE REPO NOW**

| Part | State |
|---|---|
| Start wizard | 6 steps: you, now, jobs, wants, more, done. Writes profile, careers and `DOC.intake`. |
| Skills view | Match jobs to ESCO occupations, rate skills one card at a time on 0 to 5, goal jobs get coverage and missing skills, similar occupations suggested. |
| Map | D3 radial map: categories, skills, details, gaps, projects, careers, courses. |
| Edit | Form editor for every section. |
| Prompts | 4 copy-paste prompts (CV to skills, careers and gaps, projects, courses) with a robust JSON paste-back importer. |
| Backup | JSON export and import, change counter, undo and redo. |
| Data | ESCO v1.2.1, 3,039 occupations, 13,934 skills, DE and EN, about 3 MB loaded only in the Skills view. |
| Legal | Impressum, Datenschutz, ESCO attribution. |

**WHAT v2 ADDS**

1. A self-assessment upfront: aptitudes, interests, work setting, values.
2. A profile results view.
3. A directions engine that suggests occupations without AI.
4. A prompt library for searching, self-discovery and paste-back tasks, plus deep links into BA search pages.
5. A collection for courses, job ads and other finds, with comparison.
6. A one-page caseworker summary.
7. An aptitude layer on the map.
8. A simpler navigation for phones.

---

## 03. THE SELF-ASSESSMENT
### Four short parts, about 10 minutes in total, saved after each part

**DESIGN RULES FROM THE RESEARCH**

- **Concrete behaviour, not traits.** "I check my work before I hand it in", not "I am careful."
- **Real past behaviour from any part of life:** work, family, volunteering, hobbies. People without a current job still have answers.
- **Frequency scale for behaviour items:** nie, selten, manchmal, oft, fast immer. Agree/disagree scales measured worse in randomized studies and invite yes-saying.
- **Every point labelled in words, no numbers shown,** midpoint kept. Five points, one item per screen on phones, large tap targets.
- **No reverse-worded items.** They lower reliability most for weaker readers and second-language readers.
- **No forced-choice scoring** for the scales. It makes profiles ipsative (everyone gets the same total) and distorts them.
- **Three items per aptitude.** Two-item scales are too unstable; four would make the test too long.
- **Einfache Sprache, not Leichte Sprache.** Short main clauses, everyday words, Sie-form.
- **Say up front:** there are no right answers, nothing leaves this device, results are a starting point you can change.

**PART 1: APTITUDES (Wie ich arbeite)**

15 aptitudes in 4 groups, 3 items each, 45 taps. The backbone is the ESCO transversal skills hierarchy, which has official German labels and is CC BY 4.0. That also lets aptitudes connect to ESCO data later.

| Group | Aptitude (DE / EN) | ESCO transversal group | Example item (DE / EN) |
|---|---|---|---|
| Denken | Informationen auswerten / Making sense of information | Processing information, ideas and concepts | Ich vergleiche Angebote genau, bevor ich mich entscheide. / I compare options carefully before I decide. |
| Denken | Planen und organisieren / Planning and organizing | Planning and organising | Ich plane meine Woche im Voraus. / I plan my week in advance. |
| Denken | Probleme lösen / Solving problems | Dealing with problems | Wenn etwas nicht funktioniert, finde ich heraus, woran es liegt. / When something doesn't work, I find out why. |
| Denken | Neue Ideen / Coming up with ideas | Thinking creatively and innovatively | Mir fallen neue Wege ein, eine Aufgabe zu erledigen. / I think of new ways to get a job done. |
| Arbeitsweise | Sorgfalt / Care and accuracy | Working efficiently | Ich kontrolliere meine Arbeit, bevor ich sie abgebe. / I check my work before I hand it in. |
| Arbeitsweise | Selbstständig arbeiten / Working on your own initiative | Taking a proactive approach | Ich fange mit einer Aufgabe an, ohne dass mich jemand erinnert. / I start tasks without anyone reminding me. |
| Arbeitsweise | Ruhe unter Druck / Staying calm under pressure | Maintaining a positive attitude | Wenn es hektisch wird, bleibe ich ruhig. / When things get hectic, I stay calm. |
| Arbeitsweise | Dranbleiben / Sticking with it | Working efficiently | Ich bringe Aufgaben zu Ende, auch wenn sie langweilig sind. / I finish tasks even when they are boring. |
| Arbeitsweise | Neues lernen / Learning new things | Demonstrating willingness to learn | Ich bringe mir selbst Neues bei, zum Beispiel mit Videos. / I teach myself new things, for example with videos. |
| Mit Menschen | Erklären / Explaining | Communicating | Andere fragen mich, wenn sie etwas nicht verstehen. / Others ask me when they don't understand something. |
| Mit Menschen | Helfen und betreuen / Helping and caring | Supporting others | Ich kümmere mich um Menschen, die Hilfe brauchen. / I look after people who need help. |
| Mit Menschen | Im Team arbeiten / Working in a team | Collaborating in teams and networks | Ich spreche mich mit anderen ab, bevor ich etwas ändere. / I check with others before I change something. |
| Mit Menschen | Führen / Leading | Leading others | In einer Gruppe übernehme ich die Leitung. / In a group, I take the lead. |
| Mit Menschen | Auf Menschen zugehen / Meeting new people | Communicating | Ich spreche fremde Menschen von mir aus an. / I start conversations with people I don't know. |
| Praktisch | Mit Händen und Werkzeug / Working with hands and tools | Manipulating and controlling objects and equipment | Ich repariere Dinge selbst. / I fix things myself. |

Changes from the list we discussed: "Taking risks" is dropped (unclear meaning, little use for directions). "Working with hands and tools" is added, because many users come from trades and it was missing. "Persistence" is kept as "Sticking with it".

**PART 2: INTERESTS (Was ich gern mache)**

The six RIASEC interest types, 3 activity items each, 18 taps. Scale: gar nicht gern, eher nicht gern, egal, eher gern, sehr gern.

| Type | Plain name (DE / EN) | Example item (DE / EN) |
|---|---|---|
| R | Praktisch / Practical | Eine Maschine reparieren / Repair a machine |
| I | Forschend / Investigating | Herausfinden, warum eine Pflanze krank ist / Find out why a plant is sick |
| A | Gestaltend / Creative | Einen Raum neu gestalten / Redesign a room |
| S | Sozial / Helping | Jemandem etwas beibringen / Teach someone something |
| E | Unternehmerisch / Leading and selling | Einen Verkaufsstand leiten / Run a market stall |
| C | Ordnend / Organizing | Belege sortieren und in eine Tabelle eintragen / Sort receipts into a spreadsheet |

This part is what lets the app suggest occupations without AI (section 05). All items are written by us. We do not copy the O*NET Interest Profiler, whose license requires a validation study for modified versions.

**PART 3: WORK SETTING (Wo und wie ich arbeiten will)**

6 two-sided sliders, then a checklist of things that are ruled out.

| Left | Right |
|---|---|
| allein | mit vielen Menschen |
| drinnen | draußen |
| am Schreibtisch | körperlich |
| feste Abläufe | viel Abwechslung |
| feste Zeiten | flexible Zeiten |
| wenig Kundenkontakt | viel Kundenkontakt |

Ruled out (Geht für mich nicht), multiple choice: Schichtarbeit, Wochenendarbeit, viel Stehen, schweres Heben, viel Reisen, viel Telefonieren. No reasons are asked.

These are preferences, not abilities, so they become warnings on directions, never scores.

**PART 4: WHAT MATTERS AT WORK (Was mir wichtig ist)**

Pick the 3 that matter most from 6 cards. Based on the six O*NET work values (CC BY 4.0), with our own wording:

- Erfolg sehen / Seeing results (Achievement)
- Selbst entscheiden / Deciding for myself (Independence)
- Anerkennung / Recognition (Recognition)
- Gute Kolleginnen und Kollegen / Good colleagues (Relationships)
- Gute Unterstützung / Good support from the employer (Support)
- Sicherheit und gute Bedingungen / Security and good conditions (Working Conditions)

**BASICS IN THE EXISTING WIZARD**

Two structured fields join the "About you" step, because they gate courses and the Bildungsgutschein:

- German level: Muttersprache, C1/C2, B2, B1, A2, A1, weiß nicht.
- Computer use: kaum, Grundlagen, sicher im Alltag, sicher im Beruf.

**SCORING**

- Aptitude score is the mean of its 3 answers on 1 to 5, rounded to 0.5. Interest score likewise per type.
- The interest code is the top three types, with ties shown as ties.
- Results are relative within the person: "your strongest five", not "high" or "low" against others.
- Differences under 1 point are not presented as meaningful.
- The user can change any result. The original and the changed value are both kept.

**RESULTS VIEW (Mein Profil)**

- Aptitudes grouped by the 4 groups as bands: kaum, etwas, mittel, deutlich, sehr deutlich. No scores shown by default.
- Each result has one sentence tied to the person's actual answers ("Sie haben angegeben, dass Sie oft Dinge selbst reparieren"). This avoids vague horoscope-style text that anyone would accept.
- Low results get a neutral description, not a warning.
- Interests as a six-point profile with the three-letter code and plain names.
- Work setting and values as short lists.
- One button per result: "Stimmt das? Ändern".
- A note: "Das ist eine Selbsteinschätzung, kein Test. Gemessene Ergebnisse bekommen Sie im Kompetenz-Check von New Plan."

---

## 04. DATA MODEL ADDITIONS
### Everything new lives in the same document, so backups, undo and the importer keep working

```json
"assess": {
  "v": 1,
  "answers": {"plan_1": 4, "plan_2": 3, "R_1": 5},
  "adjusted": {"plan": 4},
  "setting": {"people": 2, "outdoors": 4, "physical": 3, "variety": 4, "hours": 2, "customers": 1,
              "ruledOut": ["shifts", "weekends"]},
  "values": ["independence", "achievement", "conditions"],
  "done": {"aptitudes": "2026-10-20", "interests": null, "setting": null, "values": null}
},
"collection": [
  {"id": "", "type": "course|job|other", "name": "", "url": "", "status": "", "notes": "", "added": "",
   "fields": {}, "covers": [], "for": []}
]
```

- Item IDs and aptitude IDs are fixed English keys. Labels live in the language files.
- `profile` gains `german` and `computer`.
- Existing `courses` stay as they are and become the course type of the collection. A migration moves old entries across.

---

## 05. DIRECTIONS WITHOUT AI
### Interests, skills and work setting combined into occupation suggestions with reasons

**DATA SOURCES**

| Source | What it gives | License |
|---|---|---|
| ESCO to O*NET crosswalk (ESCO portal, 2023 CSV) | Links each ESCO occupation to O*NET-SOC codes, with match type | Not stated. ESCO content is reusable under the Commission reuse policy. To confirm. |
| O*NET 31.0 Interests | RIASEC profile per occupation | CC BY 4.0 with fixed attribution text |
| O*NET 31.0 Job Zones | Preparation level, now 4 levels | CC BY 4.0 |
| O*NET 31.0 Work Context | People contact, outdoors, physical demand, standing, schedule | CC BY 4.0 |
| ESCO iscoGroup | Fallback key for occupations without a crosswalk row | ESCO |
| EURES DE mapping table (optional) | KldB 2010 Anforderungsniveau, the German preparation level | Not stated. Optional, to confirm. |

A new build script, `tools/build_onet.py`, joins these into one compact file, `public/esco/onet.json`, estimated under 100 KB raw and about 30 KB compressed. It logs how many ESCO v1.2.1 occupations got a match. The crosswalk was built for ESCO v1.1, so about 31 newer occupations need the ISCO fallback.

**HOW A DIRECTION IS SCORED**

| Signal | Use | Weight |
|---|---|---|
| Interest fit | Correlation of the user's 6 interest scores with the occupation's RIASEC profile, weighted by crosswalk match type (exact 1.0, narrow 0.8, close 0.6, broad 0.4) | Main score |
| Skill coverage | The existing ESCO coverage score from rated skills | Main score |
| Work setting | Occupation context compared with the user's sliders and ruled-out list | Warnings only |
| Preparation | Job zone or Anforderungsniveau | Filter and label |
| Aptitudes | Not used for scoring in v2 | Shown as "uses your strengths" notes only |

Aptitudes stay out of scoring because the only occupation-level data for them (O*NET work styles, ESCO transversal links) is either AI-rated or sparse. Using them would look precise without being so.

**WHAT THE USER SEES**

Up to 10 suggestions, each with:

- Name, preparation label, and one match score (0–100, the average of an interest score and the share of core skills you have) with its band in words, and both reasons shown next to it. Ranking keeps its own formula; the score only describes.
- Reasons in plain words: "Passt zu Ihren Interessen Praktisch und Ordnend", "Sie haben 6 von 14 Kernfähigkeiten".
- Warnings: "Oft Wochenendarbeit", "Viel Stehen".
- Actions: add as goal, hide, search courses, search jobs, open a prompt about it.
- A confidence note when the match came only through a broad crosswalk link or the ISCO fallback.

---

## 06. PROMPT LIBRARY
### Short tasks for the user's own AI chat, in three groups

**RULES FOR EVERY PROMPT**

- Assembled from the profile, but never contains name, contact details or address.
- Shows "Was in diesem Prompt steht" before copying, so the user sees what goes into the chat.
- Asks the AI for a short answer. No open-ended conversations unless that is the point of the prompt.
- Written for Copilot first, because course participants get it, but works in any chat.
- German and English versions.

**SEARCH (Suchen)**

| Prompt | Uses |
|---|---|
| Jobs for a direction near me | direction, location, radius, setting warnings |
| Courses that close my gaps, with Bildungsgutschein and AZAV check | gaps, German level, format wishes |
| What a normal day in this job looks like | direction |
| Funding and support options for my situation | situation from the wizard |
| Which employers in my region hire for this | direction, location |

**DISCOVERY (Entdecken)**

| Prompt | Uses |
|---|---|
| Ask me questions to find skills I'm underrating | jobs, hobbies, top aptitudes |
| What patterns do you see in my profile | aptitudes, interests, values, skills |
| Translate my experience as X into skills for Y | past job, goal |
| Directions I haven't considered, and why | interests, aptitudes, ruled-out list |
| Prepare me for my caseworker meeting | goal, chosen course, evidence |
| Practise a job interview with me | direction, strengths |

**TASKS WITH PASTE-BACK (Aufgaben)**

| Prompt | Answer goes into |
|---|---|
| Turn this course page into a course card | collection |
| Turn this job ad into a job card | collection |
| Compare these saved items against my gaps | notes on the items |
| CV to skills (existing step 1) | skills |
| Career paths and gaps (existing step 2) | careers and gaps |

The existing JSON importer handles all paste-back answers.

**DEEP LINKS**

Next to each direction and gap:

- mein NOW course search: `https://mein-now.de/weiterbildungssuche/?sw=<term>&uk=<radius>`. `sw` and `uk` are confirmed through the old KURSNET redirect. Bildungsgutschein and format filters are documented for the API but not yet tested on the site.
- BA Jobbörse: `https://www.arbeitsagentur.de/jobsuche/suche?angebotsart=1&was=<term>&wo=<place>&umkreis=<km>`. Untested, verify before shipping.
- BERUFENET: stable entry page only. No documented search URL.

---

## 07. COLLECTION
### One list for every course, job ad and lead the user finds

- **Add.** By pasting a link, and optionally the page text. A task prompt fills the fields, or the user fills them by hand.
- **Types.**
  - Course, with the existing course fields.
  - Job ad, with employer, place, hours, requirements and link.
  - Other, with free notes.
- **Status.** Interessant, angefragt, beworben, Absage, Zusage.
- **Link to the profile.** Items link to directions and gaps. Courses show which gaps they cover.
- **Compare.** Side-by-side table for 2 to 4 items of the same type, with empty fields marked "unbekannt" rather than guessed.
- **Evidence.** Saved job ads double as labour-market evidence for a Bildungsgutschein request.

---

## 08. CASEWORKER SUMMARY (Meine Mappe)
### One A4 page the user chooses what goes on

The structure follows what a caseworker needs to approve a Bildungsgutschein:

1. Goal: the chosen direction and why it fits.
2. Strengths: top aptitudes, interest code, key skills.
3. What is missing and how it gets closed.
4. The chosen course: provider, dates, AZAV status, funding.
5. Labour-market evidence: saved job ads.
6. Other routes checked.
7. Next steps.

Rules:

- Every section has a checkbox. Unticked sections are not printed.
- Print CSS for one A4 page. German or English, independent of the interface language.
- Copy as text for email.
- Shown once on screen before printing: "Nur Sie entscheiden, was die Arbeitsagentur sieht."

---

## 09. NAVIGATION AND MAP
### Fewer, clearer tabs that work on a phone

| Tab | Contains |
|---|---|
| Ich | Self-assessment, the existing start questions, profile results |
| Fähigkeiten | Existing ESCO jobs and skill cards |
| Karte | The map |
| Wege | Directions, prompts, deep links |
| Merkliste | Collection and comparison |
| Mappe | Summary, edit, backup |

The tabs become a bottom bar on narrow screens.

**APTITUDE LAYER ON THE MAP**

- A new inner ring between the center and the category hubs, showing the 15 aptitudes as small bubbles with the same level ring as skills.
- A toggle switches the layer on and off.
- Clicking an aptitude shows its result, the answers behind it, and the directions it supports.
- In v2 aptitudes do not link to individual skills, because no reliable mapping exists between our aptitudes and the user's rated ESCO skills.

---

## 10. BUILD STAGES
### Four stages, each ending in a version you can click through

| Stage | Delivers | Done when |
|---|---|---|
| 1. Self-assessment | Item bank of 63 items plus setting and values in DE and EN; the 4-part flow; scoring; profile results with adjust; German and computer fields; data model and backup migration; new navigation | A new user can complete all 4 parts on a phone, see results, change one, export and re-import |
| 2. Directions | `tools/build_onet.py`, `onet.json`, scoring, direction cards with reasons, warnings and actions; O*NET and ESCO attribution page | Suggestions for the Alex Becker and Casey examples look sensible and every reason line is traceable |
| 3. Prompts and collection | Prompt library in 3 groups, privacy preview, deep links, collection with paste-back, comparison | A course page and a job ad go from link to compared card in under 3 minutes |
| 4. Summary and map | A4 summary with section choice, aptitude ring on the map, mobile pass, accessibility check, copy review list for a native German speaker | Summary prints on one page; WCAG AA contrast and keyboard checks pass |

Code stays vanilla JavaScript with no build step, split into new files: `assess.js`, `directions.js`, `collect.js`, `summary.js`. Item texts live in `items.js` so they can be reviewed without reading code.

**TESTING WITH REAL PEOPLE**

After stage 1, and again after stage 4, five to eight course participants work through the app while thinking aloud, in German and English. We note where they hesitate, which items they misread, and whether the results feel true. Items that nearly everyone answers the same way get rewritten.

---

## 11. DECISIONS NEEDED FROM YOU

1. **Interests part.** Include it? It adds 18 items and about 2 minutes, and it is what powers suggestions. Recommended: yes.
2. **Length.** About 10 minutes in 4 parts, each one saved. Acceptable, or should aptitudes drop to 12?
3. **Default language.** German for everyone on first visit, or follow the browser as now?
4. **O*NET data.** Using US occupation data through the crosswalk requires the CC BY 4.0 credit and a modification note on an attribution page. Acceptable?
5. **Name of the upfront part.** "Selbsteinschätzung" (self-assessment) or something warmer like "Was mich ausmacht"?

---

## 12. KNOWN LIMITATIONS, PRECISELY
### What this spec does not settle

- **No validity.** The self-assessment follows good practice but has not been validated. With 3 items per aptitude, a single result can be off by about a point. Only testing with real users will show whether results feel true.
- **Crosswalk.** The ESCO to O*NET crosswalk license is not stated. It targets ESCO v1.1, so newer occupations fall back to ISCO groups. Broad matches give many ESCO occupations a generic US profile.
- **US preparation levels.** O*NET job zones reflect US training paths, not the German dual system. The German Anforderungsniveau mapping exists but has no stated license and targets ESCO v1.0.3.
- **Deep links.** Only `sw` and `uk` on mein NOW are confirmed. The other mein NOW filters and the Jobbörse URL format are untested.
- **German copy.** All German text needs review by a native speaker before it goes in front of users.
- **User data.** No national demographics exist for §45 course participants. The audience picture rests on one agency sample, proxies and inference.
- **Bildungsgutschein checklist.** It comes from a practitioner source that matches the legal criteria, not from BA documentation.
- **Overlap with BA tools.** New Plan and Check-U measure some of the same areas with validated methods. The app points users to them but cannot use their results.

**Main sources:** GESIS survey guidelines on question wording, rating scales and response bias; O*NET Interest Profiler manual; IPIP; ESCO transversal skills documentation and O*NET crosswalk report; O*NET 31.0 data dictionary and license; IAB reports on §45 measures and digital access; Bertelsmann Stiftung studies on Jobcenter clients; mein NOW and BA tool documentation.
