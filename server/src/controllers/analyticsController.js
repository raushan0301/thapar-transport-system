const { supabase } = require('../config/database');
const { successResponse } = require('../utils/responseFormatter');

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query
        let query = supabase
            .from('transport_requests')
            .select('*, travel_details(total_amount)');

        if (startDate) {
            query = query.gte('submitted_at', startDate);
        }
        if (endDate) {
            query = query.lte('submitted_at', endDate);
        }

        const { data: requests, error } = await query;

        if (error) throw error;

        // Calculate statistics
        const analytics = {
            totalRequests: requests.length,
            pendingRequests: requests.filter(r => r.current_status.includes('pending')).length,
            approvedRequests: requests.filter(r =>
                r.current_status === 'approved_awaiting_vehicle' ||
                r.current_status === 'vehicle_assigned'
            ).length,
            completedRequests: requests.filter(r =>
                r.current_status === 'travel_completed' ||
                r.current_status === 'closed'
            ).length,
            rejectedRequests: requests.filter(r => r.current_status === 'rejected').length,
            totalAmount: requests.reduce((sum, r) =>
                sum + (r.travel_details?.[0]?.total_amount || 0), 0
            ),
            averageAmount: 0,
            requestsByDepartment: {},
            requestsByStatus: {},
            requestsByMonth: {}
        };

        // Calculate average
        const completedWithAmount = requests.filter(r => r.travel_details?.[0]?.total_amount);
        analytics.averageAmount = completedWithAmount.length > 0
            ? analytics.totalAmount / completedWithAmount.length
            : 0;

        // Group by department
        requests.forEach(r => {
            analytics.requestsByDepartment[r.department] =
                (analytics.requestsByDepartment[r.department] || 0) + 1;
        });

        // Group by status
        requests.forEach(r => {
            analytics.requestsByStatus[r.current_status] =
                (analytics.requestsByStatus[r.current_status] || 0) + 1;
        });

        // Group by month
        requests.forEach(r => {
            const month = new Date(r.submitted_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short'
            });
            analytics.requestsByMonth[month] =
                (analytics.requestsByMonth[month] || 0) + 1;
        });

        successResponse(res, analytics, 'Analytics fetched successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get vehicle utilization analytics
 */
const getVehicleAnalytics = async (req, res, next) => {
    try {
        // Fetch all vehicles
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*');

        if (vehiclesError) throw vehiclesError;

        // Fetch requests with vehicles
        const { data: requests, error: requestsError } = await supabase
            .from('transport_requests')
            .select('vehicle_id, travel_details(total_km)')
            .not('vehicle_id', 'is', null);

        if (requestsError) throw requestsError;

        // Calculate utilization
        const vehicleStats = vehicles.map(vehicle => {
            const vehicleRequests = requests.filter(r => r.vehicle_id === vehicle.id);
            const totalKm = vehicleRequests.reduce((sum, r) =>
                sum + (r.travel_details?.[0]?.total_km || 0), 0
            );

            return {
                vehicleNumber: vehicle.vehicle_number,
                vehicleType: vehicle.vehicle_type,
                totalTrips: vehicleRequests.length,
                totalKm,
                averageKmPerTrip: vehicleRequests.length > 0 ? totalKm / vehicleRequests.length : 0,
                isActive: vehicle.is_active
            };
        });

        successResponse(res, vehicleStats, 'Vehicle analytics fetched successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardAnalytics,
    getVehicleAnalytics
};
