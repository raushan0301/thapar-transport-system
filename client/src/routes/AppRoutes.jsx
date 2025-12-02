import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import { ROLES } from '../utils/constants';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Shared Pages
import NotFound from '../pages/shared/NotFound';
import Unauthorized from '../pages/shared/Unauthorized';
import Profile from '../pages/shared/Profile';

// User Pages
import UserDashboard from '../pages/user/UserDashboard';
import NewRequest from '../pages/user/NewRequest';
import MyRequests from '../pages/user/MyRequests';
import RequestDetails from '../pages/user/RequestDetails';
import EditRequest from '../pages/user/EditRequest';

// Head Pages
import HeadDashboard from '../pages/head/HeadDashboard';
import HeadPendingApprovals from '../pages/head/PendingApprovals';
import HeadApprovalHistory from '../pages/head/ApprovalHistory';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPendingReview from '../pages/admin/PendingReview';
import VehicleAssignment from '../pages/admin/VehicleAssignment';
import TravelCompletion from '../pages/admin/TravelCompletion';
import VehicleManagement from '../pages/admin/VehicleManagement';
import HeadManagement from '../pages/admin/HeadManagement';
import RateSettings from '../pages/admin/RateSettings';
import ExportData from '../pages/admin/ExportData';
import AuditLogs from '../pages/admin/AuditLogs';

// Authority Pages
import AuthorityDashboard from '../pages/authority/AuthorityDashboard';
import AuthorityPendingApprovals from '../pages/authority/PendingApprovals';
import AuthorityApprovalHistory from '../pages/authority/ApprovalHistory';

// Registrar Pages
import RegistrarDashboard from '../pages/registrar/RegistrarDashboard';
import RegistrarPendingApprovals from '../pages/registrar/PendingApprovals';
import RegistrarApprovalHistory from '../pages/registrar/ApprovalHistory';
import Loader from '../components/common/Loader';

// Dashboard Router - Shows correct dashboard based on user role
const DashboardRouter = () => {
  const { profile } = useAuth();

  // Show loader while profile is loading
  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  // Route to appropriate dashboard based on role
  switch (profile.role) {
    case ROLES.HEAD:
      return <HeadDashboard />;
    case ROLES.ADMIN:
      return <AdminDashboard />;
    case ROLES.DIRECTOR:
    case ROLES.DEPUTY_DIRECTOR:
    case ROLES.DEAN:
      return <AuthorityDashboard />;
    case ROLES.REGISTRAR:
      return <RegistrarDashboard />;
    case ROLES.USER:
    default:
      return <UserDashboard />;
  }
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Profile */}
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />

      {/* Dashboard - Role Based */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardRouter />
          </PrivateRoute>
        }
      />

      {/* User Routes */}
      <Route
        path="/new-request"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.USER]}>
              <NewRequest />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.USER]}>
              <MyRequests />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/request/:id"
        element={
          <PrivateRoute>
            <RequestDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/edit-request/:id"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.USER]}>
              <EditRequest />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Head Routes */}
      <Route
        path="/head/pending"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.HEAD]}>
              <HeadPendingApprovals />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/head/history"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.HEAD]}>
              <HeadApprovalHistory />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/pending"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminPendingReview />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/vehicle-assignment"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <VehicleAssignment />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/travel-completion"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <TravelCompletion />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/vehicles"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <VehicleManagement />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/heads"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <HeadManagement />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/rates"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <RateSettings />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <ExportData />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AuditLogs />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Authority Routes */}
      <Route
        path="/authority/pending"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR, ROLES.DEAN]}>
              <AuthorityPendingApprovals />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/authority/history"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.DIRECTOR, ROLES.DEPUTY_DIRECTOR, ROLES.DEAN]}>
              <AuthorityApprovalHistory />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Registrar Routes */}
      <Route
        path="/registrar/pending"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.REGISTRAR]}>
              <RegistrarPendingApprovals />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/registrar/history"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.REGISTRAR]}>
              <RegistrarApprovalHistory />
            </RoleRoute>
          </PrivateRoute>
        }
      />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;