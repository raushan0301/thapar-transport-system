const ExcelJS = require('exceljs');
const { supabase } = require('../config/database');

/**
 * Generate Excel export for transport requests
 */
const generateRequestsExcel = async (filters = {}) => {
    // Build query
    let query = supabase
        .from('transport_requests')
        .select(`
      *,
      requester:users!transport_requests_user_id_fkey(full_name, email, department),
      vehicle:vehicles(vehicle_number, vehicle_type),
      travel_details(total_km, total_amount)
    `)
        .order('submitted_at', { ascending: false });

    // Apply filters
    if (filters.status) {
        query = query.eq('current_status', filters.status);
    }
    if (filters.startDate) {
        query = query.gte('submitted_at', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('submitted_at', filters.endDate);
    }
    if (filters.department) {
        query = query.eq('department', filters.department);
    }

    const { data: requests, error } = await query;

    if (error) {
        throw new Error('Failed to fetch requests');
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transport Requests');

    // Define columns
    worksheet.columns = [
        { header: 'Request Number', key: 'request_number', width: 15 },
        { header: 'Requester Name', key: 'requester_name', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Department', key: 'department', width: 20 },
        { header: 'Designation', key: 'designation', width: 20 },
        { header: 'Date of Visit', key: 'date_of_visit', width: 15 },
        { header: 'Time of Visit', key: 'time_of_visit', width: 12 },
        { header: 'Place of Visit', key: 'place_of_visit', width: 25 },
        { header: 'Purpose', key: 'purpose', width: 40 },
        { header: 'No. of Persons', key: 'number_of_persons', width: 12 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Vehicle Number', key: 'vehicle_number', width: 15 },
        { header: 'Vehicle Type', key: 'vehicle_type', width: 15 },
        { header: 'Total KM', key: 'total_km', width: 10 },
        { header: 'Total Amount', key: 'total_amount', width: 12 },
        { header: 'Submitted At', key: 'submitted_at', width: 18 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    requests.forEach(request => {
        worksheet.addRow({
            request_number: request.request_number,
            requester_name: request.requester?.full_name || 'N/A',
            email: request.requester?.email || 'N/A',
            department: request.department,
            designation: request.designation,
            date_of_visit: new Date(request.date_of_visit).toLocaleDateString('en-IN'),
            time_of_visit: request.time_of_visit,
            place_of_visit: request.place_of_visit,
            purpose: request.purpose,
            number_of_persons: request.number_of_persons,
            status: request.current_status.replace(/_/g, ' ').toUpperCase(),
            vehicle_number: request.vehicle?.vehicle_number || 'Not Assigned',
            vehicle_type: request.vehicle?.vehicle_type?.toUpperCase() || 'N/A',
            total_km: request.travel_details?.[0]?.total_km || 'N/A',
            total_amount: request.travel_details?.[0]?.total_amount
                ? `₹${request.travel_details[0].total_amount}`
                : 'N/A',
            submitted_at: new Date(request.submitted_at).toLocaleString('en-IN')
        });
    });

    // Add filters to freeze panes
    worksheet.autoFilter = 'A1:P1';

    // Add summary at the bottom
    const summaryRow = worksheet.rowCount + 2;
    worksheet.getCell(`A${summaryRow}`).value = 'Total Requests:';
    worksheet.getCell(`A${summaryRow}`).font = { bold: true };
    worksheet.getCell(`B${summaryRow}`).value = requests.length;

    // Calculate total amount
    const totalAmount = requests.reduce((sum, req) => {
        return sum + (req.travel_details?.[0]?.total_amount || 0);
    }, 0);

    worksheet.getCell(`A${summaryRow + 1}`).value = 'Total Amount:';
    worksheet.getCell(`A${summaryRow + 1}`).font = { bold: true };
    worksheet.getCell(`B${summaryRow + 1}`).value = `₹${totalAmount}`;

    return workbook;
};

/**
 * Generate Excel export for vehicles
 */
const generateVehiclesExcel = async () => {
    const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('vehicle_number');

    if (error) {
        throw new Error('Failed to fetch vehicles');
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vehicles');

    worksheet.columns = [
        { header: 'Vehicle Number', key: 'vehicle_number', width: 15 },
        { header: 'Vehicle Type', key: 'vehicle_type', width: 15 },
        { header: 'Driver Name', key: 'driver_name', width: 20 },
        { header: 'Driver Phone', key: 'driver_phone', width: 15 },
        { header: 'Status', key: 'is_active', width: 10 },
        { header: 'Created At', key: 'created_at', width: 18 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    vehicles.forEach(vehicle => {
        worksheet.addRow({
            vehicle_number: vehicle.vehicle_number,
            vehicle_type: vehicle.vehicle_type.toUpperCase(),
            driver_name: vehicle.driver_name || 'N/A',
            driver_phone: vehicle.driver_phone || 'N/A',
            is_active: vehicle.is_active ? 'Active' : 'Inactive',
            created_at: new Date(vehicle.created_at).toLocaleString('en-IN')
        });
    });

    return workbook;
};

/**
 * Generate analytics Excel report
 */
const generateAnalyticsExcel = async (startDate, endDate) => {
    const workbook = new ExcelJS.Workbook();

    // Requests Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');

    // Fetch data for date range
    const { data: requests } = await supabase
        .from('transport_requests')
        .select('*, travel_details(total_amount)')
        .gte('submitted_at', startDate)
        .lte('submitted_at', endDate);

    // Calculate statistics
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.current_status.includes('pending')).length,
        approved: requests.filter(r => r.current_status === 'approved_awaiting_vehicle' || r.current_status === 'vehicle_assigned').length,
        completed: requests.filter(r => r.current_status === 'travel_completed' || r.current_status === 'closed').length,
        rejected: requests.filter(r => r.current_status === 'rejected').length,
        totalAmount: requests.reduce((sum, r) => sum + (r.travel_details?.[0]?.total_amount || 0), 0)
    };

    summarySheet.addRow(['Metric', 'Value']);
    summarySheet.addRow(['Total Requests', stats.total]);
    summarySheet.addRow(['Pending', stats.pending]);
    summarySheet.addRow(['Approved', stats.approved]);
    summarySheet.addRow(['Completed', stats.completed]);
    summarySheet.addRow(['Rejected', stats.rejected]);
    summarySheet.addRow(['Total Amount Spent', `₹${stats.totalAmount}`]);

    summarySheet.getRow(1).font = { bold: true };

    return workbook;
};

module.exports = {
    generateRequestsExcel,
    generateVehiclesExcel,
    generateAnalyticsExcel
};
