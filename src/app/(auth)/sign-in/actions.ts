"use server";

import { redirect } from "next/navigation";

import { requestSignInCode, signInWithCode } from "@/data/auth";
import { runAction } from "@/lib/actions";
import type { Result } from "@/lib/actions";
import { EMAIL_MAX } from "@/lib/schemas/fields";
import { signInIntentSchema } from "@/lib/schemas/sign-in";

export interface SignInState {
  step: "email" | "code";
  email: string;
  // When the last code went out, in epoch milliseconds
  sentAt: number | null;
  // Counts answers, so the code boxes empty after each one.
  answers: number;
  result: Result<unknown> | null;
}

// One action for both steps, so the form also works before JavaScript has loaded.
export async function signInAction(previous: SignInState, form: FormData): Promise<SignInState> {
  const value = form.get("email");
  const typed = typeof value === "string" ? value.slice(0, EMAIL_MAX) : "";
  const intent = signInIntentSchema.safeParse(form.get("intent"));
  const answers = previous.answers + 1;

  if (!intent.success) {
    return { ...previous, answers, result: { ok: false, error: { code: "validation", message: "validation" } } };
  }

  switch (intent.data) {
    case "restart":
      return { step: "email", email: typed, sentAt: null, answers, result: null };

    case "request":
    case "resend": {
      const result = await runAction(() => requestSignInCode({ email: value }));
      if (result.ok) return { step: "code", email: result.data.email, sentAt: Date.now(), answers, result };
      const step = intent.data === "resend" ? "code" : "email";
      return { step, email: typed, sentAt: previous.sentAt, answers, result };
    }

    case "verify": {
      const result = await runAction(() => signInWithCode({ email: value, code: form.get("code") }));
      if (result.ok) redirect("/inbox");
      return { step: "code", email: typed, sentAt: previous.sentAt, answers, result };
    }
  }
}
