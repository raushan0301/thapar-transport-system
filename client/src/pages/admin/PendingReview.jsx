import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { Clock, Search, Eye } from 'lucide-react';

const PendingReview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.id) fetchPendingRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);

      // Fetch requests that are:
      // 1. Status is 'pending_admin' (from any head) OR
      // 2. Status is 'pending_head' AND assigned to this admin (admin acting as head)
      const { data, error } = await supabase
        .from('transport_requests')
        .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department)')
        .or(`current_status.eq.pending_admin,and(current_status.eq.pending_head,custom_head_email.eq.${user.email})`)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center space-x-3 mb-2">
            <Clock className="w-8 h-8 text-amber-600" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-gray-900">Pending Review</h1>
          </div>
          <p className="text-gray-600">Review and process transport requests awaiting admin approval</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search by request number, user, or purpose..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 mb-2">No pending requests</p>
            <p className="text-sm text-gray-400">All requests have been processed</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Purpose</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-amber-600">{req.request_number}</td>
                    <td className="px-6 py-4 text-gray-900">{req.user?.full_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{req.user?.department || req.department}</td>
                    <td className="px-6 py-4 text-gray-900">{req.purpose?.substring(0, 40)}{req.purpose?.length > 40 ? '...' : ''}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(req.date_of_visit)}</td>
                    <td className="px-6 py-4"><StatusBadge status={req.current_status} /></td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/admin/review/${req.id}`)}>Review</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Pending: <span className="font-semibold text-gray-900">{filteredRequests.length}</span></span>
            <span className="text-gray-600">Showing: <span className="font-semibold text-gray-900">{filteredRequests.length}</span> of <span className="font-semibold text-gray-900">{requests.length}</span></span>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default PendingReview;