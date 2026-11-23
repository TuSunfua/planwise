import { cn } from "cn";
import Image from "next/image";

// docs/brand/README.md#which-file-to-use
const FILES = {
  full: { width: 440, height: 100 },
  horizontal: { width: 542, height: 116 },
} as const;

export function Logo({ variant, className }: { variant: keyof typeof FILES; className?: string }) {
  const size = FILES[variant];

  // Both files are in the page, and the theme hides one.
  return (
    <>
      <Image
        src={`/brand/logo-${variant}.svg`}
        alt="PlanWise"
        loading="eager"
        {...size}
        className={cn("block h-auto dark:hidden", className)}
      />
      <Image
        src={`/brand/logo-${variant}-dark.svg`}
        alt="PlanWise"
        loading="eager"
        {...size}
        className={cn("hidden h-auto dark:block", className)}
      />
    </>
  );
}
