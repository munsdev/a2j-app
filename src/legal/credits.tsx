import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import { initSettings } from "@/app/settings";
import { LegalPage } from "./LegalPage";
import { CreditsDe, CreditsEn } from "./credits.content";

const TITLES = { de: "Datenquellen | From A to Job", en: "Data sources | From A to Job" };

initSettings();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LegalPage titles={TITLES} de={<CreditsDe />} en={<CreditsEn />} />
  </StrictMode>,
);
