import { useEffect, type ReactNode } from "react";
import type { Lang } from "@/data/types";
import { setLang } from "@/app/settings";
import { Footer } from "@/app/shell/Footer";
import { useLang } from "@/i18n";
import { Wordmark } from "@/ui/Wordmark";
import { LangSwitch } from "@/ui/LangSwitch";
import "./legal.css";

/* The layout of the legal pages (Legal notice, Privacy, Data sources): the brand back to the app, a language
   switch, the text in the app's typography. The language is the app's (a2j:lang, else the browser's); the
   theme is set from storage by the script in the page head. */

export interface LegalPageProps {
  titles: Record<Lang, string>;
  de: ReactNode;
  en: ReactNode;
}

export function LegalPage({ titles, de, en }: LegalPageProps) {
  const lang = useLang();
  useEffect(() => {
    document.title = titles[lang];
    document.documentElement.lang = lang;
  }, [lang, titles]);

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-[max(16px,env(safe-area-inset-left))] py-2.5">
          {/* the brand at the size the app's top bar uses */}
          <a
            href="./"
            className="flex min-h-11 items-center gap-2 text-[1.125rem] no-underline md:text-[1.25rem]"
          >
            <Wordmark />
          </a>
          <LangSwitch onChange={setLang} />
        </div>
      </header>
      <main id="main" className="flex-1">
        <article
          lang={lang}
          className="legal mx-auto w-full max-w-[760px] px-[max(16px,env(safe-area-inset-left))] pt-8 pb-12 sm:pt-12"
        >
          {lang === "de" ? de : en}
        </article>
      </main>
      <Footer />
    </>
  );
}
