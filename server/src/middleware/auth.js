const { supabase } = require('../config/database');
const { ApiError } = require('../utils/errorTypes');

/**
 * Middleware to verify Supabase JWT token
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError(401, 'No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            throw new ApiError(401, 'Invalid or expired token');
        }

        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            throw new ApiError(404, 'User profile not found');
        }

        // Attach user and profile to request
        req.user = user;
        req.profile = profile;
        req.token = token;

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const { data: { user } } = await supabase.auth.getUser(token);

            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                req.user = user;
                req.profile = profile;
                req.token = token;
            }
        }

        next();
    } catch (error) {
        // Don't fail, just continue without auth
        next();
    }
};

module.exports = {
    verifyToken,
    optionalAuth
};
