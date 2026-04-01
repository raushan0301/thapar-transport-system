import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, Activity } from 'lucide-react';

const RegistrarDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: requests, error } = await supabase.from('transport_requests').select('*').order('submitted_at', { ascending: false });
        if (error) throw error;

        const { data: myApprovals } = await supabase.from('approvals').select('request_id, action').eq('approver_id', user.id).eq('approver_role', 'registrar');

        const approvalMap = {};
        if (myApprovals) myApprovals.forEach(a => approvalMap[a.request_id] = a.action);

        let approved = 0, rejected = 0, pending = 0;
        requests.forEach(r => {
          const myAction = approvalMap[r.id];
          if (r.current_status === 'pending_registrar') pending++;
          else if (myAction === 'approved') approved++;
          else if (myAction === 'rejected' || r.current_status === 'rejected') rejected++;
        });

        setStats({ total: requests.length, pending, approved, rejected });
        setRecentRequests(requests.filter(r => r.current_status === 'pending_registrar').slice(0, 5));
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  const statsData = [
    { title: 'Total Requests', value: stats.total, icon: FileText, color: 'blue' },
    { title: 'Pending Approval', value: stats.pending, icon: Clock, color: 'amber' },
    { title: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'green' },
    { title: 'Rejected', value: stats.rejected, icon: XCircle, color: 'red' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="mb-8 animate-slideDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Registrar Dashboard</h1>
          <p className="text-gray-600">Final approval and oversight of all transport requests</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, i) => (
            <div key={i} className="group perspective-1000" style={{ animation: 'slideUp 0.6s ease-out forwards', animationDelay: `${i * 100}ms`, opacity: 0 }}>
              <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-6 hover:rotate-x-3">
                <div className={`absolute inset-0 bg-${stat.color}-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
                  <div className="mb-4"><stat.icon className={`w-12 h-12 text-${stat.color}-600 transform transition-transform duration-500 group-hover:scale-110`} strokeWidth={1.5} /></div>
                  <div className="mb-2"><p className="text-4xl font-bold text-gray-900 transition-all duration-500 group-hover:scale-110 origin-left">{stat.value}</p></div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className={`mt-4 h-0.5 bg-${stat.color}-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="group perspective-1000" style={{ animation: 'slideUp 0.6s ease-out forwards', animationDelay: '400ms', opacity: 0 }}>
            <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-3">
              <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-amber-200 transform hover:-translate-y-1">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-bold text-gray-900">Pending Approvals</h2>
                  </div>
                  {stats.pending > 0 && <Button variant="ghost" size="sm" onClick={() => navigate('/registrar/pending')} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">View All <ArrowRight className="w-4 h-4 ml-1" /></Button>}
                </div>
                {recentRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>No pending approvals</p></div>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((req, i) => (
                      <div key={req.id} className="group/item p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-amber-200 hover:shadow-md transform hover:-translate-x-1" onClick={() => navigate(`/request/${req.id}`)} style={{ animation: 'slideRight 0.4s ease-out forwards', animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 group-hover/item:text-amber-600 transition-colors">{req.request_number}</p>
                            <p className="text-sm text-gray-600 truncate mt-1">{req.purpose}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(req.date_of_visit)}</p>
                          </div>
                          <div className="ml-4 transform group-hover/item:scale-110 transition-transform duration-300"><StatusBadge status={req.current_status} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="group perspective-1000" style={{ animation: 'slideUp 0.6s ease-out forwards', animationDelay: '500ms', opacity: 0 }}>
            <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-3">
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-6">
                  <Activity className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                </div>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 group/btn" onClick={() => navigate('/registrar/pending')}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-semibold text-gray-900">Review Requests</p><p className="text-sm text-gray-600">{stats.pending} pending approval</p></div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all" />
                    </div>
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200 group/btn" onClick={() => navigate('/registrar/history')}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-semibold text-gray-900">Approved Requests</p><p className="text-sm text-gray-600">{stats.approved} approved</p></div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-600 group-hover/btn:translate-x-1 transition-all" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-6 { transform: rotateY(6deg); }
        .rotate-x-3 { transform: rotateX(3deg); }
        .rotate-y-3 { transform: rotateY(3deg); }
      `}</style>
    </div>
  );
};

export default RegistrarDashboard;