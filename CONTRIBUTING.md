# Contributing

Thank you for helping. From A to Job is for people in reorientation courses, many of them sent by the
Jobcenter or Arbeitsagentur, many of them not native German speakers. Every change is judged by one question:
does it make the app clearer, kinder or more useful for them?

Issues and pull requests are welcome in English or German. Beiträge auf Deutsch sind genauso willkommen.

## Before you start

- **Bugs**: open an issue with the steps, what you expected and what happened. Say which browser and device.
- **Ideas and larger changes**: open an issue first, so we can agree on the approach before you spend time on code.
- **Translations and wording**: corrections to the German or English text are very welcome. The strings live
  next to each screen in `src/features/*/strings.ts`.
- **Security problems**: do not open a public issue. See [SECURITY.md](SECURITY.md).

## Fixed principles

Some decisions are part of what the app is. Pull requests that change them will not be merged:

- **Nothing leaves the browser.** No accounts, no server-side storage of personal data, no analytics or
  tracking, no third-party scripts at runtime.
- **No AI connection.** The app writes prompts people can copy into their own AI chat; it never calls a model.
- **Accessible.** Every screen passes WCAG 2.1 AA in both languages and both themes, and works with a keyboard
  and a screen reader.
- **Plain language.** Short sentences and everyday words, German with "Sie". Match the tone of the existing
  strings.

## Development

Requires Node 22.

```sh
npm ci
npm run dev       # dev server with hot reload
npm run verify    # typecheck, lint, format check, unit tests, build
npm run e2e       # end-to-end and accessibility tests (Playwright)
```

Read [`docs/architecture.md`](docs/architecture.md) for the structure and coding rules and
[`docs/design-system.md`](docs/design-system.md) for tokens and components. In short:

- Components use the design tokens through Tailwind utilities, never raw colours.
- Every user-facing string exists in English and German (`defineStrings(en, de)` checks that both have the same
  keys).
- Domain logic in `src/domain` is pure and unit-tested.
- A new screen or state gets an end-to-end test, which also runs the accessibility scan.

## Pull requests

- Keep each pull request to one change, and describe what it changes for the person using the app.
- `npm run verify` and `npm run e2e` must pass. CI runs both on every pull request.
- Add screenshots for visual changes, on a phone width and a desktop width.

## Licence

By contributing you agree that your contribution is licensed under the
[GNU Affero General Public License v3.0 or later](LICENSE), the licence of this project. The name
"From A to Job" and the logo are not covered by that licence; see [TRADEMARKS.md](TRADEMARKS.md).

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
