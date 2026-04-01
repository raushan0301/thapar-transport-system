const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET /api/v1/requests/:requestId/approvals
// Bypass RLS to fetch all approvals for a specific request
router.get('/:requestId/approvals', async (req, res) => {
    try {
        const { requestId } = req.params;
        
        if (!supabaseAdmin) {
            return res.status(500).json({ success: false, message: 'Admin client not configured' });
        }

        // Fetch approval history (approved, rejected) with approver details
        const { data: approvalsData, error } = await supabaseAdmin
            .from('approvals')
            .select(`
                *,
                approver:users!approvals_approver_id_fkey(full_name, email)
            `)
            .eq('request_id', requestId)
            .in('action', ['approved', 'rejected'])
            .order('approved_at', { ascending: true });

        if (error) {
            throw error;
        }

        return res.json({ success: true, data: approvalsData });
    } catch (err) {
        console.error('Error fetching approvals:', err);
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch approval timeline' });
    }
});

module.exports = router;
