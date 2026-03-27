const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');

// DELETE /api/v1/users/:id — hard-delete a user from Supabase Auth + users table
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!supabaseAdmin) {
        return res.status(500).json({ success: false, message: 'Admin client not configured (missing SUPABASE_SERVICE_ROLE_KEY)' });
    }

    try {
        // Step 1: Delete from Supabase Auth (this also cascades to users table if FK is set,
        // but we do it explicitly to be safe)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Auth delete error:', authError);
            return res.status(500).json({ success: false, message: authError.message });
        }

        // Step 2: Delete from custom users table (in case no cascade is set)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            // Auth user already deleted; log warning but don't fail
            console.warn('DB delete warning (auth user already removed):', dbError.message);
        }

        return res.json({ success: true, message: 'User deleted from Auth and database' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete user' });
    }
});

module.exports = router;
