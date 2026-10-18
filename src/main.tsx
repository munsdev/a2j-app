import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles/index.css";
import { App } from "./app/App";
import { initRouter } from "./app/router";
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

/* installable app: an offline copy of the app files (never of the person's data) */
if ("serviceWorker" in navigator && location.protocol !== "file:") registerSW({ immediate: true });
