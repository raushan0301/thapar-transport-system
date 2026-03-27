const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');

// POST /api/v1/users — create a new user with pre-confirmed email
router.post('/', async (req, res) => {
    const {
        email,
        password,
        full_name,
        role,
        department,
        designation,
        phone
    } = req.body;

    if (!email || !password || !full_name || !role) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!supabaseAdmin) {
        return res.status(500).json({ success: false, message: 'Admin client not configured' });
    }

    try {
        // Step 1: Create user in Supabase Auth (Pre-confirmed)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role,
                department,
                designation,
                phone
            }
        });

        if (authError) {
            console.error('Auth create error:', authError);
            return res.status(500).json({ success: false, message: authError.message });
        }

        // Step 2: Ensure user is also in the public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .upsert([{
                id: authData.user.id,
                email,
                full_name,
                role,
                department,
                designation,
                phone,
                updated_at: new Date().toISOString()
            }]);

        if (dbError) {
            console.error('DB insert error:', dbError);
            // We return success anyway because auth user IS created, but we log the error
        }

        return res.status(201).json({
            success: true,
            message: 'User created successfully (Email automatically confirmed)',
            user: authData.user
        });
    } catch (err) {
        console.error('Create user error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to create user' });
    }
});

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
