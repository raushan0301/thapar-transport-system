import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { Download, FileText } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ExportData = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create CSV content
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape commas and quotes
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExport = async (type) => {
    setLoading(true);
    try {
      let query = supabase.from('transport_requests').select(`
        request_number,
        date_of_visit,
        time_of_visit,
        place_of_visit,
        purpose,
        number_of_persons,
        current_status,
        submitted_at,
        user_id,
        vehicle_id,
        driver_name,
        driver_contact
      `);

      // Apply date range filter
      if (dateRange.start) {
        query = query.gte('date_of_visit', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('date_of_visit', dateRange.end);
      }

      // Apply status filter based on type
      switch (type) {
        case 'Approved Requests':
          query = query.in('current_status', ['approved_awaiting_vehicle', 'vehicle_assigned', 'travel_completed']);
          break;
        case 'Pending Requests':
          query = query.in('current_status', ['pending_head', 'pending_admin', 'pending_registrar']);
          break;
        case 'Vehicle Usage':
          query = query.in('current_status', ['vehicle_assigned', 'travel_completed']);
          break;
        // 'All Requests' - no filter
      }

      query = query.order('submitted_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No data found for the selected criteria');
        setLoading(false);
        return;
      }

      // Fetch user and vehicle details separately for each request
      const requestsWithDetails = await Promise.all(
        data.map(async (req) => {
          let userData = null;
          let vehicleData = null;

          // Fetch user details
          if (req.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('full_name, email, department, designation')
              .eq('id', req.user_id)
              .single();
            userData = user;
          }

          // Fetch vehicle details if assigned
          if (req.vehicle_id) {
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('vehicle_number, vehicle_type')
              .eq('id', req.vehicle_id)
              .single();
            vehicleData = vehicle;
          }

          return { ...req, user: userData, vehicle: vehicleData };
        })
      );

      // Format data for export
      const exportData = requestsWithDetails.map(req => ({
        'Request Number': req.request_number,
        'User Name': req.user?.full_name || 'N/A',
        'Email': req.user?.email || 'N/A',
        'Department': req.user?.department || 'N/A',
        'Designation': req.user?.designation || 'N/A',
        'Date of Visit': formatDate(req.date_of_visit),
        'Time': req.time_of_visit || 'N/A',
        'Destination': req.place_of_visit,
        'Purpose': req.purpose,
        'Persons': req.number_of_persons,
        'Status': req.current_status?.replace(/_/g, ' '),
        'Vehicle Number': req.vehicle?.vehicle_number || 'N/A',
        'Vehicle Type': req.vehicle?.vehicle_type || 'N/A',
        'Driver Name': req.driver_name || 'N/A',
        'Driver Contact': req.driver_contact || 'N/A',
        'Submitted At': formatDate(req.submitted_at)
      }));

      // Export to CSV
      const filename = type.toLowerCase().replace(/\s+/g, '_');
      exportToCSV(exportData, filename);

      toast.success(`${type} exported successfully! (${requestsWithDetails.length} records)`);
    } catch (err) {
      console.error('Export error details:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      toast.error(`Failed to export: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center space-x-3 mb-2">
              <Download className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Export Data</h1>
            </div>
            <p className="text-gray-600">Download reports and data exports</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date Range (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {(dateRange.start || dateRange.end) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <strong>Note:</strong> Exports will be filtered by the selected date range
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'All Requests', desc: 'Export all transport requests', icon: FileText, color: 'blue' },
              { title: 'Approved Requests', desc: 'Export approved requests only', icon: FileText, color: 'green' },
              { title: 'Pending Requests', desc: 'Export pending requests', icon: FileText, color: 'amber' },
              { title: 'Vehicle Usage', desc: 'Export vehicle usage report', icon: FileText, color: 'purple' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: `${(i + 2) * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.desc}</p>
                <Button
                  variant="primary"
                  icon={Download}
                  onClick={() => handleExport(item.title)}
                  loading={loading}
                  fullWidth
                >
                  Export CSV
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ExportData;