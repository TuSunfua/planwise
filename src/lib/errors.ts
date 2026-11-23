export type ErrorCode = "unauthenticated" | "forbidden" | "not_found" | "validation" | "rate_limited" | "unavailable";

// The message is for logs. The UI picks its text from the code and the field reasons.
export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.fields = fields;
  }
}

export class NotAuthenticated extends AppError {
  readonly code = "unauthenticated";
}

export class PermissionDenied extends AppError {
  readonly code = "forbidden";
}

export class NotFound extends AppError {
  readonly code = "not_found";
}

export class InvalidRequest extends AppError {
  readonly code = "validation";
}

export class TooManyRequests extends AppError {
  readonly code = "rate_limited";
}

export class ServiceUnavailable extends AppError {
  readonly code = "unavailable";
}
