import { z } from "zod";

import { email } from "@/lib/schemas/fields";

export const requestCodeSchema = z.object({ email });

export const signInSchema = z.object({
  email,
  code: z
    .string()
    .max(32)
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{6}$/)),
});

export const signInIntentSchema = z.enum(["request", "resend", "verify", "restart"]);
