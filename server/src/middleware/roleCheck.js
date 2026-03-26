const { ROLES } = require('../config/constants');
const { ApiError } = require('../utils/errorTypes');

/**
 * Middleware to check if user has required role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.profile) {
                throw new ApiError(401, 'Authentication required');
            }

            const userRole = req.profile.role;
            const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

            if (!roles.includes(userRole)) {
                throw new ApiError(403, 'Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user is admin
 */
const isAdmin = checkRole(ROLES.ADMIN);

/**
 * Check if user is head
 */
const isHead = checkRole(ROLES.HEAD);

/**
 * Check if user is registrar
 */
const isRegistrar = checkRole(ROLES.REGISTRAR);

/**
 * Check if user is admin or head
 */
const isAdminOrHead = checkRole([ROLES.ADMIN, ROLES.HEAD]);

/**
 * Check if user can approve requests (head, admin, registrar)
 */
const canApprove = checkRole([
    ROLES.HEAD,
    ROLES.ADMIN,
    ROLES.REGISTRAR
]);

module.exports = {
    checkRole,
    isAdmin,
    isHead,
    isRegistrar,
    isAdminOrHead,
    canApprove
};
