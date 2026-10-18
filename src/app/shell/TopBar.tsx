import { DropdownMenu } from "radix-ui";
import { go, useRoute, type View } from "@/app/router";
import { setTheme, useSettings } from "@/app/settings";
import { changeLang } from "@/app/samples";
import { doInstall, isStandalone, useInstall } from "@/app/install";
import { useDocStore } from "@/data/store";
import { hasOwnData } from "@/data/doc";
import { useT } from "@/i18n";
import { BRAND } from "@/i18n/common";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/ui/Icon";
import { Mascot } from "@/ui/Mascot";
import { Wordmark } from "@/ui/Wordmark";
import { LangSwitch } from "@/ui/LangSwitch";
import { openPrompts } from "@/features/prompts/api";
import { openDeleteAll, openSamplePicker } from "@/features/backup/sheets";

const NAV: { view: View; icon: IconName; key: "nav_profile" | "nav_goals" | "nav_plan" }[] = [
  { view: "profile", icon: "person", key: "nav_profile" },
  { view: "goals", icon: "flag", key: "nav_goals" },
  { view: "plan", icon: "doc", key: "nav_plan" },
];

export function TopBar() {
  const t = useT();
  const route = useRoute();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--canvas)_82%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-[14px] backdrop-saturate-[1.4] print:hidden">
      <div className="mx-auto grid max-w-[1100px] grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-[max(16px,env(safe-area-inset-left))] py-2.5 md:grid-cols-[auto_1fr_auto]">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
          className="col-start-1 row-start-1 flex items-center gap-2 text-[1.125rem] no-underline md:text-[1.25rem]"
          aria-label={`${BRAND}, ${t("nav_home")}`}
        >
          <Mascot size={34} />
          <Wordmark className="max-[360px]:text-base" />
        </a>
        <nav
          aria-label={t("nav_aria")}
          className="col-span-full row-start-2 flex gap-1 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--line)] md:col-span-1 md:col-start-2 md:row-start-1 md:justify-center md:bg-transparent md:p-0 md:shadow-none"
        >
          {NAV.map((n) => {
            const on = route.view === n.view;
            return (
              <a
                key={n.view}
                href={"#" + n.view}
                aria-current={on ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(n.view);
                }}
                className={cn(
                  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-1.5 py-2 text-[0.9rem] font-extrabold text-ink-2 no-underline transition-colors md:flex-none md:px-4 md:py-2.5 md:text-[0.94rem]",
                  on ? "bg-ink text-canvas" : "hover:bg-surface",
                )}
              >
                <Icon name={n.icon} className="max-[360px]:hidden" />
                <span>{t(n.key)}</span>
              </a>
            );
          })}
        </nav>
        <div className="col-start-2 row-start-1 flex items-center gap-1.5 md:col-start-3">
          <LangSwitch onChange={(l) => void changeLang(l)} />
          <AppMenu />
        </div>
      </div>
    </header>
  );
}

const itemCls =
  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[0.94rem] font-bold text-ink outline-none select-none data-[highlighted]:bg-surface-2";

function AppMenu() {
  const t = useT();
  const dark = useSettings((s) => s.theme === "dark");
  const canInstall = useInstall((s) => !!s.evt);
  const backupDue = useDocStore((s) => !s.doc.example && s.meta.changes > 0 && hasOwnData(s.doc));
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className="relative inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-surface data-[state=open]:bg-surface"
        aria-label={backupDue ? `${t("menu")}. ${t("menu_backup_due")}` : t("menu")}
      >
        <Icon name="menu" />
        {backupDue && (
          <span className="absolute top-[9px] right-[9px] size-[9px] rounded-full bg-have shadow-[0_0_0_2px_var(--canvas)]" />
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="z-40 flex min-w-[260px] flex-col rounded-card border border-line bg-surface p-2 shadow-lift data-[state=open]:animate-fade-in"
        >
          <DropdownMenu.Item className={itemCls} onSelect={() => go("home")}>
            {t("nav_home")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemCls} onSelect={() => openPrompts()}>
            {t("menu_prompts")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemCls} onSelect={() => go("edit")}>
            {t("menu_edit")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemCls} onSelect={() => go("backup")}>
            {t("menu_backup")}
            {backupDue && <span className="size-2 rounded-full bg-have" aria-hidden="true" />}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemCls} onSelect={() => go("backup/restore")}>
            {t("menu_restore")}
          </DropdownMenu.Item>
          <DropdownMenu.Item className={itemCls} onSelect={() => openSamplePicker()}>
            {t("menu_sample")}
          </DropdownMenu.Item>
          <DropdownMenu.CheckboxItem
            className={itemCls}
            checked={dark}
            onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
            onSelect={(e) => e.preventDefault()}
          >
            {t("menu_dark")}
            <span
              aria-hidden="true"
              className={cn(
                "relative h-6 w-10 flex-none rounded-xl transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-[18px] after:rounded-full after:bg-white after:transition-transform",
                dark ? "bg-ink after:translate-x-4" : "bg-line-2",
              )}
            />
          </DropdownMenu.CheckboxItem>
          {canInstall && !isStandalone() && (
            <DropdownMenu.Item className={itemCls} onSelect={() => void doInstall()}>
              {t("menu_install")}
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-line" />
          <DropdownMenu.Item className={cn(itemCls, "text-no")} onSelect={() => openDeleteAll()}>
            {t("menu_delete")}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="mx-1 my-1.5 h-px bg-line" />
          {(
            [
              ["impressum.html", "imprint"],
              ["datenschutz.html", "privacy"],
              ["credits.html", "credits"],
            ] as const
          ).map(([href, k]) => (
            <DropdownMenu.Item
              key={k}
              asChild
              className={cn(itemCls, "min-h-9 py-2 text-small font-semibold text-ink-2")}
            >
              <a href={href}>{t(k)}</a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
