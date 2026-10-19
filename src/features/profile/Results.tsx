import { useMemo, type ReactNode } from "react";
import { useEsco, useLoadCatalog } from "@/app/catalog";
import { openSheet } from "@/app/sheet";
import { jobsIn } from "@/data/doc";
import { useDoc } from "@/data/store";
import { assessOf, band, intResults, interestCode, partStatus, strongest } from "@/domain/assess";
import { skLabel } from "@/domain/catalog";
import { RULED_OUT, SETTING, VALUES } from "@/domain/items";
import { pick, useLang, useT } from "@/i18n";
import { Button, Chip, Chips, Disclosure, EmptyState, ExternalLink, Hint, Icon, SubHeading } from "@/ui";
import { AptitudeList } from "./AptitudeList";
import { IBANDS } from "./constants";
import { ratedSkills, settingPrefs, topSkills } from "./logic";
import { strings } from "./strings";
import { WantSheet } from "./WantSheet";

/* What we know so far: one card per finding, shown as soon as there is something to show. Cards flow in
   columns (no stretched empty cards), in reading order. */
export function Results() {
  const t = useT(strings);
  const lang = useLang();
  const doc = useDoc();
  const show = {
    strong: strongest(doc, lang).length > 0,
    code: intResults(doc, lang).length > 0,
    set: partStatus(doc, "set").done,
    val: assessOf(doc).values.length > 0,
    jobs: jobsIn(doc, "done").length > 0,
    skills: ratedSkills(doc.esco.rated).length > 0 || doc.esco.own.some((o) => o.level > 0),
  };
  const any = Object.values(show).some(Boolean);
  if (!any) return <EmptyState soft>{t("pr_none_yet")}</EmptyState>;
  return (
    <section aria-labelledby="pr-results" className="flex flex-col gap-3">
      <div className="mt-2.5 flex flex-col gap-1.5">
        <h2 id="pr-results" className="text-heading">
          {t("pr_results")}
        </h2>
        <p className="max-w-[72ch] text-small text-ink-3">
          {t("res_note")}{" "}
          <ExternalLink
            href="https://mein-now.de/new-plan/moeglichkeiten-testen/"
            icon={false}
            className="inline font-bold text-ink-2 underline underline-offset-3 hover:text-ink"
          >
            {t("res_note_link")}
          </ExternalLink>
          .
        </p>
      </div>
      <div className="mt-1 gap-3.5 md:columns-2 lg:columns-3 [&>*]:mb-3.5 [&>*]:break-inside-avoid">
        {show.strong && <Strengths />}
        {show.code && <InterestCode />}
        {show.set && <Setting />}
        {show.val && <Values />}
        {show.jobs && <Jobs />}
        {show.skills && <Skills />}
      </div>
    </section>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-panel bg-surface p-4.5 shadow-card">
      <div className="flex flex-col gap-1">
        <h3 className="text-title">{title}</h3>
        {sub && <Hint>{sub}</Hint>}
      </div>
      {children}
    </section>
  );
}

function Strengths() {
  const t = useT(strings);
  const lang = useLang();
  const doc = useDoc();
  const st = strongest(doc, lang);
  return (
    <Card title={t("res_strong")}>
      <Chips>
        {st.map((r) => (
          <Chip key={r.id} tone="have">
            {r.name}
          </Chip>
        ))}
      </Chips>
      <Disclosure summary={t("res_all")}>
        <AptitudeList />
      </Disclosure>
    </Card>
  );
}

function InterestCode() {
  const t = useT(strings);
  const lang = useLang();
  const doc = useDoc();
  const code = interestCode(doc, lang);
  const all = intResults(doc, lang).sort((x, y) => y.score - x.score || x.i - y.i);
  return (
    <Card title={t("res_code")} sub={t("res_code_p")}>
      <ol className="flex flex-col gap-1.5">
        {code.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3 rounded-option bg-surface-2 px-3 py-2.5">
            <span
              aria-hidden="true"
              className="flex size-7 flex-none items-center justify-center rounded-full bg-have font-display text-small font-extrabold text-on-accent"
            >
              {i + 1}
            </span>
            <span className="min-w-0 font-display text-title font-bold [overflow-wrap:anywhere] hyphens-auto">
              {c.name}
            </span>
          </li>
        ))}
      </ol>
      <ul className="flex flex-col gap-2">
        {all.map((r) => (
          <li
            key={r.id}
            className="grid grid-cols-[minmax(0,7rem)_1fr_5.75rem] items-center gap-2.5 text-small"
          >
            <span className="leading-tight">{r.name}</span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-sunk">
              <span
                className="block h-full rounded-full bg-have"
                style={{ width: `${((r.score - 1) / 4) * 100}%` }}
              />
            </span>
            <span className="text-caption text-ink-3">{pick(IBANDS, lang)[band(r.score)]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Setting() {
  const t = useT(strings);
  const lang = useLang();
  const { setting, ruledOut } = assessOf(useDoc());
  const prefs = settingPrefs(SETTING, setting, lang);
  const outs = RULED_OUT.filter((o) => ruledOut.includes(o.id));
  return (
    <Card title={t("res_set")}>
      {prefs.length ? (
        <Chips>
          {prefs.map((p) => (
            <Chip key={p.id}>{t(p.clearly ? "res_clearly" : "res_rather", { x: p.x })}</Chip>
          ))}
        </Chips>
      ) : (
        <Hint>{t("res_none")}</Hint>
      )}
      {outs.length > 0 && (
        <>
          <SubHeading className="mt-1 mb-0">{t("res_out")}</SubHeading>
          <Chips>
            {outs.map((o) => (
              <Chip key={o.id} tone="no">
                {pick(o, lang)}
              </Chip>
            ))}
          </Chips>
        </>
      )}
    </Card>
  );
}

function Values() {
  const t = useT(strings);
  const lang = useLang();
  const ids = useDoc((d) => d.assess.values);
  return (
    <Card title={t("res_val")}>
      <ol className="flex flex-col gap-2.5">
        {(ids ?? []).map((id, i) => {
          const v = VALUES.find((x) => x.id === id);
          if (!v) return null;
          const [name, desc] = pick(v, lang);
          return (
            <li key={id} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
              <span
                aria-hidden="true"
                className="flex size-6 items-center justify-center rounded-full bg-have-bg font-display text-small font-semibold text-have-ink"
              >
                {i + 1}
              </span>
              <span className="flex flex-col">
                <b className="font-bold">{name}</b>
                <span className="text-small text-ink-2">{desc}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Jobs() {
  const t = useT(strings);
  const jobs = useDoc((d) => d.jobs);
  return (
    <Card title={t("res_jobs")}>
      <ul className="flex flex-col gap-2.5">
        {jobs
          .filter((j) => j.role === "done")
          .map((j) => (
            <li key={j.id} className="flex flex-col">
              <b className="font-bold">{j.title}</b>
              {(j.org || j.when) && (
                <span className="text-small text-ink-3">{[j.org, j.when].filter(Boolean).join(" · ")}</span>
              )}
            </li>
          ))}
      </ul>
    </Card>
  );
}

/** Skills need the catalogue for their names: it is loaded when there are ratings to show. */
function Skills() {
  const t = useT(strings);
  const esco = useDoc((d) => d.esco);
  const E = useEsco();
  const rated = useMemo(() => ratedSkills(esco.rated), [esco.rated]);
  const own = esco.own.filter((o) => o.level > 0);
  useLoadCatalog(rated.length > 0);
  const top = useMemo(
    () => (E ? topSkills(esco.rated, esco.own, (i) => skLabel(E, i)) : []),
    [E, esco.rated, esco.own],
  );
  return (
    <Card title={t("res_skills")} sub={t("res_skills_n", { n: rated.length + own.length })}>
      {E || !rated.length ? (
        <>
          <Chips>
            {(E ? top : own.map((o) => o.name)).map((n, i) => (
              <Chip key={n + i} tone="have">
                {n}
              </Chip>
            ))}
          </Chips>
          {E && rated.length > 0 && (
            <Button
              size="sm"
              className="self-start"
              onClick={() => openSheet(<WantSheet />, { label: t("res_want") })}
            >
              <Icon name="up" />
              {t("res_want_btn")}
            </Button>
          )}
        </>
      ) : (
        <div role="status" className="flex flex-wrap gap-2" aria-label={t("loading")}>
          {[96, 132, 80, 118, 104, 70].map((w, i) => (
            <span key={i} className="h-7.5 animate-pulse rounded-full bg-surface-2" style={{ width: w }} />
          ))}
        </div>
      )}
    </Card>
  );
}
