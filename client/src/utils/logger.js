/**
 * Logger utility for development and production environments
 * Automatically disables logs in production while keeping errors visible
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Log general information (disabled in production)
     */
    log: (...args) => {
        if (isDevelopment) {

        }
    },

    /**
     * Log errors (always enabled)
     */
    error: (...args) => {
    },

    /**
     * Log warnings (disabled in production)
     */
    warn: (...args) => {
        if (isDevelopment) {
        }
    },

    /**
     * Log debug information (disabled in production)
     */
    debug: (...args) => {
        if (isDevelopment) {
        }
    },

    /**
     * Log info (disabled in production)
     */
    info: (...args) => {
        if (isDevelopment) {
        }
    },

    /**
     * Group logs together (disabled in production)
     */
    group: (label, ...args) => {
        if (isDevelopment) {
            console.group(label);

            console.groupEnd();
        }
    },

    /**
     * Log table data (disabled in production)
     */
    table: (data) => {
        if (isDevelopment) {
            console.table(data);
        }
    },
};

export default logger;
