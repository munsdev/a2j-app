# Design system

The app's look is defined in one place, `src/styles/tokens.css`, and reaches every screen through Tailwind
utilities. This page is the map for the rebrand: what each token means, what to change, what to leave alone.

## How a rebrand works

1. **Change tier 1** (brand primitives in `tokens.css`): palette, font families, radii.
2. **Check tier 2** (semantic roles, light and dark): each role points at a primitive. Re-point a role only when
   the meaning moves (for example if "have" should no longer be the brand accent).
3. **Swap the brand assets**: `src/ui/Mascot.tsx` (the character, used for empty states and loading),
   `Wordmark` in `src/app/shell/TopBar.tsx`, the icons in `public/icons/`, the theme colour in `index.html`,
   `vite.config.ts` (manifest) and `src/app/settings.ts`. Fonts are npm packages imported at the top of
   `src/styles/index.css`.
4. Run `npm run e2e`: the accessibility scan checks colour contrast in both themes on every screen.

Components never use a raw colour, so nothing else needs to change.

## Colour roles

| Role | Utility | Meaning |
| --- | --- | --- |
| canvas | `bg-canvas` | the page background |
| surface, surface-2, sunk | `bg-surface` … | cards; panels inside cards; wells and tracks |
| ink, ink-2, ink-3 | `text-ink` … | text: primary, secondary, tertiary (also primary buttons) |
| line, line-2 | `border-line` … | hairlines; control borders |
| **have** (+ `-bg`, `-ink`) | `bg-have` … | a skill the person has; the brand accent; progress |
| **course** (+ `-bg`, `-ink`) | `bg-course` … | a skill a saved course covers |
| **learn** | `outline-learn` | a skill still to learn (always drawn dashed) |
| yes / no (+ `-bg`, `on-yes`, `on-no`) | `bg-yes` … | thumbs up / down, success / danger |
| on-accent | `text-on-accent` | text on a solid accent fill, both themes |
| focus | `outline-focus` | the keyboard focus ring |
| riasec-r … riasec-c | `text-riasec-r` … | the six interest-type letters |

The three skill states are the product's core visual language. They must stay distinguishable without colour:
**have** is a solid fill with a check, **course** a tint with a solid outline and a book, **learn** a dashed
outline. Keep that when choosing new colours.

## Type

Two families: a display face for headings and numbers (`font-display`), a text face for everything else
(`font-sans`). One scale, in rem so browser zoom works:

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

- Radii: `rounded-control` (14px: buttons, inputs), `rounded-card` (18px), `rounded-panel` (26px), and
  `rounded-full` for pills and chips.
- Shadows: `shadow-card` (resting), `shadow-lift` (hover, menus, sheets).
- Spacing: Tailwind's 4px grid. Screens use 18px between blocks, panels 18px padding.
- Motion: `animate-deal-in` (cards arriving), `animate-pop-in` (celebration), `animate-bob` (the guide waiting),
  sheet in/up. Everything stops under `prefers-reduced-motion`.

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
| `EmptyState`, `Mascot`, `Icon` | empty, finished and loading states; the guide; line icons |
| `PromptBox` | generated text the person can edit, copy and reset |
| `openSheet` (`@/app/sheet`), `toast` / `toastUndo` (`@/app/toast`) | dialogs and messages |
