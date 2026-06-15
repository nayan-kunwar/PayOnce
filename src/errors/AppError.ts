export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
    public readonly errors?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(message, 400, "VALIDATION_ERROR", errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Invalid or missing API key") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, "NOT_FOUND");
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(
    message = "Idempotency key was already used with a different request body",
  ) {
    super(message, 409, "IDEMPOTENCY_CONFLICT");
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: string, to: string) {
    super(
      `Cannot transition payment from '${from}' to '${to}'`,
      400,
      "INVALID_STATUS_TRANSITION",
    );
  }
}
