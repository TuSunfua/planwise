"use client";

import { useActionState, useEffect, useRef } from "react";

import { CodeInput } from "@/app/(auth)/sign-in/_components/code-input";
import { ResendButton } from "@/app/(auth)/sign-in/_components/resend-button";
import { signInAction } from "@/app/(auth)/sign-in/actions";
import type { SignInState } from "@/app/(auth)/sign-in/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionError } from "@/lib/actions";

const INITIAL_STATE: SignInState = { step: "email", email: "", sentAt: null, answers: 0, result: null };

function errorText(error: ActionError): string {
  if (error.code === "rate_limited") return "Too many tries. Wait an hour, then try again.";
  if (error.code === "unavailable") return "Email sign-in isn't available right now. Try again later.";
  if (error.fields?.email) return "Enter an email address like name@example.com.";
  if (error.fields?.code === "incomplete") return "Enter all 6 digits from the email.";
  if (error.fields?.code === "too_many_attempts") return "That code had too many tries. Send a new one.";
  if (error.fields?.code) return "That code is wrong or has expired. Check the newest email or send a new code.";
  return "That didn't work. Try again.";
}

function ErrorMessage({ id, text }: { id: string; text: string }) {
  return (
    <p id={id} role="alert" className="flex gap-2 text-sm text-danger">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0 fill-none stroke-current stroke-[1.5]">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.5M10 13.75v.01" strokeLinecap="round" />
      </svg>
      {text}
    </p>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, INITIAL_STATE, "/sign-in");
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Not on the first render: the page shouldn't grab focus as it loads.
    if (state === INITIAL_STATE || pending) return;
    form.current?.querySelector<HTMLInputElement>(`input[name="${state.step}"]`)?.focus();
  }, [state, pending]);

  const error = state.result?.ok === false ? errorText(state.result.error) : null;

  return (
    <form ref={form} action={action} noValidate aria-busy={pending} className="flex flex-col gap-6">
      {state.step === "email" ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px]/9 font-extrabold">Plan your day</h1>
            <p className="text-muted-foreground">Sign in or create an account. There&apos;s no password to remember.</p>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <Input
              key={`email-${state.email}`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={state.email}
              placeholder="name@example.com"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "sign-in-error" : undefined}
            />
            {error && <ErrorMessage id="sign-in-error" text={error} />}
          </div>
          <Button type="submit" name="intent" value="request" disabled={pending} className="w-full">
            {pending ? "Sending your code…" : "Email me a code"}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px]/9 font-extrabold">Check your email</h1>
            <p id="code-help" className="text-muted-foreground">
              Enter the 6-digit code we sent. It works for 10 minutes.
            </p>
            <p className="font-semibold break-all">{state.email}</p>
          </div>
          <input type="hidden" name="email" value={state.email} />
          <div className="flex flex-col gap-2">
            <label htmlFor="code" className="text-sm font-semibold">
              Code
            </label>
            <CodeInput
              key={state.answers}
              invalid={Boolean(error)}
              describedBy={error ? "sign-in-error" : "code-help"}
            />
            {error && <ErrorMessage id="sign-in-error" text={error} />}
          </div>
          {/* The first submit button is the one Enter presses. */}
          <Button type="submit" name="intent" value="verify" disabled={pending} className="w-full">
            {pending ? "One moment…" : "Sign in"}
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-x-4">
            <Button type="submit" name="intent" value="restart" variant="link" disabled={pending}>
              Use another email
            </Button>
            <ResendButton key={state.sentAt} pending={pending} />
          </div>
        </>
      )}
    </form>
  );
}
