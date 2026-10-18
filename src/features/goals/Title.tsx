import { cn } from "@/lib/cn";
import { slashParts, titleForms } from "./layout";

/** A job title that may break after each slash ("Waiter/<wbr>waitress"), as the previous app did.
 *  split: a title with two forms ("Polizeibeamter …/Polizeibeamtin …") shows the first as the title and the
 *  other on a quieter second line, so a gendered German title does not take four lines on a phone. */
export function Title({
  text,
  split,
  subClassName,
}: {
  text: string;
  split?: boolean;
  subClassName?: string;
}) {
  const forms = split ? titleForms(text) : null;
  if (forms)
    return (
      <>
        {forms[0]}
        <span className={cn("mt-0.5 block font-sans text-small font-bold text-ink-3", subClassName)}>
          <span className="sr-only">/ </span>
          {forms[1]}
        </span>
      </>
    );
  const parts = slashParts(text);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}
