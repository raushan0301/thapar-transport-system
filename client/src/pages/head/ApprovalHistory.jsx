import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate, formatTime } from '../../utils/helpers';
import { History } from 'lucide-react';

const ApprovalHistory = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, rejected

  useEffect(() => {
    if (user?.email) {
      fetchApprovalHistory();
    }
  }, [user, filter]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('transport_requests')
        .select('*')
        .eq('custom_head_email', user.email)
        .neq('current_status', 'pending_head')
        .order('updated_at', { ascending: false });

      // Apply filter
      if (filter === 'approved') {
        query = query.in('current_status', [
          'pending_admin',
          'pending_authority',
          'pending_registrar',
          'approved_awaiting_vehicle',
          'vehicle_assigned',
          'travel_completed',
          'closed'
        ]);
      } else if (filter === 'rejected') {
        query = query.eq('current_status', 'rejected');
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('✅ Approval history:', data);
      setRequests(data || []);
    } catch (err) {
      console.error('❌ Error fetching approval history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_admin: { variant: 'info', label: 'With Admin' },
      pending_authority: { variant: 'warning', label: 'With Authority' },
      pending_registrar: { variant: 'warning', label: 'With Registrar' },
      approved_awaiting_vehicle: { variant: 'success', label: 'Approved' },
      vehicle_assigned: { variant: 'success', label: 'Vehicle Assigned' },
      travel_completed: { variant: 'default', label: 'Completed' },
      closed: { variant: 'default', label: 'Closed' },
      rejected: { variant: 'danger', label: 'Rejected' },
    };

    const config = statusConfig[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Approval History</h1>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      <Card>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">
              {filter === 'all' && 'No approval history'}
              {filter === 'approved' && 'No approved requests'}
              {filter === 'rejected' && 'No rejected requests'}
            </p>
            <p className="text-sm mt-2">
              {filter === 'all' && 'Your approval history will be shown here'}
              {filter === 'approved' && 'Approved requests will appear here'}
              {filter === 'rejected' && 'Rejected requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Place
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved On
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.request_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.department?.toUpperCase() || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.place_of_visit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(request.date_of_visit)}</div>
                      <div className="text-xs text-gray-400">{formatTime(request.time_of_visit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.current_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {requests.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default ApprovalHistory;