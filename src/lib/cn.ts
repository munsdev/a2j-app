import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* tailwind-merge needs to know the custom type scale, or text-body and text-ink would be treated as one group */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["caption", "small", "label", "body", "lead", "title", "heading", "display", "hero"] },
      ],
      shadow: [{ shadow: ["card", "lift", "ring", "ring-soft", "ring-strong", "selected"] }],
      rounded: [{ rounded: ["tile", "control", "option", "card", "panel"] }],
    },
  },
});

/** Join class names, later Tailwind utilities winning over earlier ones. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
