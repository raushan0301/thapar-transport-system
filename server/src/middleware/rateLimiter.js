const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/constants');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: {
            message: 'Too many requests from this IP, please try again later',
            statusCode: 429
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Strict rate limiter for file uploads
 */
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per 15 minutes
    message: {
        success: false,
        error: {
            message: 'Too many upload requests, please try again later',
            statusCode: 429
        }
    }
});

/**
 * Rate limiter for PDF/Excel generation
 */
const exportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 exports per 15 minutes
    message: {
        success: false,
        error: {
            message: 'Too many export requests, please try again later',
            statusCode: 429
        }
    }
});

module.exports = {
    apiLimiter,
    uploadLimiter,
    exportLimiter
};
