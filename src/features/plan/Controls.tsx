import type { ReactNode } from "react";
import type { Course, Lang, PlanSection, RouteId } from "@/data/types";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Button, Checkbox, Field, Icon, Panel, Select, Textarea } from "@/ui";
import type { PlanState } from "./model";
import { strings } from "./strings";

export type TextKey = "why" | "other" | "next";

/* The edit side of the plan: the page language, then each section with what belongs to it. A section's
   own fields sit under its checkbox, so the list reads top to bottom like the page. */
export function Controls({
  s,
  why,
  routes,
  route,
  course,
  className,
  onInc,
  onLang,
  onRoute,
  onType,
  onBlur,
  onSuggest,
}: {
  s: PlanState;
  why: string;
  /** the routes, as words for the picker */
  routes: { id: RouteId; label: string }[];
  route: RouteId | null;
  /** the course of the route, or null */
  course: Course | null;
  className?: string;
  onInc: (k: PlanSection, v: boolean) => void;
  onLang: (l: Lang) => void;
  onRoute: (id: RouteId) => void;
  onType: (k: TextKey, v: string) => void;
  onBlur: (k: TextKey) => void;
  onSuggest: () => void;
}) {
  const t = useT(strings);
  const check = (k: PlanSection) => (
    <Checkbox label={t(`sm_s_${k}`)} checked={s.inc[k]} onChange={(e) => onInc(k, e.target.checked)} />
  );
  const text = (k: TextKey, rows: number, ph: string, label: string, sr: boolean) => (
    <Field label={label} srLabel={sr}>
      {(p) => (
        <Textarea
          id={p.id}
          rows={rows}
          placeholder={ph}
          value={k === "why" ? why : s[k]}
          onChange={(e) => onType(k, e.target.value)}
          onBlur={() => onBlur(k)}
        />
      )}
    </Field>
  );
  return (
    <Panel aria-label={t("sm_tab_edit")} className={cn("gap-0", className)}>
      <Field label={t("sm_lang")}>
        {(p) => (
          <Select id={p.id} value={s.lang} onChange={(e) => onLang(e.target.value as Lang)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </Select>
        )}
      </Field>
      <Group>{check("head")}</Group>
      <Group>
        {check("goal")}
        <Nested>
          <Field label={t("sm_route_pick")} hint={t("sm_route_hint")}>
            {(p) => (
              <Select
                id={p.id}
                aria-describedby={p.hintId}
                value={route ?? ""}
                onChange={(e) => onRoute(e.target.value as RouteId)}
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {text("why", 4, t("sm_why_ph"), t("sm_why"), false)}
          <Button size="sm" className="self-start" onClick={onSuggest}>
            <Icon name="spark" />
            {t("sm_why_fill")}
          </Button>
        </Nested>
      </Group>
      <Group>
        {check("strengths")}
        {check("skills")}
        {check("gaps")}
      </Group>
      <Group>
        {check("course")}
        <Nested>
          <p className="text-small text-ink-2">
            <b className="text-ink">{t("sm_course_pick")}:</b> {course ? course.name : t("sm_none")}
          </p>
        </Nested>
      </Group>
      <Group>{check("evidence")}</Group>
      <Group>
        {check("other")}
        <Nested>{text("other", 3, t("sm_other_ph"), t("sm_s_other"), true)}</Nested>
      </Group>
      <Group>
        {check("next")}
        <Nested>{text("next", 4, t("sm_next_ph"), t("sm_s_next"), true)}</Nested>
      </Group>
    </Panel>
  );
}

const Group = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 first:mt-0 first:border-0 first:pt-0">
    {children}
  </div>
);
/* the rule lines up with the middle of the 22px checkbox above it */
function Nested({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 ml-[11px] flex flex-col gap-3 border-l-2 border-line pt-1 pb-1 pl-[21px]">
      {children}
    </div>
  );
}
