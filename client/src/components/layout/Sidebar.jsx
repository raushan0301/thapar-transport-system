import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Car,
  Users,
  Settings,
  FileSpreadsheet,
  Shield,
  UserCheck,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import { supabase } from '../../services/supabase';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, loading } = useAuth();
  const [counts, setCounts] = useState({
    headPending: 0,
    adminPending: 0,
    vehicleAssignment: 0,
    travelCompletion: 0,
    registrarPending: 0
  });

  useEffect(() => {
    if (!profile || !user) return;

    const fetchCounts = async () => {
      try {
        if (profile.role === ROLES.HEAD) {
          const { count } = await supabase
            .from('transport_requests')
            .select('*', { count: 'exact', head: true })
            .eq('current_status', 'pending_head')
            .or(`head_id.eq.${user.id},custom_head_email.eq.${user.email}`);
            
          setCounts(prev => ({ ...prev, headPending: count || 0 }));
        }

        if (profile.role === ROLES.ADMIN) {
          const { count: pendingCount } = await supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('current_status', 'pending_admin');
          const { count: vehicleCount } = await supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('current_status', 'approved_awaiting_vehicle');
          const { count: travelCount } = await supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('current_status', 'vehicle_assigned');
          
          setCounts(prev => ({
            ...prev,
            adminPending: pendingCount || 0,
            vehicleAssignment: vehicleCount || 0,
            travelCompletion: travelCount || 0
          }));
        }

        if (profile.role === ROLES.REGISTRAR) {
          const { count } = await supabase.from('transport_requests').select('*', { count: 'exact', head: true }).eq('current_status', 'pending_registrar');
          setCounts(prev => ({ ...prev, registrarPending: count || 0 }));
        }
      } catch (err) {
        console.error('Failed to fetch counts:', err);
      }
    };

    fetchCounts();

    const channel = supabase.channel('sidebar_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_requests' }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, user]);

  // Wait for profile to load
  if (loading || !profile) {
    return null; // Don't show sidebar until profile is loaded
  }

  // Navigation items based on role
  const getNavItems = () => {
    const role = profile?.role;

    const commonItems = [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
    ];

    if (role === ROLES.USER) {
      return [
        ...commonItems,
        { name: 'New Request', path: '/new-request', icon: FileText },
        { name: 'My Requests', path: '/my-requests', icon: Clock },
      ];
    }

    if (role === ROLES.HEAD) {
      return [
        ...commonItems,
        { name: 'New Request', path: '/new-request', icon: FileText },
        { name: 'My Requests', path: '/my-requests', icon: Clock },
        { name: 'Pending Approvals', path: '/head/pending', icon: CheckCircle, badge: counts.headPending },
        { name: 'Approval History', path: '/head/history', icon: XCircle },
      ];
    }

    if (role === ROLES.ADMIN) {
      return [
        ...commonItems,
        { name: 'New Request', path: '/new-request', icon: FileText },
        { name: 'My Requests', path: '/my-requests', icon: Clock },
        { name: 'Pending Review', path: '/admin/pending', icon: CheckCircle, badge: counts.adminPending },
        { name: 'Vehicle Assignment', path: '/admin/vehicle-assignment', icon: Car, badge: counts.vehicleAssignment },
        { name: 'Travel Completion', path: '/admin/travel-completion', icon: XCircle, badge: counts.travelCompletion },
        { name: 'Vehicle Management', path: '/admin/vehicles', icon: Car },
        { name: 'User Management', path: '/admin/users', icon: Users },
        { name: 'Rate Settings', path: '/admin/rates', icon: Settings },
        { name: 'Export Data', path: '/admin/export', icon: FileSpreadsheet },
        { name: 'Audit Logs', path: '/admin/audit', icon: Shield },
      ];
    }

    if (role === ROLES.REGISTRAR) {
      return [
        ...commonItems,
        { name: 'New Request', path: '/new-request', icon: FileText },
        { name: 'My Requests', path: '/my-requests', icon: Clock },
        { name: 'Pending Approvals', path: '/registrar/pending', icon: CheckCircle, badge: counts.registrarPending },
        { name: 'Approval History', path: '/registrar/history', icon: XCircle },
      ];
    }

    if (role === ROLES.DRIVER) {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'My Assignments', path: '/driver/assignments', icon: Truck },
        { name: 'My Profile', path: '/driver/profile', icon: UserCheck },
      ];
    }

    return commonItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-72`}
      >
        <div className="h-full overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="font-medium flex-1 truncate text-[15px]">{item.name}</span>
                {item.badge > 0 && (
                  <span className="shrink-0 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] inline-flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;