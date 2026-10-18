import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/index.css";
import { initSettings } from "@/app/settings";
import { LegalPage } from "./LegalPage";
import { DatenschutzDe, DatenschutzEn } from "./datenschutz.content";

const TITLES = { de: "Datenschutz | From A to Job", en: "Privacy | From A to Job" };

initSettings();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LegalPage titles={TITLES} de={<DatenschutzDe />} en={<DatenschutzEn />} />
  </StrictMode>,
);
