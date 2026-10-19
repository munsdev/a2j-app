/* Data sources, fonts and software licences. Licence attributions are required content: change them only on
   purpose and keep both languages in step. Updated October 2026 for the rebuilt app (fonts and software
   notices now in licenses.txt, generated on every build). */

export function CreditsDe() {
  return (
    <>
      <h1>Datenquellen</h1>
      <p>
        Alles hier Genannte wird mit dieser Website ausgeliefert. Ihr Browser verbindet sich mit keiner dieser
        Quellen.
      </p>
      <h2>ESCO</h2>
      <p>
        Berufe, Fähigkeiten und die Fähigkeitsgruppen hinter den Stärken stammen aus ESCO v1.2.1, der
        europäischen Klassifikation für Fähigkeiten, Kompetenzen, Qualifikationen und Berufe. Die ESCO-Säule
        Fähigkeiten nutzt Inhalte, die die Europäische Kommission auf europa.eu veröffentlicht.{" "}
        <a href="https://esco.ec.europa.eu/" target="_blank" rel="noopener">
          esco.ec.europa.eu
        </a>
      </p>
      <h2>O*NET®</h2>
      <p>
        Diese Website enthält Informationen aus der O*NET-31.0-Datenbank des US-Arbeitsministeriums,
        Employment and Training Administration (USDOL/ETA). Genutzt unter der Lizenz{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/deed.de" target="_blank" rel="noopener">
          CC BY 4.0
        </a>
        . O*NET® ist eine Marke von USDOL/ETA. From A to Job hat diese Informationen ganz oder teilweise
        verändert. USDOL/ETA hat diese Änderungen nicht genehmigt, unterstützt oder geprüft.
      </p>
      <p>Was verändert wurde:</p>
      <ul>
        <li>
          O*NET-Berufe wurden über die offizielle Zuordnung von ESCO zu O*NET (ESCO-Sekretariat mit USDOL/ETA,
          Fassung vom September 2022) mit ESCO-Berufen verknüpft. Hat ein ESCO-Beruf mehrere Verknüpfungen,
          wurden die Werte gemittelt und nach Art der Zuordnung gewichtet (genau 1,0, enger 0,8, nah 0,6,
          weiter 0,4).
        </li>
        <li>
          ESCO-Berufe ohne Zuordnung übernehmen die Werte des verknüpften ESCO-Berufs, mit dem sie die meisten
          Kernfähigkeiten teilen, wenn die Überschneidung groß genug ist. Sie sind als grobe Zuordnung
          gekennzeichnet.
        </li>
        <li>
          Verwendet werden: Interessenprofile (Career Interest Types, OI-Skala), Job Zones (als vier
          Vorbereitungsstufen dargestellt) und einige Angaben zum Arbeitsumfeld (Kontakt mit anderen,
          Kundschaft, draußen, Stehen, Sitzen, Bücken und Knien, Telefon, Fahrzeuge, wiederkehrende Aufgaben,
          unregelmäßige Arbeitszeiten), umgerechnet auf 0 bis 100.
        </li>
        <li>
          Das Skript dafür ist <code>tools/build_onet.py</code> im Quellcode.
        </li>
      </ul>
      <p>
        O*NET beschreibt Berufe in den USA. Vorbereitung und Arbeitsbedingungen in Deutschland können anders
        sein.
      </p>
      <h2>Schriften</h2>
      <p>
        Barlow von Jeremy Tribby (Überschriften) und Atkinson Hyperlegible Next vom Braille Institute (Text),
        unter der SIL Open Font License 1.1. Die Lizenztexte stehen in <a href="licenses.txt">licenses.txt</a>
        .
      </p>
      <h2>Software</h2>
      <p>
        Die App ist mit freier Software gebaut, darunter React, Radix UI, Zustand, Immer, Tailwind CSS und
        Workbox, unter der MIT-Lizenz und der Apache License 2.0. Die Hinweise und Lizenztexte aller
        mitgelieferten Bibliotheken stehen in <a href="licenses.txt">licenses.txt</a>.
      </p>
      <p>
        Der Quellcode dieser App ist selbst freie Software, unter der GNU Affero General Public License,
        Version 3 oder später: <a href="https://github.com/munsdev/a2j-app">github.com/munsdev/a2j-app</a>.
        Name und Logo sind davon ausgenommen.
      </p>
      <h2>Selbsteinschätzung</h2>
      <p>
        Alle Fragen wurden für dieses Werkzeug geschrieben. Die Stärken folgen den transversalen
        Fähigkeitsgruppen von ESCO, die Interessen dem RIASEC-Modell von John L. Holland und die sechs Werte
        den Arbeitswerten von O*NET. Sie ist eine Hilfe zur eigenen Einschätzung, kein geprüfter Test.
      </p>
    </>
  );
}

export function CreditsEn() {
  return (
    <>
      <h1>Data sources</h1>
      <p>
        Everything below is shipped with this site. Your browser does not connect to any of these sources.
      </p>
      <h2>ESCO</h2>
      <p>
        Occupations, skills and the skill groups behind the aptitudes come from ESCO v1.2.1, the European
        classification of Skills, Competences and Occupations. The ESCO Skills Pillar makes use of content
        published by the European Commission on europa.eu.{" "}
        <a href="https://esco.ec.europa.eu/" target="_blank" rel="noopener">
          esco.ec.europa.eu
        </a>
      </p>
      <h2>O*NET®</h2>
      <p>
        This site includes information from the O*NET 31.0 Database by the U.S. Department of Labor,
        Employment and Training Administration (USDOL/ETA). Used under the{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">
          CC BY 4.0 license
        </a>
        . O*NET® is a trademark of USDOL/ETA. From A to Job has modified all or some of this information.
        USDOL/ETA has not approved, endorsed, or tested these modifications.
      </p>
      <p>What was changed:</p>
      <ul>
        <li>
          O*NET occupations were linked to ESCO occupations through the official ESCO to O*NET crosswalk (ESCO
          Secretariat with USDOL/ETA, version of September 2022). Where an ESCO occupation has several links,
          the values were averaged, weighted by match type (exact 1.0, narrow 0.8, close 0.6, broad 0.4).
        </li>
        <li>
          ESCO occupations without a crosswalk link take the values of the linked ESCO occupation that shares
          the most essential skills, if the overlap is large enough. These are marked as rough matches.
        </li>
        <li>
          Used: interest profiles (Career Interest Types, OI scale), Job Zones (shown as four preparation
          levels), and a few Work Context measures (contact with others, customers, outdoors, standing,
          sitting, bending and kneeling, telephone, vehicles, repetitive tasks, irregular schedules), rescaled
          to 0 to 100.
        </li>
        <li>
          The build script is <code>tools/build_onet.py</code> in the source code.
        </li>
      </ul>
      <p>
        O*NET describes jobs in the United States. Preparation levels and working conditions in Germany can
        differ.
      </p>
      <h2>Fonts</h2>
      <p>
        Barlow by Jeremy Tribby (headings) and Atkinson Hyperlegible Next by the Braille Institute (text),
        under the SIL Open Font License 1.1. The license texts are in <a href="licenses.txt">licenses.txt</a>.
      </p>
      <h2>Software</h2>
      <p>
        The app is built with free software, including React, Radix UI, Zustand, Immer, Tailwind CSS and
        Workbox, under the MIT License and the Apache License 2.0. The notices and license texts of every
        library shipped with this site are in <a href="licenses.txt">licenses.txt</a>.
      </p>
      <p>
        The source code of this app is free software itself, under the GNU Affero General Public License,
        version 3 or later: <a href="https://github.com/munsdev/a2j-app">github.com/munsdev/a2j-app</a>. The
        name and logo are not included.
      </p>
      <h2>Self-assessment</h2>
      <p>
        All questions were written for this tool. The aptitudes follow the ESCO transversal skills groups, the
        interest types follow the RIASEC model by John L. Holland, and the six work values follow the O*NET
        work values. It is a self-assessment for reflection, not a validated test.
      </p>
    </>
  );
}
