module.exports = {
    // Server
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

    // File Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf'
    ],

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

    // User Roles
    ROLES: {
        USER: 'user',
        HEAD: 'head',
        ADMIN: 'admin',
        REGISTRAR: 'registrar',
        DRIVER: 'driver'
    },

    // Request Status
    REQUEST_STATUS: {
        PENDING_HEAD: 'pending_head',
        PENDING_ADMIN: 'pending_admin',
        PENDING_REGISTRAR: 'pending_registrar',
        APPROVED_AWAITING_VEHICLE: 'approved_awaiting_vehicle',
        VEHICLE_ASSIGNED: 'vehicle_assigned',
        TRAVEL_COMPLETED: 'travel_completed',
        CLOSED: 'closed',
        REJECTED: 'rejected'
    },

    // Vehicle Types
    VEHICLE_TYPES: {
        CAR: 'car',
        BUS_STUDENT: 'bus_student',
        BUS_OTHER: 'bus_other'
    }
};
