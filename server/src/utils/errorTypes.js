/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Validation Error
 */
class ValidationError extends ApiError {
    constructor(message) {
        super(400, message);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication Error
 */
class AuthenticationError extends ApiError {
    constructor(message = 'Authentication failed') {
        super(401, message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization Error
 */
class AuthorizationError extends ApiError {
    constructor(message = 'Insufficient permissions') {
        super(403, message);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not Found Error
 */
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}

module.exports = {
    ApiError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError
};
