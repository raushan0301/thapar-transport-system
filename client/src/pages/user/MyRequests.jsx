import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { FileText, Plus, Search, Filter } from 'lucide-react';

const MyRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.id) fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) || req.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.current_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 flex justify-between items-center animate-slideDown">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">My Requests</h1>
            </div>
            <p className="text-gray-600">View and manage all your transport requests</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => navigate('/new-request')}>New Request</Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input type="text" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="all">All Status</option>
                <option value="pending_head">Pending Head</option>
                <option value="pending_admin">Pending Admin</option>
                <option value="approved_awaiting_vehicle">Awaiting Vehicle</option>
                <option value="vehicle_assigned">Vehicle Assigned</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 mb-4">No requests found</p>
            <Button variant="primary" icon={Plus} onClick={() => navigate('/new-request')}>Create Your First Request</Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Purpose</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/request/${req.id}`)} style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-blue-600">{req.request_number}</td>
                    <td className="px-6 py-4 text-gray-900">{req.purpose?.substring(0, 50)}{req.purpose?.length > 50 ? '...' : ''}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(req.date_of_visit)}</td>
                    <td className="px-6 py-4"><StatusBadge status={req.current_status} /></td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(req.submitted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default MyRequests;