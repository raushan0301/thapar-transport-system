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
import LandingPage from '../pages/LandingPage';

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
import HeadReviewRequest from '../pages/head/ReviewRequest';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminPendingReview from '../pages/admin/PendingReview';
import AdminReviewRequest from '../pages/admin/ReviewRequest';
import VehicleAssignment from '../pages/admin/VehicleAssignment';
import TravelCompletion from '../pages/admin/TravelCompletion';
import VehicleManagement from '../pages/admin/VehicleManagement';
import HeadManagement from '../pages/admin/HeadManagement';
import UserManagement from '../pages/admin/UserManagement';
import RateSettings from '../pages/admin/RateSettings';
import ExportData from '../pages/admin/ExportData';
import AuditLogs from '../pages/admin/AuditLogs';
import DriverManagement from '../pages/admin/DriverManagement';

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
      {/* Landing Page */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />

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
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR]}>
              <NewRequest />
            </RoleRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/my-requests"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR]}>
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
            <RoleRoute allowedRoles={[ROLES.USER, ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR]}>
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
      <Route
        path="/head/review/:id"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.HEAD]}>
              <HeadReviewRequest />
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
        path="/admin/review/:id"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminReviewRequest />
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
        path="/admin/users"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <UserManagement />
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
      <Route
        path="/admin/drivers"
        element={
          <PrivateRoute>
            <RoleRoute allowedRoles={[ROLES.ADMIN]}>
              <DriverManagement />
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