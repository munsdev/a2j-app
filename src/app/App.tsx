import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from "react";
import { useRoute, type View } from "./router";
import { useDocStore } from "@/data/store";
import { useT } from "@/i18n";
import { TopBar } from "./shell/TopBar";
import { SampleBar } from "./shell/SampleBar";
import { Footer } from "./shell/Footer";
import { ErrorBoundary } from "./shell/ErrorBoundary";
import { SheetHost } from "@/ui/SheetHost";
import { ToastHost } from "@/ui/ToastHost";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";
import { Page } from "@/ui/Layout";
import { Mascot } from "@/ui/Mascot";
import { performRedo, performUndo } from "./history";
import { go } from "./router";
import { isShortcutBlocked } from "@/lib/keys";

/* Each screen is its own chunk, loaded when first opened. */
const SCREENS: Record<View, LazyExoticComponent<ComponentType>> = {
  home: lazy(() => import("@/features/home/HomeScreen")),
  profile: lazy(() => import("@/features/profile/ProfileScreen")),
  goals: lazy(() => import("@/features/goals/GoalsScreen")),
  plan: lazy(() => import("@/features/plan/PlanScreen")),
  edit: lazy(() => import("@/features/edit/EditScreen")),
  backup: lazy(() => import("@/features/backup/BackupScreen")),
};

/** Between screens, while a screen's code arrives: nothing for 300ms (usually it is there by then), then the
 *  guide, so a slow connection never shows a blank page. */
function ScreenLoading() {
  return (
    <div className="flex min-h-[60vh] [animation:fade-in_.3s_ease-out_.3s_forwards] items-center justify-center opacity-0">
      <Mascot size={48} mood="think" className="animate-bob" />
    </div>
  );
}

function NotFound() {
  const t = useT();
  return (
    <Page>
      <EmptyState
        title={t("not_found_h")}
        actions={
          <Button variant="primary" onClick={() => go("home", { replace: true })}>
            {t("nav_home")}
          </Button>
        }
      >
        {t("not_found_p")}
      </EmptyState>
    </Page>
  );
}

function StorageWarning() {
  const t = useT();
  const ok = useDocStore((s) => s.storageOk);
  if (ok) return null;
  return (
    <p role="alert" className="bg-no-bg px-4 py-2.5 text-center font-bold text-no print:hidden">
      {t("store_warn")}
    </p>
  );
}

/* Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y undo and redo, except while typing in a field */
function useUndoKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isShortcutBlocked(e, { allowModifiers: true })) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        performRedo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
}

export function App() {
  const t = useT();
  const route = useRoute();
  useUndoKeys();
  const Screen = SCREENS[route.view];
  return (
    <>
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="fixed top-2 -left-[999px] z-[100] rounded-[10px] bg-ink px-3.5 py-2 text-canvas focus:left-3"
      >
        {t("skiplink")}
      </a>
      <TopBar />
      <SampleBar />
      <StorageWarning />
      <main id="main" tabIndex={-1} className="flex-1 outline-none" data-view={route.view}>
        <ErrorBoundary resetKey={route.path}>
          <Suspense fallback={<ScreenLoading />}>{route.unknown ? <NotFound /> : <Screen />}</Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <SheetHost />
      <ToastHost />
    </>
  );
}
