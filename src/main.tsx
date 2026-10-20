import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/index.css";
import { App } from "./app/App";
import { initRouter, onRouteChange } from "./app/router";
import { initSettings, useSettings } from "./app/settings";
import { initCatalogSync } from "./app/catalog";
import { initInstall } from "./app/install";
import { toast } from "./app/toast";
import { makeT, defineStrings } from "./i18n";
import { session } from "./lib/storage";

const S = defineStrings(
  { fin_done: "All data is deleted.", inst_done: "Installed. Open it from your home screen." },
  {
    fin_done: "Alle Daten sind gelöscht.",
    inst_done: "Installiert. Öffnen Sie die App vom Startbildschirm.",
  },
);
const t = () => makeT(useSettings.getState().lang, S);

initSettings();
initRouter();
initCatalogSync();
initInstall(() => toast(t()("inst_done")));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* after "Delete all data" the page reloads; say that it worked */
if (session.get("a2j:finished")) {
  session.remove("a2j:finished");
  setTimeout(() => toast(t()("fin_done")), 300);
}

/* installable app: an offline copy of the app files (never of the person's data). The browser only looks for a
   new version when a page is opened, and a phone or a browser tab keeps the app open for days, so also look when
   the app comes back to the front or the window gets focus, on every screen change, and once an hour, at most
   once a minute; a new version then takes over (the data stays, it is in localStorage). */
if ("serviceWorker" in navigator && location.protocol !== "file:")
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      let last = Date.now();
      const check = () => {
        if (document.visibilityState !== "visible" || !navigator.onLine || Date.now() - last < 60 * 1000)
          return;
        last = Date.now();
        void reg.update();
      };
      document.addEventListener("visibilitychange", check);
      window.addEventListener("focus", check);
      onRouteChange(check);
      setInterval(check, 60 * 60 * 1000);
    },
  });
