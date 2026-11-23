import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { cn } from "cn";

export const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 text-sm whitespace-nowrap select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-[120ms]",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-primary px-6 font-[750] text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed",
        secondary:
          "rounded-md border border-input bg-secondary px-4 font-semibold text-secondary-foreground hover:bg-muted",
        link: "rounded-sm font-semibold text-link underline-offset-4 hover:underline",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Button({ className, variant, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive data-slot="button" className={cn(buttonVariants({ variant }), className)} {...props} />;
}
