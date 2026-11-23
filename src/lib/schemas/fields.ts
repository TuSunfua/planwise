import { z } from "zod";

export const EMAIL_MAX = 254; // characters
// Validated before lowercasing: lowercasing turns some look-alike letters into ASCII.
export const email = z
  .string()
  .trim()
  .max(EMAIL_MAX)
  .pipe(z.email())
  .transform((value) => value.toLowerCase());
