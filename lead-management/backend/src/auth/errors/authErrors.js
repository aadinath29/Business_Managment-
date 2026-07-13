const { ERROR_CODES } = require('../constants/authConstants');

/**
 * Base custom error class for the application
 */
class AppError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

class InvalidCredentialsError extends AppError {
  constructor(message = 'Invalid email or password') {
    super(message, 401, ERROR_CODES.INVALID_CREDENTIALS);
  }
}

class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 401, ERROR_CODES.TOKEN_EXPIRED);
  }
}

class TokenInvalidError extends AppError {
  constructor(message = 'Token signature is invalid') {
    super(message, 401, ERROR_CODES.TOKEN_INVALID);
  }
}

class TokenMissingError extends AppError {
  constructor(message = 'Authentication token is missing') {
    super(message, 401, ERROR_CODES.TOKEN_MISSING);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to access this resource') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

class InactiveUserError extends AppError {
  constructor(message = 'Your user account is inactive') {
    super(message, 403, ERROR_CODES.INACTIVE_USER);
  }
}

class DeletedUserError extends AppError {
  constructor(message = 'Your user account has been deleted') {
    super(message, 403, ERROR_CODES.DELETED_USER);
  }
}

class InvalidSessionError extends AppError {
  constructor(message = 'Invalid or expired login session') {
    super(message, 401, ERROR_CODES.INVALID_SESSION);
  }
}

class TenantMismatchError extends AppError {
  constructor(message = 'Tenant isolation conflict detected') {
    super(message, 403, ERROR_CODES.TENANT_MISMATCH);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR);
    this.details = details;
  }
}

module.exports = {
  AppError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,
  TokenMissingError,
  UnauthorizedError,
  ForbiddenError,
  InactiveUserError,
  DeletedUserError,
  InvalidSessionError,
  TenantMismatchError,
  ValidationError
};
