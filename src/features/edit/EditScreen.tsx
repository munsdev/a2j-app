import { useEffect, useRef, useState } from "react";
import { go, useRoute } from "@/app/router";
import { NeedCatalog } from "@/app/NeedCatalog";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Page, PageHeader, Segmented } from "@/ui";
import { ProfileTab } from "./ProfileTab";
import { JobsTab } from "./JobsTab";
import { SkillsTab } from "./SkillsTab";
import { ItemsTab } from "./ItemsTab";
import { editStrings } from "./strings";
import { DupeCheck } from "@/features/merge/DupeCheck";

/* =================== EDIT MY DATA ===================
   Everything in one place, for changing many things at once. Most changes are also possible where the data
   is used (cards, goals, the plan); this screen is the full view. Tabs are routes: #edit/<tab>. */

const TABS = ["profile", "jobs", "skills", "courses", "ads"] as const;
type Tab = (typeof TABS)[number];
const isTab = (s: string | undefined): s is Tab => (TABS as readonly string[]).includes(s ?? "");

/* the tab row fades out at an edge where more tabs are hidden, so it reads as "this scrolls" */
const FADE = {
  none: "",
  right: "[mask-image:linear-gradient(90deg,#000_88%,transparent)]",
  left: "[mask-image:linear-gradient(90deg,transparent,#000_12%)]",
  both: "[mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]",
} as const;

export default function EditScreen() {
  const t = useT(editStrings);
  const route = useRoute();
  const tab: Tab = isTab(route.params[0]) ? route.params[0] : "profile";
  const label = (x: Tab) => t(`e_${x}`);
  const options = TABS.map((x) => ({ value: x, label: label(x) }));
  const row = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<keyof typeof FADE>("none");

  /* which edges hide tabs: on load, on resize (and a language switch), on scroll */
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const check = () => {
      const l = el.scrollLeft > 2;
      const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setFade(l && r ? "both" : l ? "left" : r ? "right" : "none");
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(check);
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", check);
      ro?.disconnect();
    };
  }, []);

  /* the chosen tab is always fully in view */
  useEffect(() => {
    const el = row.current?.querySelector<HTMLElement>(`#edit-tab-${tab}`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [tab]);

  return (
    <Page>
      <PageHeader title={t("e_title")} lede={t("e_lede")} />
      <DupeCheck />
      <div
        ref={row}
        className={cn(
          "-mx-1 flex snap-x scroll-px-2 [scrollbar-width:none] overflow-x-auto px-1 py-1 [&_[role=tab]]:snap-start",
          FADE[fade],
        )}
      >
        <Segmented
          role="tablist"
          idPrefix="edit"
          label={t("e_title")}
          value={tab}
          options={options}
          onChange={(v) => go("edit/" + v, { replace: true })}
          className="min-h-12 flex-none overflow-visible [&>button]:min-h-10 max-sm:[&>button]:px-3.5"
        />
      </div>
      <div
        role="tabpanel"
        id="edit-panel"
        aria-labelledby={`edit-tab-${tab}`}
        className="flex flex-col gap-[18px]"
      >
        {tab === "profile" ? (
          <ProfileTab />
        ) : (
          <NeedCatalog>
            {tab === "jobs" && <JobsTab />}
            {tab === "skills" && <SkillsTab />}
            {tab === "courses" && <ItemsTab kind="course" />}
            {tab === "ads" && <ItemsTab kind="jobad" />}
          </NeedCatalog>
        )}
      </div>
    </Page>
  );
}
