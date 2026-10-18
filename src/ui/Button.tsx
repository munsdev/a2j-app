import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/* Buttons. 48px tall by default (44px minimum touch target with room to spare), 40px for sm.
   primary: the one main action of a screen. soft: secondary. ghost: low emphasis.
   yes / no: the thumbs on job ideas. Use asChild to render a link that looks like a button. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 leading-tight font-extrabold whitespace-nowrap no-underline transition-[transform,background-color,box-shadow,color] duration-150 select-none active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-5",
  {
    variants: {
      variant: {
        primary:
          "bg-ink text-canvas shadow-[0_2px_0_rgb(0_0_0/.12)] hover:bg-[color-mix(in_srgb,var(--ink)_88%,var(--course))]",
        soft: "bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--line-2)] hover:shadow-[inset_0_0_0_1.5px_var(--ink-3)]",
        ghost: "bg-transparent text-ink-2 hover:bg-surface",
        danger: "bg-no text-white hover:brightness-105",
        "danger-ghost": "bg-transparent text-no hover:bg-no-bg",
        yes: "bg-yes text-on-yes hover:brightness-105",
        no: "bg-no-bg text-no hover:brightness-[.98]",
      },
      size: {
        sm: "min-h-10 rounded-[12px] px-3.5 text-small [&_svg]:size-[18px]",
        md: "min-h-12 rounded-control px-5 text-[0.97rem]",
        lg: "min-h-14 rounded-[18px] px-6.5 text-lead",
      },
      wide: { true: "w-full" },
    },
    defaultVariants: { variant: "soft", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, wide, asChild, type, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      data-variant={variant ?? "soft"}
      className={cn(buttonVariants({ variant, size, wide }), className)}
      {...rest}
    />
  );
});

/** A square icon-only button. Always give it an aria-label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }
>(function IconButton({ className, type, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "relative inline-flex size-11 flex-none items-center justify-center rounded-control text-ink transition-colors hover:bg-surface",
        className,
      )}
      {...rest}
    />
  );
});

/** Text that acts as a button: underlined, low emphasis. */
export const LinkButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function LinkButton({ className, type, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex min-h-11 items-center self-start font-bold text-ink-2 underline underline-offset-3 hover:text-ink",
          className,
        )}
        {...rest}
      />
    );
  },
);
