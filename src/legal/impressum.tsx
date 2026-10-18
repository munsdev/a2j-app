import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import { initSettings } from "@/app/settings";
import { LegalPage } from "./LegalPage";
import { ImpressumDe, ImpressumEn } from "./impressum.content";

const TITLES = { de: "Impressum | From A to Job", en: "Legal notice | From A to Job" };

initSettings();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LegalPage titles={TITLES} de={<ImpressumDe />} en={<ImpressumEn />} />
  </StrictMode>,
);
