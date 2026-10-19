import { useDoc } from "@/data/store";
import { MAX_ROUTES, sortedRoutes } from "@/data/routes";
import { jobById } from "@/data/doc";
import { useEscoReady, useOnet } from "@/app/catalog";
import { go } from "@/app/router";
import { matchOf } from "@/domain/match";
import { useT } from "@/i18n";
import { Button, Icon } from "@/ui";
import { goRoute, openRouteSheet } from "./actions";
import { RouteDisc, Score } from "./parts";
import { routeWords } from "./model";
import { strings } from "./strings";

/* Under the board on Goals: the routes you are not on, small, one tap to switch; compare them all, or start
   another while there is room. Inside <NeedCatalog>. */
export function OtherRoutes() {
  const t = useT(strings);
  const d = useDoc();
  const E = useEscoReady();
  const O = useOnet();
  const all = sortedRoutes(d);
  const others = all.filter((r) => r.id !== d.route);
  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="routes-others">
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <h2 id="routes-others" className="text-title">
          {others.length ? t("r_others") : t("r_list_h")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {all.length >= 2 && (
            <Button size="sm" onClick={() => go("goals/compare")}>
              <Icon name="grid" />
              {t("r_compare")}
            </Button>
          )}
          {all.length < MAX_ROUTES && (
            <Button size="sm" onClick={() => openRouteSheet(null)}>
              <Icon name="plus" />
              {t("r_new")}
            </Button>
          )}
        </div>
      </div>
      {others.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-2.5">
          {others.map((r) => {
            const w = routeWords(d, r);
            const job = jobById(d, r.job);
            const m = job && (job.occ ?? -1) >= 0 ? matchOf(d, E, O, job.occ!, job, w.course) : null;
            return (
              <li key={r.id} className="flex">
                <button
                  type="button"
                  onClick={() => goRoute(r.id)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-card bg-surface py-3 pr-3.5 pl-3 text-left shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-lift"
                >
                  <RouteDisc id={r.id} />
                  <span className="flex min-w-0 flex-col">
                    <b className="font-display text-label leading-snug font-semibold break-words">{w.job}</b>
                    <span className="truncate text-small text-ink-3">
                      {w.course?.name ?? t("r_no_course")}
                    </span>
                  </span>
                  {m ? <Score m={m} /> : <Icon name="chev" className="text-ink-3" />}
                  <span className="sr-only">, {t("r_switch_to", { x: r.id })}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
