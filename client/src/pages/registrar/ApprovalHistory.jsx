import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate, formatTime } from '../../utils/helpers';
import { History, Eye } from 'lucide-react';

const ApprovalHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, approved, rejected

  useEffect(() => {
    if (user?.id) {
      fetchApprovalHistory();
    }
  }, [user, filter]);

  const fetchApprovalHistory = async () => {
    try {
      setLoading(true);

      // Fetch all approvals by registrar
      let query = supabase
        .from('approvals')
        .select(`
          *,
          request:transport_requests(
            id,
            request_number,
            purpose,
            place_of_visit,
            date_of_visit,
            time_of_visit,
            department,
            current_status,
            user:users!transport_requests_user_id_fkey(full_name, email)
          )
        `)
        .eq('approver_role', 'registrar')
        .order('approved_at', { ascending: false });

      // Apply filter
      if (filter === 'approved') {
        query = query.eq('action', 'approved');
      } else if (filter === 'rejected') {
        query = query.eq('action', 'rejected');
      }

      const { data, error } = await query;

      if (error) throw error;

      setApprovals(data || []);
    } catch (err) {
      console.error('Error fetching approval history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      approved: { variant: 'success', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' },
      forwarded: { variant: 'info', label: 'Forwarded' },
    };

    const config = actionConfig[action] || { variant: 'default', label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved_awaiting_vehicle: { variant: 'success', label: 'Awaiting Vehicle' },
      vehicle_assigned: { variant: 'success', label: 'Vehicle Assigned' },
      travel_completed: { variant: 'default', label: 'Travel Completed' },
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Rejected
          </button>
        </div>
      </div>

      <Card>
        {approvals.length === 0 ? (
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
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Place
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {approval.request?.request_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{approval.request?.user?.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{approval.request?.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={approval.request?.purpose}>
                        {approval.request?.purpose || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.request?.place_of_visit || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(approval.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(approval.request?.current_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(approval.approved_at)}</div>
                      <div className="text-xs text-gray-400">{formatTime(approval.approved_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/request/${approval.request?.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {approvals.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            Showing {approvals.length} approval{approvals.length !== 1 ? 's' : ''}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default ApprovalHistory;