# Architecture

From A to Job is a static single-page app. No server, no accounts, no tracking: everything a person enters stays in
their browser's localStorage. It is built with **Vite + React 19 + TypeScript (strict) + Tailwind CSS v4**, uses
**Radix** primitives for dialogs and menus, **Zustand + Immer** for state, and is deployed as static assets on a
Cloudflare Worker. It works offline (service worker via `vite-plugin-pwa`).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload on http://localhost:5173 |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve `dist/` on http://localhost:8765 |
| `npm run verify` | Everything CI would run: typecheck, lint, format check, unit tests, build |
| `npm run e2e` | Playwright end-to-end tests (against the preview server) |
| `npm run deploy` | Build and deploy to Cloudflare (`wrangler.jsonc`) |
| `node tools/dev/shoot.mjs --hash goals --sample holmes` | Screenshot a screen with a sample profile loaded |

`.npmrc` sets `legacy-peer-deps`: npm 10 crashes resolving the optional peers of Vite 7 + Vitest 4
("Cannot read properties of null (reading 'edgesOut')"). Vite stays on 7.x until `vite-plugin-pwa` supports Vite 8.

## Folders

```
src/
  main.tsx            boot: settings, router, catalogue sync, service worker
  styles/
    tokens.css        DESIGN TOKENS: brand primitives → semantic roles (light, dark). Rebrand here.
    index.css         Tailwind, the token → utility mapping (@theme), type scale, base styles
  app/                the app frame and app-wide services
    App.tsx           shell + lazy routes
    shell/            TopBar (nav, language, menu), SampleBar, Footer, ErrorBoundary
    router.ts         hash routes, go(), useRoute()
    sheet.ts          openSheet(<Content/>, {label}) / closeSheet()
    toast.ts          toast(msg), toastUndo(msg)
    history.ts        performUndo / performRedo (with toast)
    settings.ts       language + theme (per browser, not in backups)
    samples.ts        sample profiles, own profile kept aside, changeLang()
    catalog.ts        useEsco(), useOnet(), useEscoReady(), catalogue ↔ language/jobs sync
    NeedCatalog.tsx   wrapper that loads the catalogue with a loading state
    prompts.ts        edited-text store for PromptBox
    install.ts        "Install the app"
  data/               the document: types, shape(), store with undo, samples
  domain/             pure logic, no React: catalogue search, skills/coverage, assessment, ranking
  i18n/               defineStrings(), useT(), makeT(); common.ts = shared words
  ui/                 the UI kit (import from "@/ui")
  features/<name>/    one folder per screen or area, owning its components and strings
  legal/              the three legal pages (separate HTML entries)
public/esco/          ESCO + O*NET data (built by tools/build_*.py)
public/icons/         app icons
```

## Rules of the codebase

**Styling.** Tailwind utilities on top of semantic tokens only: `bg-surface`, `text-ink-2`, `bg-have-bg`,
`rounded-panel`, `shadow-card`, `text-title`. Never a raw hex value or a Tailwind palette colour (they are switched
off). The type scale is `text-caption · small · body · lead · title · heading · display · hero`. Visuals that
utilities cannot express cleanly (the 3D card flip, the board's connectors, the print layout) go in a CSS file next
to the component, starting with `@reference "@/styles/index.css";` so it can use `@apply` and the tokens.
Dark mode comes from the tokens; `dark:` is rarely needed.

**Components.** Use the kit in `src/ui` first (Button, IconButton, LinkButton, Chip, ToggleChip, Tag, Field, Input,
Textarea, Select, Checkbox, Choice, Page, PageHeader, Panel, PanelTitle, Lede, Hint, Eyebrow, SubHeading, ButtonRow,
SkillBar, Track, StepPills, Segmented, ActionBar, EmptyState, PromptBox, SuggestInput, SkillTile, TileLegend,
TileGrid, RunHeader, Icon, Mascot). Components that only one feature needs live in that feature's folder.

**State.**
- The document (everything the person entered) lives in `@/data/store`. Read with a narrow selector:
  `useDoc(d => d.jobs)`. Change with `update(d => { ... })`: the recipe gets an Immer draft, mutate it freely.
  Each `update` is one undo step. Inside a run of questions use `update(fn, { quiet: true })` and call `commit()`
  when the run ends, so Undo takes back the run, not one answer.
- Domain helpers that change the document (`addJob`, `makeGoal`, `removeJob`, `setVote`, `addOwnSkill`, `setLevel`)
  take the draft: `update(d => makeGoal(d, id))`.
- Per-visit UI state (which card is flipped, the position in a run, the idea deck) is component state or a small
  Zustand store in the feature. Drop it when `useProfileEpoch` changes (a sample or backup replaced the data).
- The catalogue: wrap catalogue screens in `<NeedCatalog>`, then `useEscoReady()`. `useOnet()` may be null (the
  file can fail separately); everything must work without it.

**Text.** Every visible string is translated. A feature defines `strings.ts` with
`defineStrings({ ...en }, { ...de })` (the German object must have exactly the English keys) and calls
`const t = useT(strings)`; shared words are in `i18n/common.ts`. German uses Sie. Plain language: short sentences,
one idea each.

**Accessibility (WCAG 2.1 AA).** Real buttons and links; every icon-only button has an `aria-label`; toggles use
`aria-pressed`; touch targets at least 44px; visible focus (global `:focus-visible` ring); move focus to the new
question/heading when a step changes; announce counts and results with `aria-live` where they change in place;
respect `prefers-reduced-motion` (global). Colour is never the only signal: tile states also differ in shape and
icon.

**Routes.** `#home`, `#profile`, `#profile/<part>`, `#goals`, `#goals/ideas`, `#goals/job/<id>`, `#goals/compare`,
`#plan`, `#edit/<tab>`, `#backup`, `#backup/restore`. Navigate with `go(path)`. Browser Back closes an open sheet
first, then goes to the previous screen.

## Data format

The backup file is the document as JSON, format version 2 (see `src/data/types.ts` and README). Storage keys:
`a2j:v2` (document), `a2j:meta` (backup reminder), `a2j:own` (own profile while a sample is open), `a2j:lang`,
`a2j:theme`. These are unchanged from the previous app, so existing visitors keep their data.
