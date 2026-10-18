import { useLayoutEffect, useRef } from "react";
import type { Block, PageModel } from "./model";

/** The printable height of an A4 page with 14 mm margins, in CSS pixels. */
const PRINT_H = ((297 - 28) / 25.4) * 96;

/** The plan as a typeset page. Everything on it comes from the page model, in the page language.
 *  A hidden copy in the print layout measures the page; a page that would run over is scaled to fit one A4. */
export function Paper({ model }: { model: PageModel }) {
  const page = useRef<HTMLElement>(null);
  const measure = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const h = measure.current?.scrollHeight ?? 0;
      page.current?.style.setProperty("--fit", h > PRINT_H ? String(Math.max(0.6, (PRINT_H - 4) / h)) : "1");
    };
    fit();
    void document.fonts?.ready.then(fit);
  }, [model]);
  return (
    <>
      <article ref={page} lang={model.lang} className="sheetpage">
        <PageBody model={model} />
      </article>
      <article ref={measure} aria-hidden="true" inert className="sheetpage sp-measure">
        <PageBody model={model} />
      </article>
    </>
  );
}

function PageBody({ model }: { model: PageModel }) {
  return (
    <>
      <header className="sp-head">
        <div className="min-w-0">
          <p className="sp-eyebrow">{model.eyebrow}</p>
          <h1 className="sp-title">{model.title}</h1>
          {model.contact && <p className="sp-contact">{model.contact}</p>}
        </div>
        <p className="sp-date">{model.date}</p>
      </header>
      {model.sections.map((s) => (
        <section key={s.k} className="sp-sec">
          <h2>{s.heading}</h2>
          {s.blocks.map((b, i) => (
            <PaperBlock key={i} b={b} />
          ))}
        </section>
      ))}
    </>
  );
}

function PaperBlock({ b }: { b: Block }) {
  if (b.t === "table")
    return (
      <table className="sp-tab">
        <tbody>
          {b.rows.map(([k, v]) => (
            <tr key={k}>
              <th scope="row">{k}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  if (b.t === "list")
    return (
      <ul className={b.cols ? "sp-cols" : undefined}>
        {b.items.map((it, i) => (
          <li key={i}>
            {it.strong ? <b>{it.name}</b> : it.name}
            {it.detail && <>, {it.detail}</>}
            {it.via && <span className="sp-via"> ({it.via})</span>}
            {it.url && <span className="sp-url">{it.url}</span>}
          </li>
        ))}
      </ul>
    );
  const cls =
    b.tone === "goal"
      ? "sp-goal"
      : b.tone === "note"
        ? "sp-note"
        : b.tone === "pending"
          ? "sp-pending"
          : "sp-text";
  return (
    <p className={cls}>
      {b.lead && <span className="sp-lead">{b.lead}: </span>}
      {b.text}
    </p>
  );
}
