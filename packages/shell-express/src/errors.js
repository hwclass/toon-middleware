export class TOONMiddlewareError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'TOONMiddlewareError';
    this.cause = cause;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof TOONMiddlewareError) {
    res.status(500).json({
      error: 'TOON_MIDDLEWARE_FAILURE',
      message: error.message
    });
    return;
  }

  next(error);
}

