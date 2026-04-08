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

        // IDOR Protection
        const isManager = ['admin', 'registrar', 'head'].includes(req.profile?.role);
        if (user_id !== req.user.id && !isManager) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const db = require('../config/database').supabaseAdmin || supabase;

        // 1. Run driver and user lookups in parallel for better performance
        const [
            { data: userProfile },
            { data: directDrv }
        ] = await Promise.all([
            db.from('users').select('full_name, phone, department, designation').eq('id', user_id).maybeSingle(),
            db.from('drivers').select('*, vehicle:vehicles(*)').eq('user_id', user_id).maybeSingle()
        ]);

        let driverRecord = directDrv;
        let driverId = directDrv?.id;

        // 2. Logic to find driver record if direct user_id link is missing
        if (!driverRecord && userProfile) {
            const { data: fallbackDrv } = await db.from('drivers')
                .select('*, vehicle:vehicles(*)')
                .or(`full_name.ilike.%${userProfile.full_name}%,phone.eq.${userProfile.phone || 'none'}`)
                .maybeSingle();
            
            if (fallbackDrv) {
                driverRecord = fallbackDrv;
                driverId = fallbackDrv.id;
            }
        }

        // 3. Fetch all potential trips concurrently
        const queryPromises = [];
        
        if (driverId) {
            queryPromises.push(db.from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                .eq('driver_id', driverId));
        }
        
        if (userProfile?.full_name) {
            queryPromises.push(db.from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                .ilike('driver_name', `%${userProfile.full_name}%`));
        }

        // Fetch notifications for referencing
        queryPromises.push(db.from('notifications')
            .select('related_request_id')
            .eq('user_id', user_id)
            .not('related_request_id', 'is', null));

        const results = await Promise.all(queryPromises);
        
        const tripMap = new Map();
        results.forEach(res => {
            if (res.data && Array.isArray(res.data) && res.data[0]?.place_of_visit) {
                res.data.forEach(t => tripMap.set(t.id, t));
            }
        });

        const notifs = results.find(res => res.data && res.data[0]?.related_request_id === undefined === false);
        if (notifs?.data?.length > 0) {
            const missingIds = [...new Set(notifs.data.map(n => n.related_request_id))].filter(id => !tripMap.has(id));
            if (missingIds.length > 0) {
                const { data: extra } = await db.from('transport_requests')
                    .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
                    .in('id', missingIds);
                if (extra) extra.forEach(t => tripMap.set(t.id, t));
            }
        }

        const allTrips = Array.from(tripMap.values()).sort((a, b) => {
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
        const { 
            request_id, 
            driver_id,
            opening_meter,
            closing_meter,
            fuel_consumed,
            tolls_parking,
            remarks,
            trip_type,
            total_distance
        } = req.body;

        if (!request_id) {
            return res.status(400).json({ success: false, message: 'request_id required' });
        }

        const db = supabaseAdmin || supabase;

        // 1. Fetch current trip to preserve existing purpose/logs
        const { data: trip } = await db.from('transport_requests').select('*').eq('id', request_id).maybeSingle();
        if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

        // 2. Format the driver log into a string to store in 'purpose' as a fallback
        const driverLogHeader = "\n\n--- [DRIVER LOG] ---";
        const fuelLog = fuel_consumed ? `\nFuel: ${fuel_consumed}L` : "";
        const tollLog = tolls_parking ? `\nTolls/Parking: ₹${tolls_parking}` : "";
        const remarkLog = remarks ? `\nDriver Remarks: ${remarks}` : "";
        
        const updatedPurpose = (trip.purpose || "") + driverLogHeader + fuelLog + tollLog + remarkLog;

        // 3. Update Trip status and log details (Using only confirmed schema columns)
        const updateObj = { 
            current_status: 'travel_completed', 
            updated_at: new Date().toISOString(),
            purpose: updatedPurpose,
            trip_type: trip_type || trip.trip_type
        };

        // Add meter readings verified from add_travel_completion_fields.sql
        if (opening_meter) updateObj.opening_meter = parseInt(opening_meter);
        if (closing_meter) updateObj.closing_meter = parseInt(closing_meter);
        if (total_distance) updateObj.total_distance = Math.round(parseFloat(total_distance));

        const { data: updatedData, error } = await db.from('transport_requests')
            .update(updateObj)
            .eq('id', request_id)
            .select('*');

        if (error) {
            // Ultimate Fallback: Just update status and purpose if anything else fails
            const safeUpdate = {
                current_status: 'travel_completed',
                purpose: updatedPurpose + (opening_meter ? `\nOdometer: ${opening_meter} - ${closing_meter}` : ""),
                updated_at: new Date().toISOString()
            };
            const { data: retryData, error: retryError } = await db.from('transport_requests')
                .update(safeUpdate)
                .eq('id', request_id)
                .select('*');
            
            if (retryError) throw retryError;
            updatedData = retryData;
        }

        let tripResult = updatedData?.[0] || trip;

        // 4. Free up driver and vehicle
        if (driver_id) {
            await db.from('drivers').update({ is_available: true, assigned_vehicle_id: null }).eq('id', driver_id);
            const vehicleId = tripResult?.vehicle_id;
            if (vehicleId) {
                await db.from('vehicles').update({ is_available: true }).eq('id', vehicleId);
            }
        }

        res.json({ 
            success: true, 
            message: 'Trip details logged successfully. Sent for admin review.',
            trip: tripResult
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
