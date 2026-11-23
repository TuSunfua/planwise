"use client";

import { useEffect, useState } from "react";

import { useHydrated } from "@/app/(auth)/sign-in/_components/use-hydrated";
import { Button } from "@/components/ui/button";

const WAIT_SECONDS = 30;

export function ResendButton({ pending }: { pending: boolean }) {
  const hydrated = useHydrated();
  const [left, setLeft] = useState(WAIT_SECONDS);
  const waiting = hydrated && left > 0;

  useEffect(() => {
    if (left === 0) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return (
    <Button type="submit" name="intent" value="resend" variant="link" disabled={pending || waiting}>
      {waiting ? `Send again in 0:${String(left).padStart(2, "0")}` : "Send again"}
    </Button>
  );
}
