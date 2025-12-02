/**
 * ADMIN DASHBOARD - MINIMAL WITH 3D & ANIMATIONS
 * 
 * Features:
 * - Clean, minimal design
 * - Strong 3D effects (perspective, depth, shadows)
 * - Smooth transitions everywhere
 * - Full animations (hover, scroll, load)
 * - Professional yet modern
 */

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
  Users,
  Calendar,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingReview: 0,
    completed: 0,
    activeVehicles: 0,
    totalUsers: 0,
    thisMonth: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .select('id')
        .eq('is_active', true);

      const { data: users } = await supabase
        .from('users')
        .select('id');

      const totalRequests = requests?.length || 0;
      const pendingReview = requests?.filter(r => r.current_status === 'pending_admin').length || 0;
      const completed = requests?.filter(r => r.current_status === 'closed').length || 0;

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = requests?.filter(r =>
        new Date(r.submitted_at) >= firstDayOfMonth
      ).length || 0;

      setStats({
        totalRequests,
        pendingReview,
        completed,
        activeVehicles: vehicles?.length || 0,
        totalUsers: users?.length || 0,
        thisMonth
      });

      setRecentRequests(requests?.slice(0, 5) || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
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

  const statsData = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      icon: FileText,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/50'
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/50'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-600',
      shadowColor: 'shadow-green-500/50'
    },
    {
      title: 'Active Vehicles',
      value: stats.activeVehicles,
      icon: Truck,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-500/50'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/50'
    },
    {
      title: 'This Month',
      value: stats.thisMonth,
      icon: Calendar,
      color: 'cyan',
      bgGradient: 'from-cyan-500 to-blue-600',
      shadowColor: 'shadow-cyan-500/50'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header - Animated */}
        <div className="mb-8 animate-slideDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your transport management system
          </p>
        </div>

        {/* Stats Grid - 3D Cards with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group perspective-1000"
              style={{
                animation: 'slideUp 0.6s ease-out forwards',
                animationDelay: `${index * 100}ms`,
                opacity: 0
              }}
            >
              {/* 3D Card */}
              <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-6 hover:rotate-x-3">
                {/* Card Shadow - Animated */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${stat.shadowColor}`}></div>

                {/* Main Card */}
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2">
                  {/* Icon - No Background */}
                  <div className="mb-4">
                    <stat.icon className={`w-12 h-12 text-${stat.color}-600 transform transition-transform duration-500 group-hover:scale-110`} strokeWidth={1.5} />
                  </div>

                  {/* Value - Animated Counter */}
                  <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-900 transition-all duration-500 group-hover:scale-110 origin-left">
                      {stat.value}
                    </p>
                  </div>

                  {/* Title */}
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>

                  {/* Bottom Accent Line */}
                  <div className={`mt-4 h-0.5 bg-${stat.color}-600 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid - 3D Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests - 3D Card */}
          <div
            className="group perspective-1000"
            style={{
              animation: 'slideUp 0.6s ease-out forwards',
              animationDelay: '600ms',
              opacity: 0
            }}
          >
            <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-3">
              {/* Card Shadow */}
              <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

              {/* Main Card */}
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
                  </div>
                  {stats.totalRequests > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/admin/pending')}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>

                {recentRequests.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No requests yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentRequests.map((request, index) => (
                      <div
                        key={request.id}
                        className="group/item p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-blue-200 hover:shadow-md transform hover:-translate-x-1"
                        onClick={() => navigate(`/request/${request.id}`)}
                        style={{
                          animation: 'slideRight 0.4s ease-out forwards',
                          animationDelay: `${index * 100}ms`,
                          opacity: 0
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors">
                              {request.request_number}
                            </p>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {request.purpose}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(request.date_of_visit)}
                            </p>
                          </div>
                          <div className="ml-4 transform group-hover/item:scale-110 transition-transform duration-300">
                            <StatusBadge status={request.current_status} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions - 3D Card */}
          <div
            className="group perspective-1000"
            style={{
              animation: 'slideUp 0.6s ease-out forwards',
              animationDelay: '700ms',
              opacity: 0
            }}
          >
            <div className="relative preserve-3d transition-all duration-500 hover:rotate-y-3">
              {/* Card Shadow */}
              <div className="absolute inset-0 bg-purple-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

              {/* Main Card */}
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-6">
                  <Zap className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
                  <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      title: 'Review Pending Requests',
                      desc: `${stats.pendingReview} requests waiting`,
                      path: '/admin/pending',
                      icon: Clock,
                      gradient: 'from-amber-500 to-orange-600'
                    },
                    {
                      title: 'Assign Vehicles',
                      desc: 'Manage vehicle assignments',
                      path: '/admin/vehicle-assignment',
                      icon: Truck,
                      gradient: 'from-blue-500 to-cyan-600'
                    },
                    {
                      title: 'Complete Travel Details',
                      desc: 'Fill post-travel information',
                      path: '/admin/travel-completion',
                      icon: CheckCircle2,
                      gradient: 'from-green-500 to-emerald-600'
                    },
                    {
                      title: 'Manage Vehicles',
                      desc: `${stats.activeVehicles} active vehicles`,
                      path: '/admin/vehicles',
                      icon: Truck,
                      gradient: 'from-purple-500 to-pink-600'
                    },
                  ].map((action, index) => (
                    <button
                      key={index}
                      className="w-full group/action"
                      onClick={() => navigate(action.path)}
                      style={{
                        animation: 'slideLeft 0.4s ease-out forwards',
                        animationDelay: `${index * 100}ms`,
                        opacity: 0
                      }}
                    >
                      <div className="relative p-4 bg-gray-50 hover:bg-white rounded-xl transition-all duration-300 border border-transparent hover:border-gray-200 hover:shadow-md transform hover:translate-x-2">
                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} rounded-xl opacity-0 group-hover/action:opacity-10 transition-opacity duration-300`}></div>

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <action.icon className="w-6 h-6 text-gray-700 transform group-hover/action:scale-110 transition-all duration-300" strokeWidth={1.5} />
                            <div className="text-left">
                              <p className="font-semibold text-gray-900 group-hover/action:text-blue-600 transition-colors">
                                {action.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {action.desc}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400 group-hover/action:text-blue-600 transform group-hover/action:translate-x-2 transition-all duration-300" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }

        .rotate-y-6 {
          transform: rotateY(6deg);
        }

        .rotate-x-3 {
          transform: rotateX(3deg);
        }

        .rotate-y-3 {
          transform: rotateY(3deg);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;