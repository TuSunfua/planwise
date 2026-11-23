"use client";

import { cn } from "cn";
import { useState } from "react";

import { useHydrated } from "@/app/(auth)/sign-in/_components/use-hydrated";
import { Input } from "@/components/ui/input";

const LENGTH = 6;
const BOXES = Array.from({ length: LENGTH }, (_, index) => index);

// One real input under six drawn boxes, so paste, autofill and screen readers work. Without JavaScript, a plain input.
export function CodeInput({ invalid, describedBy }: { invalid: boolean; describedBy: string }) {
  const hydrated = useHydrated();
  const [code, setCode] = useState("");
  const active = Math.min(code.length, LENGTH - 1);

  return (
    <div className="group relative">
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={hydrated ? code : undefined}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, LENGTH))}
        className={cn("h-14", hydrated && "absolute inset-0 z-10 opacity-0")}
      />
      {hydrated && (
        <div aria-hidden="true" className="grid grid-cols-6 gap-2">
          {BOXES.map((index) => (
            <span
              key={index}
              className={cn(
                "flex h-14 items-center justify-center rounded-md border bg-card text-2xl font-bold",
                invalid ? "border-danger" : "border-input",
                index === active &&
                  "group-focus-within:outline-2 group-focus-within:outline-offset-2 group-focus-within:outline-ring",
              )}
            >
              {code[index]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
