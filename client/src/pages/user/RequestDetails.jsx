import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { ArrowLeft, User, MapPin, Calendar, Users, Car, Info, Clock, CheckCircle2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user?.id) fetchRequestDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);

      // Fetch request details
      const { data: requestData, error: requestError } = await supabase
        .from('transport_requests')
        .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department, phone)')
        .eq('id', id)
        .maybeSingle();

      if (requestError) throw requestError;

      // Fetch vehicle separately if assigned
      if (requestData?.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', requestData.vehicle_id)
          .maybeSingle();

        if (vehicleData) {
          requestData.vehicle = vehicleData;
        }
      }

      setRequest(requestData);

      // Fetch approval history (only approved/rejected, not routing actions)
      const { data: approvalsData } = await supabase
        .from('approvals')
        .select('*, approver:users!approvals_approver_id_fkey(full_name, email)')
        .eq('request_id', id)
        .in('action', ['approved', 'rejected'])
        .order('approved_at', { ascending: true });

      setApprovals(approvalsData || []);
    } catch (err) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = () => {
    // Navigate to edit page for rejected request
    // The edit page will handle resetting the status to pending_head
    navigate(`/edit-request/${request.id}?resubmit=true`);
  };

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;
  if (!request) return <DashboardLayout><div className="text-center py-12"><p className="text-gray-500">Request not found</p></div></DashboardLayout>;

  // Check if current user is the request owner
  const isOwner = request.user_id === user.id;

  // Check if request can be edited (by owner, not yet fully approved)
  const canEdit = isOwner && (
    request.current_status === 'pending_head' || 
    request.current_status === 'pending_admin' || 
    request.current_status === 'draft'
  );

  // Check if request can be resubmitted (only by owner, if rejected)
  const canResubmit = isOwner && request.current_status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} className="mb-4">Back</Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{request.request_number}</h1>
              <div className="flex items-center space-x-3">
                <StatusBadge status={request.current_status} />
              </div>
            </div>
            <div className="flex space-x-3">
              {canEdit && (
                <Button
                  variant="primary"
                  icon={Edit}
                  onClick={() => navigate(`/edit-request/${request.id}`)}
                >
                  Edit Request
                </Button>
              )}
              {canResubmit && (
                <Button
                  variant="primary"
                  icon={Edit}
                  onClick={handleResubmit}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Resubmit Request
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-gray-900">Request Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date of Visit</p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{formatDate(request.date_of_visit)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Time</p>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{request.time_of_visit || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Place of Visit</p>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{request.place_of_visit}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Number of Persons</p>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{request.number_of_persons || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Purpose</p>
                <p className="font-medium text-gray-900">{request.purpose?.split('\n\n[Guest Details]:')[0].split('\n\n[Special Requirements]:')[0]}</p>
              </div>

              {(request.special_requirements || request.purpose?.includes('[Special Requirements]:')) && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-semibold mb-1">Special Requirements</p>
                  <p className="text-amber-900">
                    {request.special_requirements || request.purpose?.split('\n\n[Special Requirements]:\n')[1]}
                  </p>
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{request.user?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{request.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Department</p>
                  <p className="font-medium text-gray-900">{request.user?.department || request.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{request.user?.phone || 'N/A'}</p>
                </div>
              </div>

              {request.purpose?.includes('[Guest Details]:') && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <p className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Guest Information
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Guest Name</p>
                      <p className="font-medium text-gray-900">{request.purpose.split('\n\n[Guest Details]:\n')[1]?.split('\nContact: ')[0].replace('Name: ', '') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Contact No.</p>
                      <p className="font-medium text-gray-900">{request.purpose.split('\nContact: ')[1]?.split('\n\n[Special Requirements]:')[0] || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Details (if assigned) */}
            {request.vehicle && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center space-x-2 mb-4">
                  <Car className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                  <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Vehicle Number</p>
                    <p className="font-medium text-gray-900">{request.vehicle.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium text-gray-900">{request.vehicle.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Driver Name</p>
                    <p className="font-medium text-gray-900">{request.driver_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Driver Contact</p>
                    <p className="font-medium text-gray-900">{request.driver_contact || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '100ms' }}>
              <h3 className="font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">{formatDate(request.submitted_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={request.current_status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Editable</p>
                  <p className="font-medium text-gray-900">{canEdit ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Approval Timeline */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle2 className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                <h3 className="font-bold text-gray-900">Approval Timeline</h3>
              </div>
              {approvals.length === 0 ? (
                <p className="text-sm text-gray-500">No approvals yet</p>
              ) : (
                <div className="space-y-4">
                  {approvals.map((approval, index) => (
                    <div key={approval.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 last:border-0 last:pb-0">
                      <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-600"></div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{approval.approver?.full_name}</p>
                        <p className="text-xs text-gray-500">{approval.approver_role}</p>
                        <p className={`text-xs font-medium mt-1 ${approval.action === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {approval.action.toUpperCase()}
                        </p>
                        {approval.comment && (
                          <p className="text-xs text-gray-600 mt-1 italic">"{approval.comment}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(approval.approved_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RequestDetails;
