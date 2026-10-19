import { useDoc } from "@/data/store";
import { currentRoute } from "@/data/routes";
import { useRoute } from "@/app/router";
import { useT } from "@/i18n";
import { Icon } from "@/ui";
import { RouteDisc } from "./parts";
import { routeWords } from "./model";
import { strings } from "./strings";

/* The route you are on, under the top bar on Home, Goals (not the idea deck) and Plan (the screens that follow it; the profile
   is the same on every route). Tap it to switch, edit or start a route. Nothing before the first route. */
export function RouteBar() {
  const t = useT(strings);
  const { view, params } = useRoute();
  const d = useDoc();
  const r = currentRoute(d);
  /* not over the idea deck: a run of its own, the same on every route */
  const shows = view === "home" || view === "plan" || (view === "goals" && params[0] !== "ideas");
  if (!r || !shows) return null;
  const w = routeWords(d, r);
  return (
    <div className="mx-auto w-full max-w-[1100px] px-[max(16px,env(safe-area-inset-left))] pt-3 print:hidden">
      <button
        type="button"
        aria-haspopup="dialog"
        /* the sheets load with the screens that use them, not with the shell */
        onClick={() => void import("./actions").then((m) => m.openRouteList())}
        className="flex min-h-[52px] w-full items-center gap-3 rounded-card bg-ink py-1.5 pr-3.5 pl-2 text-left text-canvas transition-opacity hover:opacity-90 sm:w-auto sm:min-w-[360px]"
      >
        <RouteDisc id={r.id} className="bg-canvas text-ink shadow-none" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-caption opacity-80">{t("r_on", { x: r.id })}</span>
          <b className="truncate text-small sm:text-body">
            {w.job}
            <span className="font-normal opacity-80"> · {w.course?.name ?? t("r_no_course")}</span>
          </b>
        </span>
        <span className="flex flex-none items-center gap-1 text-small font-extrabold">
          {t("r_switch")}
          <Icon name="chev" className="size-4 rotate-90" />
        </span>
      </button>
    </div>
  );
}
