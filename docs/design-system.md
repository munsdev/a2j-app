# Design system

The brand is **Workshop**: the route to a job drawn as a transit line, in the plain, sturdy look of work clothes
and timber. Everything visual is defined in one place, `src/styles/tokens.css`, and reaches every screen through
Tailwind utilities.

## The brand

- **Logo**: the line mark, three stops on one line: (A) — (to) — (Job). The start is a ringed stop, "to" a filled
  one (on the way), the job the last stop, an ink pill. `LineMark` draws it; `Wordmark` sets it next to the name
  "From A to Job". It also stands in wherever the app needs a picture: empty states, loading (`state="waiting"`,
  the middle stop pulses) and finished moments (`state="arrived"`, every stop filled). There is no mascot.
- **App icons**: `public/icons/` (the stops running diagonally down a pine square; the favicon drops the
  letters, which cannot be read at 16 px). `favicon.svg` is the source for the small ones.
- **Voice**: plain, honest then hopeful, on the person's side, steady. German uses "Sie".
- **What to avoid**: orange with navy (ING), Arbeitsagentur and Bahn red, the job boards' blues, XING teal,
  yellow with black. Checked against major brands, not a trademark register.

## How to change the look

1. **Tier 1** (brand primitives in `tokens.css`): palette, font families, radii.
2. **Tier 2** (semantic roles, light and dark): each role points at a primitive. Re-point a role only when the
   meaning moves.
3. **Brand assets**: `src/ui/LineMark.tsx`, `src/ui/Wordmark.tsx`, `public/icons/`, the theme colour in
   `index.html`, `vite.config.ts` (manifest) and `src/app/settings.ts`. Fonts are npm packages imported at the
   top of `src/styles/index.css`; their licences are collected into `licenses.txt` by `vite.licenses.ts`.
4. Run `npm run e2e`: the accessibility scan checks colour contrast in both themes on every screen.

Components never use a raw colour, so nothing else needs to change. The one exception is the plan's sheet of
paper (`src/features/plan/plan.css`), which uses the light primitives on purpose so it stays white in dark mode.

## Colour

| Primitive | Light | Use |
| --- | --- | --- |
| Paper | `#f3f1eb` | the page background |
| Pine ink | `#1c2b27` | text, primary buttons, the job stop |
| Green | `#2f6b4f` | the line: ground covered, skills you have, progress, yes |
| Course blue | `#2d5f86` | skills a saved course covers |
| Track | `#c3c9c4` | the line still ahead, dividers |
| Green tint | `#e2efe7` | soft highlights, the sample bar |
| Brick | `#c4512b` | the logo only (line mark, wordmark, app icons) |
| Red | `#b23c32` | no, ruled out, delete, errors |

Dark theme: pine-black surfaces (`#131a18`, `#1b2421`), a lighter green (`#6cc196`), blue (`#7fb0d8`) and
brick for the logo (`#e0714c`).

**One meaning per hue, everywhere.** Green is good (have, progress, done, yes), blue is a course, red is bad
(no, ruled out, delete, errors), ink is neutral and "selected". Brick is the brand and appears only in the logo,
so nothing good is ever drawn in a red-orange. Colour never carries meaning alone: a skill you have has a check,
a pressed chip a check (or a cross when it rules something out), a course a book.

| Role | Utility | Meaning |
| --- | --- | --- |
| canvas | `bg-canvas` | the page background |
| surface, surface-2, sunk | `bg-surface` … | cards; panels inside cards; wells and tracks |
| ink, ink-2, ink-3 | `text-ink` … | text: primary, secondary, tertiary (also primary buttons) |
| line, line-2 | `border-line` … | hairlines; control borders |
| **have** (+ `-bg`, `-ink`) | `bg-have` … | a skill the person has; the line behind them; progress |
| **course** (+ `-bg`, `-ink`) | `bg-course` … | a skill a saved course covers |
| **learn** | `outline-learn` | a skill still to learn (always drawn dashed or as an open ring) |
| yes / no (+ `-bg`, `on-yes`, `on-no`) | `bg-yes` … | thumbs up / down, success / danger |
| on-accent | `text-on-accent` | text and marks on a solid `have` fill |
| brand, on-brand | `fill-brand` … | the logo only |
| focus | `outline-focus` | the keyboard focus ring |
| riasec-r … riasec-c | `text-riasec-r` … | the six interest-type letters |

The three skill states are the product's core visual language and stay distinguishable without colour:
**have** is a solid fill with a check, **course** a ring or tint with a book, **learn** a dashed or open ring.
A skill you have that the route's course teaches again (the overlap) is **have** with a blue ring around it:
never a book, which would read as "the course covers it".

## Type

- **Barlow** (`font-display`, 600–800): headings and numbers. Drawn after California highway signs: plain,
  sturdy, read at a glance.
- **Atkinson Hyperlegible Next** (`font-sans`, variable): everything else. From the Braille Institute, made so
  letters cannot be mistaken for each other, which helps people reading German as a second language.

One scale, in rem so browser zoom works:

| Utility | Size | Use |
| --- | --- | --- |
| `text-caption` | 13px | tags, eyebrows, meta |
| `text-small` | 14px | hints, secondary lines |
| `text-body` | 16px | body |
| `text-lead` | 17px | ledes, large buttons |
| `text-title` | 19px | card and panel titles |
| `text-heading` | 24px | section and sheet headings |
| `text-display` | 28–40px fluid | page titles |
| `text-hero` | 32–50px fluid | the Home headline |

## Shape, depth, motion

- Radii are modest: `rounded-tile` 8px, `rounded-control` 10px (buttons, inputs), `rounded-option` 12px,
  `rounded-card` 14px, `rounded-panel` 16px, and `rounded-full` for pills, chips and stops.
- Depth is flat: `shadow-card` is a 1px ring with a hint of shadow; `shadow-lift` (menus, sheets) adds a soft one.
- Motion: `animate-deal-in` (cards arriving), `animate-pop-in` (arrival), `animate-stop-pulse` (the line mark
  waiting), sheet in/up. Everything stops under `prefers-reduced-motion`.

## Components

Import from `@/ui`. Each component documents its intent at the top of its file.

| Component | For |
| --- | --- |
| `Button` (`primary`, `soft`, `ghost`, `danger`, `danger-ghost`, `yes`, `no`; `sm`, `md`, `lg`; `asChild` for links) | every action |
| `IconButton`, `LinkButton` | icon-only actions (always with `aria-label`); low-emphasis text actions |
| `Chip`, `ToggleChip`, `Chips`, `Tag` | labels; multi-select choices; card metadata |
| `Field`, `FieldGrid`, `Input`, `Textarea`, `Select`, `Checkbox`, `Choice`, `SuggestInput` | forms |
| `Page`, `PageHeader`, `Panel`, `PanelTitle`, `Lede`, `Hint`, `Eyebrow`, `SubHeading`, `ButtonRow` | layout |
| `SkillTile`, `TileGrid`, `TileLegend`, `SkillBar` | the skill states |
| `Track`, `StepPills`, `RunHeader`, `ActionBar` | flows and progress |
| `Segmented` | tabs and two-way switches |
| `EmptyState`, `LineMark`, `Wordmark`, `Icon` | empty, waiting and finished states; the logo; line icons |
| `PromptBox` | generated text the person can edit, copy and reset |
| `openSheet` (`@/app/sheet`), `toast` / `toastUndo` (`@/app/toast`) | dialogs and messages |
