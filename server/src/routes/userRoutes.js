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
        let authUser;

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
            // If user already exists in Auth, we try to recover their ID and UPDATE their password/metadata
            if (authError.message.includes('already been registered') || authError.status === 422) {

                // Fetch user by email to get their ID
                const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) throw listError;
                
                const existingUser = listData.users.find(u => u.email === email);
                if (!existingUser) {
                  throw new Error('User reported as existing but not found in list.');
                }
                
                // Update their password and metadata so the current attempt is authoritative
                const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                  existingUser.id,
                  { 
                    password: password, 
                    email_confirm: true,
                    user_metadata: {
                      full_name,
                      role,
                      department,
                      designation,
                      phone
                    }
                  }
                );
                
                if (updateError) throw updateError;
                
                authUser = updateData.user;

            } else {
                return res.status(500).json({ success: false, message: authError.message });
            }
        } else {
            authUser = authData.user;

        }

        // Step 2: Ensure user is also in the public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .upsert([{
                id: authUser.id,
                email,
                full_name,
                role,
                department,
                designation,
                phone,
                updated_at: new Date().toISOString()
            }]);

        if (dbError) {
            return res.status(500).json({ success: false, message: 'Auth account found/created, but failed to sync user record to database: ' + dbError.message });
        }

        return res.status(201).json({
            success: true,
            message: 'User synchronized successfully',
            user: authUser
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Synchronization failed' });
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
            return res.status(500).json({ success: false, message: authError.message });
        }

        // Step 2: Delete from custom users table (in case no cascade is set)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            // Auth user already deleted; log warning but don't fail
        }

        return res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to delete user' });
    }
});

module.exports = router;
