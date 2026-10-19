# From A to Job · a2j.app

A browser-only career orientation app for people in reorientation courses (Arbeitsagentur, Jobcenter): find out what you are good at, choose a job to aim for, find the courses that get you there, and take a one-page plan to your counselling meeting.

- No accounts, no server, no AI connection, no tracking. Everything stays in the visitor's browser.
- English and German, switchable at any time. The German interface uses Sie.
- Undo and redo for every change, backup to a JSON file and back. Installable, works offline.
- Accessible: every screen passes an automated WCAG 2.1 AA scan in both languages and both themes.

## The three stages

- **Profile**: six short parts, one question or card per screen. How you work (15 aptitudes, 45 items), what you enjoy (6 RIASEC interest types, 18 items), where you want to work, what matters (3 of 6 work values), your story (jobs so far and jobs you are thinking about, matched to the ESCO catalogue as you type), and your skills (the skills of your past jobs, rated one card at a time).
- **Goals**: every job is a card that turns over to show its skills (you have it, a saved course covers it, still to learn). Job ideas come as a deck ranked by interests, skills and reactions, without AI. Compare up to three jobs, make one your main goal and follow its board from "You" to the job. Each goal has its courses and job ads, found through mein NOW, search words, or an editable AI prompt whose answer can be pasted back.
- **Plan**: the one-page summary for the meeting, built from the main goal, printable on one A4 page and copyable, in either language.

## Development

Requires Node 22. `npm ci`, then:

| Command           |                                                  |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | dev server with hot reload                       |
| `npm run verify`  | typecheck, lint, format check, unit tests, build |
| `npm run e2e`     | end-to-end and accessibility tests (Playwright)  |
| `npm run preview` | serve the production build on :8765              |
| `npm run deploy`  | build and deploy to Cloudflare                   |

The stack (Vite, React 19, TypeScript strict, Tailwind CSS v4, Radix, Zustand + Immer), folder structure and coding rules are in [`docs/architecture.md`](docs/architecture.md). Colours, type, components and how to rebrand are in [`docs/design-system.md`](docs/design-system.md). CI runs `verify` and the end-to-end tests on every pull request.

## Hosting

Live at https://a2j.app, served by the `a2j-app` Cloudflare Worker (`wrangler.jsonc`, `worker.js`): the built app from `dist/` as static assets, with www.a2j.app and the old cms.muns.dev redirected to a2j.app. Cloudflare Workers Builds deploys every push to `main` (build command `npm run build`, deploy command `npx wrangler deploy`) and gives other branches a preview URL. The domains are attached to the Worker in the Cloudflare dashboard. `npm run check` builds and does a dry run locally. Browser storage keys start with `a2j:`.

## Data

ESCO v1.2.1 classification of the European Commission, free to reuse with attribution, in English and German. To update or add a language, download the XML from esco.ec.europa.eu and run `python3 tools/build_esco_xml.py esco-v1.2.1.xml en de`.

O*NET 31.0 Database by USDOL/ETA, used under CC BY 4.0 and modified (see the Data sources page, `src/legal/credits.content.tsx`). Interest profiles, Job Zones and a few Work Context measures are linked to ESCO occupations through the ESCO to O*NET crosswalk. To rebuild: download the crosswalk CSV from the ESCO portal and `db_31_0_text.zip` from onetcenter.org, unzip, and run `python3 tools/build_onet.py ONET_Occupations_0_updated.csv db_31_0_text public/esco/en.json public/esco/onet.json`. With 31.0, 89.6% of ESCO occupations get a profile.

Search links: mein NOW `https://mein-now.de/weiterbildungssuche/?sw=<term>`, Jobbörse `https://www.arbeitsagentur.de/jobsuche/suche?angebotsart=1&was=<term>&wo=<town>&umkreis=25`, both with the German ESCO label.

## File format (version 2)

```json
{
  "app": "a2j",
  "version": 2,
  "profile": {
    "name": "",
    "location": "",
    "languages": "",
    "contact": "",
    "german": "b1",
    "computer": "daily",
    "situation": "",
    "current": "",
    "want": "",
    "avoid": "",
    "hours": "",
    "place": "",
    "limits": "",
    "hobbies": "",
    "projects": "",
    "coursePrefs": { "lang": "de", "where": "near", "time": "any", "start": "any", "voucher": true }
  },
  "jobs": [
    {
      "id": "j1",
      "title": "",
      "occ": 1151,
      "role": "done | goal | maybe",
      "org": "",
      "when": "",
      "current": false,
      "extra": ["needs outside the catalogue"]
    }
  ],
  "mainGoal": "j1",
  "esco": {
    "rated": { "662": 3 },
    "own": [{ "name": "", "level": 3, "esco": 662 }],
    "want": { "662": 1 },
    "votes": [{ "o": 1151, "d": 1, "sk": [[662, -1]], "ctx": [] }],
    "hidden": [],
    "more": false
  },
  "assess": {
    "answers": { "plan_1": 4 },
    "adjusted": {},
    "setting": { "people": 2 },
    "ruledOut": [],
    "values": [],
    "done": { "apt": "2026-10-17" }
  },
  "courses": [
    {
      "id": "c1",
      "name": "",
      "provider": "",
      "url": "",
      "start": "",
      "length": "",
      "azav": "provider",
      "goals": ["j1"],
      "covers": [662, "Computer basics"],
      "status": "interested",
      "notes": ""
    }
  ],
  "jobads": [
    {
      "id": "a1",
      "name": "",
      "org": "",
      "place": "",
      "url": "",
      "deadline": "",
      "goals": ["j1"],
      "status": "interested"
    }
  ],
  "summary": { "lang": "en", "goal": "j1", "course": "c1", "inc": {}, "why": "", "other": "", "next": "" }
}
```

Skill ratings are the only record of what someone can do: a job's missing skills, where a skill came from and coverage are worked out when shown. Backups from the first format are refused.

## Contributing

Bug reports, wording fixes, translations and code are welcome, in English or German. Read
[CONTRIBUTING.md](CONTRIBUTING.md) first: it lists the principles every change keeps (nothing leaves the browser,
no AI connection, accessible, plain language). Security problems go by email, see [SECURITY.md](SECURITY.md).
Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licence

Copyright © 2026 Casey Muns.

The source code is free software: you can redistribute it and/or modify it under the terms of the
[GNU Affero General Public License](LICENSE) as published by the Free Software Foundation, version 3 or (at your
option) any later version. If you run a modified copy as a website, you must offer its source code to its users.

The name "From A to Job", the domain a2j.app and the logo (the A, to, Job line mark) are not covered by this licence, see
[TRADEMARKS.md](TRADEMARKS.md). Third-party data and libraries keep their own licences: ESCO (European
Commission, free reuse with attribution), O*NET (USDOL/ETA, CC BY 4.0), the fonts (SIL Open Font License 1.1)
and the npm packages listed in the generated `licenses.txt`.
