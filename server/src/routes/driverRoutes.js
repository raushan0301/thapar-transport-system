const express = require('express');
const router = express.Router();
const { supabaseAdmin, supabase } = require('../config/database');

/**
 * GET /api/v1/driver/trips?user_id=xxx
 * Returns all trips assigned to a driver, using service role to bypass RLS.
 * Also returns requester details joined from users table.
 */
router.get('/trips', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'user_id required' });
        }

        const db = supabaseAdmin || supabase;

        // 1. Find the driver record
        let driverRecord = null;
        let driverId = null;

        // Try by user_id
        let { data: drv } = await db.from('drivers')
            .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
            .eq('user_id', user_id).maybeSingle();
        if (drv) { driverRecord = drv; driverId = drv.id; }

        // Also get user profile for name/phone fallback
        const { data: userProfile } = await db.from('users')
            .select('full_name, phone, email, department, designation')
            .eq('id', user_id).maybeSingle();

        if (!drv && userProfile?.full_name) {
            ({ data: drv } = await db.from('drivers')
                .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
                .ilike('full_name', `%${userProfile.full_name}%`).maybeSingle());
            if (drv) { driverRecord = drv; driverId = drv.id; }
        }
        if (!drv && userProfile?.phone) {
            ({ data: drv } = await db.from('drivers')
                .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
                .eq('phone', userProfile.phone).maybeSingle());
            if (drv) { driverRecord = drv; driverId = drv.id; }
        }

        // 2. Fetch all trips for this driver
        let allTrips = [];

        if (driverId) {
            const { data } = await db.from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                .eq('driver_id', driverId)
                .order('date_of_visit', { ascending: false });
            if (data) allTrips = [...data];
        }

        if (userProfile?.full_name) {
            const { data } = await db.from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                .ilike('driver_name', `%${userProfile.full_name}%`)
                .order('date_of_visit', { ascending: false });
            if (data) data.forEach(t => { if (!allTrips.find(e => e.id === t.id)) allTrips.push(t); });
        }

        if (userProfile?.phone) {
            const { data } = await db.from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                .eq('driver_contact', userProfile.phone)
                .order('date_of_visit', { ascending: false });
            if (data) data.forEach(t => { if (!allTrips.find(e => e.id === t.id)) allTrips.push(t); });
        }

        // 3. Also get trips referenced in notifications (catch any edge cases)
        const { data: notifs } = await db.from('notifications')
            .select('related_request_id')
            .eq('user_id', user_id)
            .not('related_request_id', 'is', null);

        if (notifs?.length > 0) {
            const existingIds = new Set(allTrips.map(t => t.id));
            const notifIds = [...new Set(notifs.map(n => n.related_request_id))].filter(id => !existingIds.has(id));
            if (notifIds.length > 0) {
                const { data: extra } = await db.from('transport_requests')
                    .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                    .in('id', notifIds);
                if (extra) allTrips = [...allTrips, ...extra];
            }
        }

        // Sort: active first, then by date
        allTrips.sort((a, b) => {
            if (a.current_status === 'vehicle_assigned' && b.current_status !== 'vehicle_assigned') return -1;
            if (a.current_status !== 'vehicle_assigned' && b.current_status === 'vehicle_assigned') return 1;
            return new Date(b.date_of_visit || b.submitted_at) - new Date(a.date_of_visit || a.submitted_at);
        });

        res.json({
            success: true,
            trips: allTrips,
            driver: driverRecord,
            profile: userProfile
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * POST /api/v1/driver/complete-trip
 * Marks a trip as travel_completed (driver side completion)
 */
router.post('/complete-trip', async (req, res) => {
    try {
        const { request_id, driver_id } = req.body;

        if (!request_id) {
            return res.status(400).json({ success: false, message: 'request_id required' });
        }

        const db = supabaseAdmin || supabase;
        const usingAdmin = !!supabaseAdmin;

        // 1. Update Trip status
        const { error, count } = await db.from('transport_requests')
            .update({ current_status: 'travel_completed', updated_at: new Date().toISOString() })
            .eq('id', request_id)
            .select('*', { count: 'exact' });

        if (error) {
            throw error;
        }

        if (!count || count === 0) {
            return res.status(404).json({ success: false, message: 'Trip record not found or no changes allowed' });
        }

        // 2. Free up driver and vehicle if driver_id is provided
        if (driver_id) {

            await db.from('drivers').update({ is_available: true, assigned_vehicle_id: null }).eq('id', driver_id);
            
            const { data: req_data } = await db.from('transport_requests')
                .select('vehicle_id')
                .eq('id', request_id)
                .maybeSingle();

            if (req_data?.vehicle_id) {

                await db.from('vehicles').update({ is_available: true }).eq('id', req_data.vehicle_id);
            }
        }

        res.json({ success: true, message: 'Trip marked as complete' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
