/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import {
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  Calendar,
  ArrowRight,
  Activity,
  Zap,
  MapPin,
  AlertCircle,
  Eye,
  ShieldCheck,
  UserCheck,
  ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    needsApproval: 0,
    awaitingVehicle: 0,
    onDutyNow: 0,
    completedToday: 0,
    fleetStandby: 0,
    todaysSchedule: 0
  });
  const [allRequests, setAllRequests] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: requests, error: requestsError } = await supabase
        .from('transport_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (requestsError) throw requestsError;

      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*, driver:drivers(id, full_name)')
        .eq('is_available', true);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Stats Calculation
      const needsApproval = requests?.filter(r =>
        r.current_status === 'pending_admin' ||
        (r.current_status === 'pending_head' && r.custom_head_email === user.email)
      ).length || 0;

      const awaitingVehicle = requests?.filter(r => r.current_status === 'approved_awaiting_vehicle').length || 0;
      const onDutyNow = requests?.filter(r => r.current_status === 'vehicle_assigned').length || 0;
      const completedToday = requests?.filter(r => 
        r.current_status === 'completed' && 
        (r.updated_at?.split('T')[0] === todayStr || r.submitted_at?.split('T')[0] === todayStr)
      ).length || 0;
      const fleetStandby = vehicles?.length || 0;
      const todaysSchedule = requests?.filter(r =>
        r.date_of_visit === todayStr && r.current_status !== 'rejected' && r.current_status !== 'cancelled'
      ).length || 0;

      setStats({
        needsApproval,
        awaitingVehicle,
        onDutyNow,
        completedToday,
        fleetStandby,
        todaysSchedule
      });

      setAllRequests(requests || []);
      setAvailableVehicles(vehicles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredList = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (activeFilter) {
      case 'fleet':
        return availableVehicles;
      case 'needs_approval':
        return allRequests.filter(r => 
          r.current_status === 'pending_admin' || 
          (r.current_status === 'pending_head' && r.custom_head_email === user.email)
        );
      case 'assign_vehicle':
        return allRequests.filter(r => r.current_status === 'approved_awaiting_vehicle');
      case 'on_duty':
        return allRequests.filter(r => r.current_status === 'vehicle_assigned');
      case 'completed_today':
        return allRequests.filter(r => 
          r.current_status === 'completed' && 
          (r.updated_at?.split('T')[0] === todayStr || r.submitted_at?.split('T')[0] === todayStr)
        );
      case 'today_schedule':
        return allRequests.filter(r => r.date_of_visit === todayStr && r.current_status !== 'rejected' && r.current_status !== 'cancelled');
      default:
        return allRequests.filter(r => ['pending_admin', 'approved_awaiting_vehicle'].includes(r.current_status));
    }
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

  const getColorClasses = (color) => {
    switch (color) {
      case 'amber': return { text: 'text-amber-600', bg: 'bg-amber-600', glow: 'bg-amber-500' };
      case 'blue': return { text: 'text-blue-600', bg: 'bg-blue-600', glow: 'bg-blue-500' };
      case 'indigo': return { text: 'text-indigo-600', bg: 'bg-indigo-600', glow: 'bg-indigo-500' };
      case 'green': return { text: 'text-green-600', bg: 'bg-green-600', glow: 'bg-green-500' };
      case 'teal': return { text: 'text-teal-600', bg: 'bg-teal-600', glow: 'bg-teal-500' };
      case 'cyan': return { text: 'text-cyan-600', bg: 'bg-cyan-600', glow: 'bg-cyan-500' };
      default: return { text: 'text-gray-600', bg: 'bg-gray-600', glow: 'bg-gray-500' };
    }
  };

  const currentList = getFilteredList().slice(0, 5);

  const statsData = [
    {
      id: 'needs_approval',
      title: 'Needs Approval',
      value: stats.needsApproval,
      icon: Clock,
      color: 'amber',
      shadowColor: 'shadow-amber-500/50',
      classes: getColorClasses('amber'),
      path: '/admin/pending'
    },
    {
      id: 'assign_vehicle',
      title: 'Assign Vehicle',
      value: stats.awaitingVehicle,
      icon: Truck,
      color: 'blue',
      shadowColor: 'shadow-blue-500/50',
      classes: getColorClasses('blue'),
      path: '/admin/vehicle-assignment'
    },
    {
      id: 'fleet',
      title: 'Fleet Standby',
      value: stats.fleetStandby,
      icon: Truck,
      color: 'teal',
      shadowColor: 'shadow-teal-500/50',
      classes: getColorClasses('teal'),
      path: '/admin/vehicles'
    },
    {
      id: 'completed_today',
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle2,
      color: 'green',
      shadowColor: 'shadow-green-500/50',
      classes: getColorClasses('green'),
      path: '/admin/audit'
    },
    {
      id: 'on_duty',
      title: 'On Duty Now',
      value: stats.onDutyNow,
      icon: Activity,
      color: 'indigo',
      shadowColor: 'shadow-indigo-500/50',
      classes: getColorClasses('indigo'),
      path: '/admin/travel-completion'
    },
    {
      id: 'today_schedule',
      title: "Today's Schedule",
      value: stats.todaysSchedule,
      icon: Calendar,
      color: 'cyan',
      shadowColor: 'shadow-cyan-500/50',
      classes: getColorClasses('cyan'),
      path: '/admin/pending'
    },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12"
      onClick={() => setActiveFilter(null)}
    >
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 font-medium">
            Overview of transport operations and live task tracking
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (['on_duty', 'completed_today', 'today_schedule', 'needs_approval', 'assign_vehicle', 'fleet'].includes(stat.id)) {
                   setActiveFilter(activeFilter === stat.id ? null : stat.id);
                } else {
                   navigate(stat.path);
                }
              }}
              className={`group cursor-pointer perspective-1000 transform transition-all duration-300 ${activeFilter === stat.id ? 'scale-[1.03]' : ''}`}
              style={{
                animation: 'slideUp 0.6s ease-out forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-6 hover:rotate-x-3">
                <div className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 ${activeFilter === stat.id ? 'opacity-50' : 'opacity-0 group-hover:opacity-40'} ${stat.shadowColor} ${stat.classes.glow}`}></div>
                <div className={`relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 ${activeFilter === stat.id ? `border-${stat.color}-500 shadow-${stat.color}-100` : 'border-transparent hover:border-gray-200'} transform hover:-translate-y-2`}>
                  <div className="flex justify-between items-start mb-4">
                    <stat.icon className={`w-12 h-12 ${stat.classes.text} transform transition-transform duration-500 group-hover:scale-110`} strokeWidth={1.5} />
                    {activeFilter === stat.id && <Eye className={`w-5 h-5 ${stat.classes.text} animate-pulse`} />}
                  </div>
                  <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-900 transition-all duration-500 group-hover:scale-110 origin-left">
                      {stat.value}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <div className={`mt-4 h-0.5 ${stat.classes.bg} rounded-full transform ${activeFilter === stat.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'} transition-transform duration-500 origin-left`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Filter Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" onClick={(e) => e.stopPropagation()}>
          <div
            className="group perspective-1000"
            style={{ animation: 'slideUp 0.6s ease-out forwards 600ms', opacity: 0 }}
          >
            <div className={`relative bg-white rounded-2xl p-6 shadow-lg border transition-all duration-500 ${activeFilter ? 'border-indigo-500 ring-2 ring-indigo-400/10' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <Activity className={`w-6 h-6 ${activeFilter ? 'text-indigo-600' : 'text-blue-600'}`} strokeWidth={1.5} />
                  <h2 className="text-xl font-bold text-gray-900">
                    {activeFilter === 'on_duty' ? 'On Duty Vehicles' : 
                     activeFilter === 'completed_today' ? 'Completed Today' : 
                     activeFilter === 'today_schedule' ? "Today's Schedule" : 
                     activeFilter === 'needs_approval' ? 'Needs Approval' :
                     activeFilter === 'assign_vehicle' ? 'Assign Vehicle' :
                     activeFilter === 'fleet' ? 'Fleet On Standby' :
                     'Priority Tasks'}
                  </h2>
                </div>
                {activeFilter && (
                   <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)} className="text-gray-500 text-xs font-bold hover:bg-gray-50 underline">
                     Clear Filter
                   </Button>
                )}
              </div>

              {currentList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-bold uppercase tracking-wider text-xs">No records found for this view</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentList.map((item, index) => {
                     if (activeFilter === 'fleet') {
                        return (
                           <div
                             key={item.id}
                             className="group/item p-4 bg-gray-50 hover:bg-white rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-teal-100 hover:shadow-md transform hover:-translate-x-1"
                             onClick={() => navigate('/admin/vehicles')}
                           >
                              <div className="flex items-center justify-between">
                                 <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover/item:scale-110 transition-transform">
                                       <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="font-bold text-gray-900">{item.vehicle_number}</p>
                                       <p className="text-xs text-gray-500 uppercase font-black tracking-widest">{item.vehicle_type}</p>
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Available</span>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                       <UserCheck className="w-3 h-3" /> {item.driver?.full_name || 'No Driver'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        );
                     }
                     return (
                        <div
                          key={item.id}
                          className="group/item p-4 bg-gray-50 hover:bg-white rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-blue-100 hover:shadow-md transform hover:-translate-x-1"
                          onClick={() => navigate(`/request/${item.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors">
                                {item.request_number}
                              </p>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {item.place_of_visit}
                              </p>
                            </div>
                            <div className="ml-4 flex flex-col items-end gap-1">
                              <StatusBadge status={item.current_status} />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(item.date_of_visit)}</span>
                            </div>
                          </div>
                        </div>
                     );
                  })}
                  {getFilteredList().length > 5 && (
                     <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                        Showing top 5 results. View full records for more.
                     </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Direct Actions Panel - Professional UI Updated */}
          <div
            className="space-y-6"
            style={{ animation: 'slideUp 0.6s ease-out forwards 700ms', opacity: 0 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-gray-900">Direct Actions</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Assign Vehicles',
                    subtitle: 'Fleet Matching',
                    path: '/admin/vehicle-assignment',
                    color: 'blue'
                  },
                  {
                    title: 'Complete Trips',
                    subtitle: 'Mileage & Fuel Logs',
                    path: '/admin/travel-completion',
                    color: 'green'
                  },
                  {
                    title: 'User Management',
                    subtitle: 'Roles & Drivers',
                    path: '/admin/users',
                    color: 'purple'
                  },
                  {
                    title: 'Fleet Records',
                    subtitle: 'Vehicle List',
                    path: '/admin/vehicles',
                    color: 'teal'
                  }
                ].map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => navigate(action.path)} 
                    className={`p-4 bg-${action.color}-50/50 hover:bg-white border-2 border-transparent hover:border-${action.color}-200 rounded-xl transition-all duration-300 text-left group flex justify-between items-center`}
                  >
                    <div>
                      <p className={`font-bold text-sm tracking-tight text-${action.color}-900 group-hover:text-${action.color}-600 transition-colors`}>
                         {action.title}
                      </p>
                      <p className={`text-[10px] text-${action.color}-400 mt-1 uppercase font-bold`}>
                         {action.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-${action.color}-300 group-hover:text-${action.color}-600 transform group-hover:translate-x-1 transition-all`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .rotate-y-6 { transform: rotateY(6deg); }
        .rotate-x-3 { transform: rotateX(3deg); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;