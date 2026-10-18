# Chart My Skills: user flow audit

AUDIT · 15 October 2026 · commit `3ed9edb` on `main` · no app changes made

**STATUS · 15 October 2026:** every finding in this document is fixed and deployed to cms.muns.dev; each one is marked FIXED with a note on what changed and how it was checked. F1 and M1 record what works and needed no change. Still open from section 5: checks on a real Android phone and iPhone (back gesture, on-screen keyboard, German at 360 px).

This document records a full walk through every user flow of the live app, measured against common UX practice for mobile-first web apps. It is written so another session can pick up the fixes without repeating the analysis. Each finding has an ID, a severity, where it happens, what the user sees, why it matters, a suggested fix and the code to touch.

---

## 1 · SCOPE AND METHOD

### Every flow, walked from an empty browser, on phone and desktop

**WHAT WAS TESTED**

- First visit and empty states of all six tabs, the ☰ menu, Edit my data and Backup
- Me: parts 1 to 4 of the self-assessment, including Back, and part 5 (Your story, 6 steps)
- Skills: job matching, the card deck, results, "Put it on my map"
- Map after applying, Paths (goals, suggestions, prompt list, prompt dialog, import box)
- Saved: empty state, "+ Add a course", "Add from a link", status, compare
- Summary: editing, preview, language switch
- Samples: picker over own data, sample bar, "Start your own"
- Browser back button, language switch mid flow, toasts, action bars at 360 px width in English and German

**HOW**

- Headless Chromium at 390 × 844 (phone) and 1280 × 860 (desktop), light mode, as a new user typing German job titles in the English interface (the default language), because that is what course participants will do.
- Script: `tools/ux/walk.mjs` (logs each screen's text and visible controls and takes a screenshot). Sample completeness check: `tools/examples/audit.mjs`.
- Extra probes: ESCO job matching per language, action bar overflow at 360 px, back-answer state, card deck in German.

**SEVERITY**

| Level | Meaning |
|---|---|
| Blocker | Dead end or data loss. The user cannot continue or loses work. |
| High | The user can continue but is likely confused, misled or gets stuck often. |
| Medium | Friction or inconsistency a typical user notices. |
| Low | Polish. |

---

## 2 · SUMMARY

### The guided part works well; the skill matching and data safety do not yet

The self-assessment (Me, parts 1 to 4) is the strongest flow: one question per screen, fixed action bar, clear "Part done" screens with a next step, results with a "What next" block. Paths, Saved and Summary have sensible empty states that point somewhere useful.

Four problems can strand or hurt a new user:

1. **S1, S2, S3 Skills dead end.** In the English interface, German job titles do not match the skills catalogue. There is then no way to search the catalogue, "Start the skill cards" jumps to an empty result, and "Put it on my map" reports success with nothing on the map.
2. **B1 Data loss.** Loading a sample replaces the user's own data with no confirmation, and there is no undo on touch devices (G2).
3. **G1 Back button.** The browser or Android back gesture leaves the app instead of going to the previous screen.
4. **G8 Cut-off action bars.** At 360 px the German question bar is 457 px wide, so "Überspringen" (Skip) is cut off. Several other bars overflow too.

---

## 3 · FINDINGS BY FLOW

### 3.1 · Global: navigation, history, feedback, wording

**G1 · FIXED · High · Browser and Android back leave the app**
- Where: every view. `show()` uses `history.replaceState` (`public/app.js:467`).
- What happens: after Me → Skills → Paths, pressing back leaves the site (the walkthrough ended on a blank page). Open dialogs (prompt, sample picker, menu) are not closed by back either.
- Why: on Android, back is the most used navigation gesture. Expected: back returns to the previous tab or step and closes an open dialog first.
- Fix: `pushState` on tab changes and on question or wizard steps (or only tabs, minimum), handle `popstate` to call `show()` for the hash, and close open `dialog` elements on `popstate`.
- **Fixed:** every view change is now a history step (`pushState` in `show()`, `replaceState` on first load), and a `popstate` handler shows the view from the hash. Back first closes whatever is open on top (a dialog such as the prompt or sample picker, the menu, or a map card) and keeps the user on the view. Question and wizard steps are not history steps yet. Checked with a test (Me, Skills, Paths, Saved, picker, menu, then back five times and forward) and the walk, which now ends on the previous view instead of a blank page. Not yet checked on a real Android phone.

**G2 · FIXED · High · No undo on touch devices**
- Where: Undo and Redo were removed from the header; only Ctrl+Z and Ctrl+Y remain (`public/app.js:1014`).
- What happens: destructive actions (loading a sample, "Start your own", importing, deleting a saved item after the confirm) cannot be undone on a phone. The Backup page still says "you can undo it afterwards" (`bk_imp_p`, `public/i18n.js:246`).
- Fix: after destructive actions, show a toast with an "Undo" button for about 8 seconds (snackbar pattern) that calls `undo()`. Remove or correct the Backup copy.
- **Fixed:** a new `toastUndo()` shows the message with an "Undo" button for 8 seconds that calls `undo()`. It is used after loading a sample, "Start your own", clearing, importing or restoring, deleting an entry in the editor and deleting a saved item. The Backup copy now says the message afterwards has an Undo button. Checked with a test (delete a saved course, Undo brings it back; open a sample, Undo returns to the own profile) and the walk.

**G3 · FIXED · Medium · Toasts linger, mislead and cover buttons**
- What happens: "Your skills are on the map" appears after applying zero skills (S3). "Your map is started. Next: your skills." is still visible after moving to Me. "Saved" from the editor shows up on Summary. On Paths the toast covers "Add as goal" on the first suggestion card.
- Fix: clear the toast on view change. Do not toast success when nothing changed. Place the toast above the action bar or at the top on phones.
- **Fixed:** a toast from the previous view is cleared when the user moves to another view (toasts raised in the same moment as the view change, such as "Your skills are on the map", stay). No success toast when nothing changed (see S3). On phones, views without an action bar show the toast at the top, so it no longer covers "Add as goal" on Paths; views with a bar show it above the bar (see G8).

**G4 · FIXED · Medium · Inconsistent terms for the same things**
- "Map" is used for all the user's data ("Your map lives only in this browser", "Clear the map", "Create my map", "adds to your map"), but the map is one of six tabs.
- The same concept has different names. Missing skills are "Missing fields" (editor), "What I still need" (Summary) and "Missing for this goal" (Paths). Goals are "Career paths" (editor) and "Your goals" (Paths). The Paths tab's heading is "Directions". The Skills tab's heading is "Pick your skills". The German Summary tab is "Mappe".
- Fix: agree on a short glossary (profile, skills, missing skills, goals, saved, summary) and apply it in `i18n.js` and the module strings. Record it in `docs/german-review.md` too.
- **Fixed:** a glossary is recorded in `docs/german-review.md` (section 0) and applied to the strings in `i18n.js` and the modules: "profile" / "Profil" for the user's data (Map only for the drawing), "missing skills" / "fehlende Fähigkeiten", "jobs and goals" / "Stellen und Ziele" for the careers list, "sample profile", and tab headings "Your skills" and "Paths and goals". German Summary stays "Mappe" by decision. Checked with `tools/examples/audit.mjs`; the walk was not re-run for this change.

**G5 · FIXED · Medium · No sense of the whole journey after Me**
- What happens: Me shows progress for its five parts and a "What next" block. Skills, Map, Paths and Saved do not say what comes next, so the user has to guess the order (the intended order is Me → Skills → Paths → Saved → Summary).
- Fix: a one-line "Next: …" link at the end of each view, or a small progress strip on Me covering all six steps.
- **Fixed:** Skills, Map, Paths and Saved end with a one-line "Next:" link (Skills and Map to Paths, Paths to Saved, Saved to Summary). Me already has its "What next" block.

**G6 · FIXED · Low · Mixed page styles**
- Me is now full page without cards (as decided). Skills, Paths, Saved, Summary and Backup still use bordered cards inside the page.
- Fix: carry the flat style over, view by view, when those views are touched.
- **Fixed:** Skills, Paths, Saved, Summary and Backup sections now use the flat style of Me (rules between sections, no boxed cards); list items such as saved entries and suggestions stay as cards.

**G7 · FIXED · Low · Interface language always starts in English**
- This was a deliberate decision ("EN first, DE as alt"). Listed only because it makes S1 hit most users. Consider defaulting to German when the browser language is German, with English one tap away.
- **Fixed:** with no language chosen before, a browser set to German starts in German; all others start in English, and the EN/DE switch still wins once used.

**G8 · FIXED · High · Action bars overflow on small phones**
- Measured at 360 px (scrollWidth > width):
- **Fixed:** the bar may now wrap to a second row, and its measured height (`--barh`, set in `public/boot.js`) sets the page padding and the toast position, so nothing is hidden under it. Below 480 px the buttons and bar padding are a little tighter. "Back to jobs" moved from the bar into the page above the card deck and the results. Shorter German labels: "Später weiter" (was "Pause, ist gespeichert"), "Weiter bewerten", "Auf meine Karte". Measured at 360 px: all twelve bars (question, Skills step 1, deck, results, editor, story; English and German) fit in one row with nothing cut off. At 320 px the German question bar and editor bar wrap to two rows, also with nothing cut off.

| Screen | English | German |
|---|---|---|
| Question (Me) | fits | 457 px, "Überspringen" cut off |
| Skills, step 1 | fits | 419 px |
| Card deck | 364 px | 463 px |
| Skills results | 440 px | 586 px |
| Editor | fits | 361 px |

- The German label "Pause, ist gespeichert" (`public/assess.js:67`) is long and also reads oddly. "Pause" or "Später weiter" is enough.
- Fix: allow wrapping into two rows, or shorten labels, or move the third action into the page above the bar. Set `flex-wrap:wrap` on `.view.scroll .actions` (`public/style.css`, "action bar" block) and shorten the strings.

---

### 3.2 · First visit and empty states

**F1 · Low · Good: every tab has an empty state with a way forward.** Map offers four starts. Paths offers "Answer part 2" and "Rate your skills". Saved points to Paths. Summary explains where goals and courses come from. Keep this pattern.

**F2 · FIXED · Medium · Map empty states point to the old prompt structure**
- What happens: after Your story, the map says "Use step 1 of the prompts with your CV" (`empty_p2`, `public/i18n.js:519`). Numbered prompt steps no longer exist. The first empty state also leads with AI prompts rather than the questionnaire.
- Fix: rewrite both texts around the current flow ("Rate your skills under Skills, or add them by hand").
- **Fixed:** both map empty states are rewritten around the current flow: "Start with a few questions about you, or rate your skills under Skills..." and, after Your story, "Rate your skills under Skills, or add them by hand." No mention of numbered prompt steps.

**F3 · FIXED · Low · Summary empty state is heavy**
- What happens: a new user sees thirteen controls with "None" selected and an almost empty preview.
- Fix: when there is no goal, show a short message and one button ("Set a goal under Paths") instead of the full editor.
- **Fixed:** with no goal, Summary shows "Set a goal first" and one button, "Set a goal under Paths", instead of the full editor.

---

### 3.3 · Me: self-assessment parts 1 to 4

**M1 · Good.** One question per screen, answer advances, Back keeps the earlier answer highlighted, the progress line and "n of 45" are clear, and "Part done" screens offer the next part or results.

**M2 · FIXED · Medium · Results are far below the part list once everything is done**
- What happens: on a phone the Me page is about 4,200 px tall after all parts. Results start after the five part rows. Users coming back mostly want the results.
- Fix: when all four parts are done, show the results first and collapse the part list into one line ("All parts done · change answers").
- **Fixed:** once parts 1 to 4 are done, Me shows the results first and folds the part list into one line ("All parts done · change answers", or "Parts 1 to 4 done" with the Your story card kept on top while part 5 is open). In the walk the Me page went from about 4,200 px to 3,434 px with results at the top.

**M3 · FIXED · Low · "Your results are further down this page" on the Part done screen**
- What happens: at that moment the page only shows the done screen, so "further down" is wrong. The "See my results" button is the real path.
- Fix: "You can see your results now or go on to part n."
- **Fixed:** the done screen now says "You can see your results now or go on to part n." (or only the first half after the last part).

**M4 · FIXED · Low · Part 3 controls**
- What happens: the 5-point rows use custom circles, but "Doesn't matter" is a native blue radio button that is pre-selected. The middle circle is smaller and has no label.
- Fix: style "Doesn't matter" like the other controls. Label the scale ends as now, and give the middle a visible "Either" or "No preference".
- **Fixed:** "Doesn't matter" is now a pill button like the other controls instead of a native radio, all five circles are the same size, and the middle one has a visible label ("Either", "Beides").

---

### 3.4 · Me: Your story (part 5)

**W1 · FIXED · Medium · Part 5 behaves differently from parts 1 to 4**
- What happens: it opens a separate view (`#start`), has its own step style, and ends by jumping to Skills instead of a "Part 5 done" screen.
- Fix: end with the same done screen ("Part 5 done · Rate your skills · See my results").
- **Fixed:** finishing Your story now ends on the same done screen as parts 1 to 4 ("Part 5 done") with "Rate my skills", the next open part if any, and "See my results". Tapping the Me tab on a done screen goes to the overview. The last story step no longer talks about prompts.

**W2 · FIXED · Low · Target jobs as a comma-separated textarea** (step 4)
- What happens: error-prone, and gives no feedback that each job becomes a goal.
- Fix: one input per job with "Add another", like step 3.
- **Fixed:** jobs you are considering are entered one per field with "Add another job" and a remove button; the hint says each one becomes a goal.

---

### 3.5 · Skills: job matching and cards

**S1 · FIXED · Blocker · German job titles do not match in the English interface**
- Where: `searchOcc()` (`public/esco.js:41`) only searches the labels of the current interface language. `loadEsco()` loads one language file.
- Measured in English: Verkäuferin, Lagerhelfer, Pflegehelfer, Busfahrer and Kauffrau für Büromanagement all give no match. In German, Verkäuferin, Lagerhelfer, Pflegehelfer and Busfahrer match correctly.
- Why: course participants in Germany will type German titles. The interface defaults to English.
- Fix: always search both `en.json` and `de.json` labels (and their alternative labels), whatever the interface language. Show the result in the interface language.
- **Fixed:** `loadEsco()` now also loads the labels of the other language, and `searchOcc()` and `searchSkill()` score the English and German labels (and alternative labels) together. Results are shown in the interface language. In English, Verkäuferin gives "Sales assistant" ("Verkäufer/Verkäuferin" in German), Lagerhelfer, Pflegehelfer, Busfahrer, Friseurin and Kassiererin match too. In the walk, the story job "Verkäuferin" now leads to a deck of 27 cards. Ausbildung titles with no catalogue name are handled under S2.

**S2 · FIXED · Blocker · No way to search the catalogue when the match fails or is wrong**
- Where: `renderJobs()` (`public/esco.js:83`). The dropdown only offers up to 8 hits for the original title, plus "No match, keep it without skills".
- What happens:
  - Ausbildung names like "Kauffrau für Büromanagement" have no ESCO equivalent under that name.
  - Wrong auto-matches are accepted silently. In German, "Erzieher" matches "Lehrkraft für Freinet-Schulen".
  - The only workaround is deleting the job and re-adding it under another name.
- Fix: a "Search the catalogue" input per job (type-ahead over both languages) to pick the occupation. Show the matched occupation clearly with a "Not right? Search" link. Consider a small synonym list for common Ausbildung titles.
- **Fixed:** each job row has "Search the catalogue" (or "Not right? Search the catalogue" when matched), which opens a type-ahead over English and German labels; picking a result re-matches the job without deleting it. Automatic matches are labelled "Matched automatically, please check". A short synonym list (`OCC_SYN` in `public/esco.js`) maps common German titles with no catalogue entry, for example Kauffrau für Büromanagement to Office clerk, Fachkraft für Lagerlogistik to Warehouse worker, Altenpfleger to Residential home older adult care worker, and Erzieher now gives Early years teacher first instead of Freinet school teacher. Checked with a test (open search, type, pick, match kept) and the walk.

**S3 · FIXED · Blocker · Starting the cards with no matched job is a dead end**
- Where: `#cStart` handler (`public/esco.js:108`), result toast (`public/esco.js:248`).
- What happens:
  1. The deck is empty, so the app jumps straight to "Step 3 of 3, Your results" with every level at 0.
  2. "Put it on my map" shows "Your skills are on the map" and opens an empty map.
  3. The map then says to use "step 1 of the prompts" (F2).
- Fix: if no past or current job is matched, keep the user on step 1. Show a clear message ("We could not find your jobs in the catalogue. Search for them, or add skills by name.") and disable the start button. Never toast success when nothing was added.
- **Fixed:** when no job you have done is matched, step 1 shows a note right under the job list ("We could not find your jobs in the catalogue..."), the start button is disabled and points to that note, and an "Add a skill that is missing" field appears, so skills can be added by name and taken to the results. "Put it on my map" no longer toasts success when nothing changed: with nothing rated it says "Nothing to put on the map yet" and stays, and with only jobs added it says there are no skills yet. Checked with a test (unmatched job, own skill, apply, empty apply) and the walk.

**S4 · FIXED · Medium · The 0 to 5 rating scale has no legend on the card**
- What happens: the card shows six buttons "0 1 2 3 4 5" with no visible meaning (the meaning is only in `aria-label`). Users will not know whether 0 means "never heard of it" or "a little".
- Fix: a one-line legend under the buttons ("0 not at all · 3 can do it alone · 5 can teach it"), or labels on the end buttons.
- **Fixed:** a one-line legend under the rating buttons ("0 not at all · 1 a little · 3 can do it alone · 5 can teach it", German too), kept from breaking inside an item. Each button's `aria-label` now names the level as well ("Level 3: can do it alone") and points to the legend.

**S5 · FIXED · Low · "Add a missing skill" field inside every card**
- What happens: a search field below the rating buttons competes with the main task.
- Fix: move it to the results step or behind a small "Add a skill that is not here" link.
- **Fixed:** on the card deck the field sits behind a small "Add a skill that is not on the cards" link (it stays open after adding). On step 1 without a matched job it stays visible (see S3).

---

### 3.6 · Map

**P1 · FIXED · Medium · Unreadable on phones at the default zoom**
- What happens: with a sample profile at 390 px, labels are a few pixels high and nodes are hard to tap. Users must pinch-zoom.
- Fix: on phones, start zoomed into the centre and categories, or offer a "List" toggle that shows the same data as an accordion by category.
- **Fixed:** below 640 px the map starts zoomed in on the centre, the categories and the skills (`startView()` in `public/app.js`); double tap returns to that view. A separate list view was not added.

**P2 · FIXED · Low · The legend on desktop is dense** (categories, node types, career path and course styles all at once).
- Fix: collapse it behind "Legend".
- **Fixed:** the legend sits behind a "Legend" toggle in the map header and opens as a dropdown over the map.

---

### 3.7 · Paths and prompts

**PA1 · FIXED · Medium · Very long page on phones (about 4,900 px)**
- What happens: the page holds goals, a three-row preparation filter, suggestions, the full prompt list, and the "Paste the AI answer" box.
- Fix: open the prompt list from one "AI prompts" button (it already opens prompts in a dialog). Move "Paste the AI answer" next to where the answers land (Saved has its own link panel; CV and career-path answers could go under Edit my data).
- **Fixed:** the prompt list and the "Paste the AI answer" box are folded into one "Prompts for your AI chat" section, closed by default, with a one-line explanation. Buttons that lead to the paste box open it first. In the walk the Paths page went from about 4,900 px to 3,512 px. The paste box stays on Paths for now; moving it next to where answers land is still open.

**PA2 · FIXED · Medium · The import box looks technical**
- What happens: placeholder `{"skills": [ ... ]}`, and the copy says it "adds to your map".
- Fix: placeholder "Paste the whole answer from the AI chat here", and say where the result appears.
- **Fixed:** the import box placeholder is "Paste the whole answer from the AI chat here" (also in the Saved link panel), and the copy says skills appear on the Map and courses and job ads under Saved.

**PA3 · FIXED · Low · Suggestions ignore the user's stated goals**
- What happens: for a user aiming at office work, the top suggestion was "Pet sitter".
- Fix: add a small weight for similarity to goal occupations, or a "Closer to my goal" sort.
- **Fixed:** suggestions get a small pull towards the user's goals (share of core skills in common), and when a goal is matched an "Order" switch offers "Closer to my goals". For Robin Hood (goal Fundraiser) that order puts credit union manager, bank treasurer and similar first instead of sports coaches. Cards that share many skills say so.

**PA4 · FIXED · Low · A goal without a catalogue match shows only links**, with no word on why there are no skill details.
- Fix: one line: "Not found in the catalogue, so no skill comparison. Search the catalogue under Skills."
- **Fixed:** a goal without a catalogue match says "Not found in the catalogue, so there is no skill comparison" with a link to search under Skills.

---

### 3.8 · Saved

**SV1 · FIXED · High · "+ Add a course" and "+ Add a job ad" open the full data editor**
- Where: `public/saved.js:98` → `show("edit")`.
- What happens:
  - The user lands in Edit my data, with eight section tabs, a list pane and a 20-field form including "Match (0 to 5)". The bar has "Save" and "View map".
  - After Save they stay in the editor. The only way back is the Saved tab, and nothing says the entry was added there.
- Fix: a focused dialog or sheet with the few fields people have (name, provider or employer, link, start or deadline, status, notes) and "More fields" for the rest. Return to Saved with the new entry highlighted.
- **Fixed:** "+ Add a course" and "+ Add a job ad" open a short dialog (name, provider or employer, link, start or deadline, status set to Interested, notes). Save returns to Saved with the new card outlined and a toast. "More fields" saves the entry and opens it in the full editor, where the bar now says "Back to Saved" instead of "View map" for courses and job ads. `tools/ux/walk.mjs` follows the new dialog. Checked with a test (empty name refused, job ad saved and highlighted, More fields opens the editor) and the walk (steps 39 and 40).

**SV2 · FIXED · Medium · "Add from a link" needs an AI round trip**
- What happens: the only quick path is copy prompt, ask an AI, paste JSON back. There is no "just save the link with a name".
- Fix: in the same panel, a "Save link only" button that creates an entry from URL and a name, to fill in later.
- **Fixed:** the "Add from a link" panel has a name field and "Save link only", which saves the course or job ad with the link and status Interested at once (the name falls back to the web address). The AI prompt stays below as the second option.

**SV3 · FIXED · Low · Status select shows "Status…" as a placeholder** on every new card.
- Fix: default to "Interested".
- **Fixed:** the status select has no "Status..." placeholder; entries without a status show Interested, and new entries are saved as Interested.

---

### 3.9 · Summary

**SU1 · FIXED · Medium · On phones the controls come before the page**
- What happens: thirteen controls take about 1,000 px before the preview starts, so the user cannot see what they are making.
- Fix: on phones, tabs "Page" and "Edit", with the page first. Or show the preview with small edit buttons per section.
- **Fixed:** below 900 px the Summary has two tabs, "Page" (first) and "Edit". Print and Copy sit under both. Printing always shows the page, whatever tab is open.

**SU2 · FIXED · Low · "The course I chose" stays "None" when the saved course is not linked to the goal**
- What happens: the user may think the course is missing.
- Fix: if there is exactly one saved course, preselect it. Otherwise show "Pick one of your n saved courses".
- **Fixed:** with exactly one saved course it is preselected; with several, the empty choice reads "Pick one of your n saved courses".

---

### 3.10 · Menu, Edit my data, Backup, samples

**B1 · FIXED · Blocker · Loading a sample replaces the user's own data without asking**
- Where: sample picker handler (`public/app.js:1038`). The old "Load the example" used `armed()` to confirm when `hasOwn()` was true (`public/app.js:494` shows the same pattern for Clear). The new picker skips it.
- What happens: one tap on a sample replaces everything. With G2 there is no undo on a phone.
- Fix:
  - When `hasOwn()` is true, the picker shows "This replaces your own profile. Download a backup first?" with Download, Replace and Cancel.
  - Better: keep the user's own data aside while a sample is open (a second storage key) and restore it on "Start your own" or "Back to my profile". Then samples never destroy anything.
- **Fixed:** opening a sample now keeps the user's own profile under its own storage key (`chart-my-skills:own`). The yellow bar offers "Back to my profile", which restores it. If the profile cannot be kept aside, the sample does not open. Picker text says the profile is kept aside. Checked with the walk (step 47 and 48) and a round trip test: own profile, two samples, reload, back to own profile.

**B2 · FIXED · Medium · Backup status text is wrong or incomplete**
- What happens: an empty, never-backed-up browser shows "Your last backup is up to date" (`d_uptodate`, `public/i18n.js:196`). The counts list skills, missing fields, projects, career paths and courses, but not the self-assessment, story, job ads or summary.
- Fix: "Nothing to back up yet" when empty, "No backup yet" when never exported, and counts for every part.
- **Fixed:** an empty browser shows "Nothing to back up yet". Otherwise the status lists every part that has content (Me parts done, skills, missing skills, projects, jobs and goals, courses, job ads, summary), then "No backup saved yet" if never exported, the number of changes since the last backup, or "up to date". While a sample is open with the own profile kept aside, it says so.

**B3 · FIXED · Medium · Shared course computers keep the previous person's data**
- What happens: everything lives in the browser's local storage. In a course room, the next participant on the same PC sees the previous person's profile.
- Why: likely for this audience, and personal data.
- Fix: a clear "Finish on this computer" action in the menu (download backup, then clear). A short note on first visit when the device looks shared is optional.
- **Fixed:** the menu has "Finish on this computer". It opens a dialog with "Download backup file", "Remove my data" and Cancel. Remove deletes the profile, the profile kept aside during a sample and the backup counter from local storage, then reloads the page so no undo steps or typed text stay in memory, and confirms with a toast. Checked with a test. Later changed to "Delete all data": it removes every key the app keeps in the browser, language and dark mode included, and the delete button only works after ticking "I understand that everything will be deleted".

**B4 · FIXED · Medium · Edit my data is a power-user editor**
- What happens: map-centric jargon (Categories, Missing fields, Career paths, Key numbers "number | what it counts") and the "View map" button.
- Fix: acceptable as an advanced tool once SV1 no longer sends people there. Rename the sections to the glossary terms (G4).
- **Fixed:** Saved no longer sends people to the editor (SV1), its sections use the glossary terms (G4), and for courses and job ads its bar says "Back to Saved".

**B5 · FIXED · Low · Sample edits are lost when switching language** (the sample is reloaded in the other language). Mention it in the sample bar or keep edits.
- **Fixed:** switching language reloads an unchanged sample in the new language, and keeps an edited one as it is with a toast saying so.

**B6 · FIXED · Low · The sample bar has no "Pick another sample"** action. Only "Start your own" is offered.
- **Fixed:** the sample bar has "Switch" (opens the picker), next to "Back to my profile" or "Start your own". Labels are short so the bar fits at 360 px in German.

---

### 3.11 · Smaller items

- **X1 · FIXED · Low · Small remove buttons.** The "×" remove buttons on Skills job rows are about 28 px, under the usual 44 px touch target. **Fixed:** remove buttons on Skills job rows and in Your story are 44 by 44 px.
- **X2 · FIXED · Low · Desktop bar alignment.** In the editor on desktop, the fixed action bar is centred on 860 px while the form is wider, so "Save" does not line up with the form. **Fixed:** on screens wider than 860 px the editor's action bar starts where the form's fields start.
- **X3 · FIXED · Low · Stray "Saved" toast.** The summary preview showed "Saved" after a selection change, carried over from an earlier save (G3). **Fixed:** covered by G3: toasts are cleared on view change.

---

## 4 · FIX ORDER

### Blockers first, then the things every user meets

| # | ID | Severity | Effort | Files |
|---|---|---|---|---|
| 1 | B1 | Blocker | S | `public/app.js` (picker handler, `hasOwn`) |
| 2 | S1 | Blocker | S | `public/esco.js` (`loadEsco`, `searchOcc`) |
| 3 | S3 | Blocker | S | `public/esco.js` (`#cStart`, `applyEsco` toast) |
| 4 | S2 | Blocker | M | `public/esco.js` (`renderJobs`) |
| 5 | G1 | High | M | `public/app.js` (`show`, popstate), dialogs |
| 6 | G8 | High | S | `public/style.css` action bar, `public/assess.js` strings |
| 7 | G2 | High | S | `public/app.js` (`toast` with action), destructive actions |
| 8 | SV1 | High | M | `public/saved.js`, new dialog in `index.html` |
| 9 | F2, G3, PA2, M3, B2 | Medium/Low | S | strings and `toast()` |
| 10 | S4 | Medium | S | `public/esco.js` (`renderDeck`) |
| 11 | M2, W1, SU1 | Medium | M | `public/assess.js`, `public/app.js` wizard end, `public/summary.js` |
| 12 | PA1, G5, B3 | Medium | M | `public/library.js`, `public/directions.js`, menu |
| 13 | G4 | Medium | M | glossary in `i18n.js` and module strings, `docs/german-review.md` |
| 14 | the rest | Low | S to M | as listed |

Effort: S under an hour, M a few hours.

---

## 5 · HOW TO VERIFY

### Re-run the same walk after each fix

1. Serve `public/` on port 8765 (`python3 -m http.server 8765` in `public/`).
2. In a folder with `puppeteer-core` and `@sparticuz/chromium` installed, copy `tools/examples/lib.mjs` and `tools/ux/walk.mjs`. Adjust the import path if needed, then run `node walk.mjs 390 844` and `node walk.mjs 1280 860`. Read `ux/m-log.md` and `ux/d-log.md`, and the screenshots.
3. Run `tools/examples/audit.mjs` for the three samples (expects `ALL CHECKS PASSED`).
4. Check by hand on a real Android phone and an iPhone: back gesture (G1), on-screen keyboard over the action bar, German at 360 px (G8).
5. Acceptance for the blockers:
   - S1: in English, "Verkäuferin" matches "Verkäufer/Verkäuferin".
   - S2: a job can be re-matched without deleting it.
   - S3: with no matched job, the start button is disabled with an explanation, and no success toast appears.
   - B1: loading a sample over own data asks first, or keeps the own data aside.

---

## 6 · KNOWN LIMITATIONS, PRECISELY

- **Headless browser only.** The walk ran in headless Chromium. Real iOS Safari and Android Chrome behaviour was not tested, in particular the back gesture, the on-screen keyboard and `<dialog>` handling.
- **No real users.** Severity is judged against common practice, not observed with course participants. A short test with three to five participants would confirm the order.
- **Job matching was probed with eight titles.** Match quality across common German job titles is unknown. A list of the 50 most common titles in the target courses would measure it.
- **Accessibility only checked with axe** (WCAG 2 A and AA rules, all clean). No screen reader walk-through was done.
- **The 360 px overflow numbers are from the Robin Hood sample.** Labels for other states (for example "Continue with the cards" vs "Start the skill cards") can be longer or shorter.
- **Print output** of the summary was checked earlier (one page, English and German), not again in this audit.
- **B3 (shared computers)** is an assumption about the course setting, not confirmed with a course provider.
