import { cn } from "cn";
import Image from "next/image";

const FILES = {
  full: { width: 440, height: 100 },
  horizontal: { width: 542, height: 116 },
} as const;

export function Logo({ variant, className }: { variant: keyof typeof FILES; className?: string }) {
  const size = FILES[variant];

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
