# The job data

Everything the app knows about jobs and skills comes from open sources, with their credits. Values are taken
from a source or calculated from sources. Nothing is written, rated or estimated by hand. Where no open source
has a value, the field stays empty. Every source here may be reused without asking for permission.

The app ships the built files in `public/esco/` and loads them from its own site, so the browser never
connects to any source.

## Sources

| Source                                                                                                              | Licence                                                   | What we take                                                                                                                                                                                                                             | Updates                              |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [ESCO](https://esco.ec.europa.eu/) v1.2.1, European Commission                                                      | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Jobs, skills, which skills a job needs, skill groups, in English and German                                                                                                                                                              | A new version every one to two years |
| [O\*NET](https://www.onetcenter.org/database.html) 31.0, U.S. Department of Labor (USDOL/ETA)                       | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Interest profiles, preparation level (Job Zones), work context (contact, customers, outdoors, standing, sitting, bending, phone, vehicles, routine, schedules, heights, noise and contaminants), static strength. Numbers only, no text. | Yearly is plenty                     |
| [ESCO to O\*NET crosswalk](https://esco.ec.europa.eu/en/use-esco/other-crosswalks), ESCO Secretariat with USDOL/ETA | CC BY 4.0                                                 | Which O\*NET jobs match which ESCO jobs                                                                                                                                                                                                  | Rarely                               |
| German laws and regulations                                                                                         | Official works, free to reuse (§ 5 UrhG)                  | `german-level.csv`: the German level a job needs, only where a rule states it                                                                                                                                                            | When a rule changes                  |

The credits shown in the app are in `src/legal/credits.content.tsx`. Change them together with this table.

## How values are calculated

- O\*NET values are rescaled to 0 to 100. Where an ESCO job links to several O\*NET jobs, they are averaged,
  weighted by match type (exact 1.0, narrow 0.8, close 0.6, broad 0.4).
- ESCO jobs without a crosswalk link take the values of the linked ESCO job that shares the most essential
  skills (overlap 0.3 or more). The app marks these as rough matches.
- The German level is never averaged or borrowed: a job has one only if a rule names it.

## `german-level.csv`

Optional, one row per job, and only with a rule that states the level:

| Column            |                                                                   |
| ----------------- | ----------------------------------------------------------------- |
| `esco_occupation` | the English ESCO name of the job, exactly as in ESCO              |
| `level`           | CEFR level: A1, A2, B1, B2, C1 or C2                              |
| `rule`            | the law or regulation, with paragraph                             |
| `url`             | where the rule can be read, for example on gesetze-im-internet.de |

The build stops when a row names no rule or no link. Most jobs have no fixed level, so most will never have a
row.

## Rebuilding

```sh
# ESCO: the CSV download for each language from esco.ec.europa.eu (Download, CSV)
python3 tools/build_esco.py path/to/esco-en path/to/esco-de

# O*NET: the text database from onetcenter.org (db_31_0_text.zip) and the crosswalk CSV
python3 tools/build_onet.py ONET_\(Occupations\)_0_updated.csv path/to/db_31_0_text \
  public/esco/en.json public/esco/onet.json
```

Then run `npm run verify`: the parity test checks the job ideas against reference answers. A new source
version usually moves those answers; check the changes and update the reference on purpose.
