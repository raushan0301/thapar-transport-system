const logger = require('../utils/logger');
const { ApiError } = require('../utils/errorTypes');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert non-ApiError errors
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message);
    }

    // Log error
    logger.error({
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    // Send error response
    res.status(error.statusCode).json({
        success: false,
        error: {
            message: error.message,
            statusCode: error.statusCode,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
    });
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
};

module.exports = {
    errorHandler,
    notFound
};
