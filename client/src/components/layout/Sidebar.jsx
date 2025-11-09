import React from 'react';
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
  BarChart,
  FileSpreadsheet,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { profile } = useAuth();

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
        { name: 'Pending Approvals', path: '/head/pending', icon: Clock },
        { name: 'Approval History', path: '/head/history', icon: CheckCircle },
      ];
    }

    if (role === ROLES.ADMIN) {
      return [
        ...commonItems,
        { name: 'Pending Review', path: '/admin/pending', icon: Clock },
        { name: 'Vehicle Assignment', path: '/admin/vehicle-assignment', icon: Car },
        { name: 'Travel Completion', path: '/admin/travel-completion', icon: CheckCircle },
        { name: 'Vehicle Management', path: '/admin/vehicles', icon: Car },
        { name: 'Head Management', path: '/admin/heads', icon: Users },
        { name: 'Rate Settings', path: '/admin/rates', icon: Settings },
        { name: 'Export Data', path: '/admin/export', icon: FileSpreadsheet },
        { name: 'Audit Logs', path: '/admin/audit', icon: Shield },
      ];
    }

    if ([ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR, ROLES.DEAN].includes(role)) {
      return [
        ...commonItems,
        { name: 'Pending Approvals', path: '/authority/pending', icon: Clock },
        { name: 'Approval History', path: '/authority/history', icon: CheckCircle },
      ];
    }

    if (role === ROLES.REGISTRAR) {
      return [
        ...commonItems,
        { name: 'Pending Approvals', path: '/registrar/pending', icon: Clock },
        { name: 'Approval History', path: '/registrar/history', icon: CheckCircle },
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
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="h-full overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;