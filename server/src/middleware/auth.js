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
            // Log the detailed error from Supabase for debugging
            require('../utils/logger').error('Supabase Auth Error:', {
                error: error?.message || 'No user found',
                tokenPrefix: token.substring(0, 10) + '...'
            });
            throw new ApiError(401, 'Invalid or expired token');
        }

        // Fetch user profile from database - Use Admin client if available to bypass RLS
        const db = require('../config/database').supabaseAdmin || supabase;
        const { data: profile, error: profileError } = await db
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            // Log specifically for debugging
            require('../utils/logger').error(`Auth Error: Profile not found for user ${user.id}. Ensure user exists in 'users' table.`);
            throw new ApiError(404, `User profile not found in database for ID: ${user.id}`);
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
