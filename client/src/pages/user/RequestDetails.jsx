import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { ArrowLeft, User, MapPin, Calendar, Users, Car, Info, Clock, CheckCircle2, Edit, Trash2, Check, X } from 'lucide-react';
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

      console.log('Fetching request with ID:', id);
      console.log('Current user ID:', user?.id);

      // Fetch request without vehicle join (to avoid foreign key error)
      const { data: requestData, error: requestError } = await supabase
        .from('transport_requests')
        .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department, phone), head:users!transport_requests_head_id_fkey(full_name, email)')
        .eq('id', id)
        .single();

      console.log('Request data:', requestData);
      console.log('Request error:', requestError);

      if (requestError) {
        console.error('Supabase error details:', {
          message: requestError.message,
          details: requestError.details,
          hint: requestError.hint,
          code: requestError.code
        });
        throw requestError;
      }

      // Fetch vehicle separately if vehicle_id exists
      if (requestData?.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('vehicle_number, vehicle_type, model')
          .eq('id', requestData.vehicle_id)
          .single();

        if (vehicleData) {
          requestData.vehicle = vehicleData;
        }
      }

      // Fetch approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('approvals')
        .select('*, approver:users(full_name, email)')
        .eq('request_id', id)
        .order('created_at', { ascending: true });

      if (approvalsError) {
        console.error('Approvals error:', approvalsError);
      }

      setRequest(requestData);
      setApprovals(approvalsData || []);
    } catch (err) {
      console.error('Error fetching request details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete request ${request.request_number}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transport_requests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Request deleted successfully!');
      navigate('/my-requests');
    } catch (err) {
      console.error('Error deleting request:', err);
      toast.error('Failed to delete request');
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this request?')) {
      return;
    }

    try {
      console.log('Approving request:', id);
      console.log('Approver ID:', user.id);

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: id,
          approver_id: user.id,
          approver_role: 'head',
          action: 'approved',
          comment: null,
          approved_at: new Date().toISOString(),
        }]);

      if (approvalError) {
        console.error('Approval insert error:', approvalError);
        throw approvalError;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          current_status: 'pending_admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Request update error:', updateError);
        throw updateError;
      }

      toast.success('Request approved successfully!');
      navigate('/head/pending');
    } catch (err) {
      console.error('Error approving request:', err);
      toast.error(`Failed to approve request: ${err.message}`);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      console.log('Rejecting request:', id);
      console.log('Approver ID:', user.id);

      // Create approval record with rejection
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: id,
          approver_id: user.id,
          approver_role: 'head',
          action: 'rejected',
          comment: reason,
          approved_at: new Date().toISOString(),
        }]);

      if (approvalError) {
        console.error('Approval insert error:', approvalError);
        throw approvalError;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          current_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Request update error:', updateError);
        throw updateError;
      }

      toast.success('Request rejected');
      navigate('/head/pending');
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error(`Failed to reject request: ${err.message}`);

      // Check if current user is the request owner
      const isOwner = request.user_id === user.id;

      // Check if request can be edited (only by owner, not yet approved)
      const canEdit = isOwner && (request.current_status === 'pending_head' || request.current_status === 'draft');

      // Check if current user is the head who needs to approve
      const isAssignedHead = request.head_id === user.id || request.custom_head_email === user.email;
      const canApprove = isAssignedHead && request.current_status === 'pending_head';

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
                    {request.head && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" strokeWidth={1.5} />
                        <span>Forwarded to: <strong>{request.head.full_name}</strong> ({request.head.email})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {canApprove && (
                    <>
                      <button
                        onClick={handleReject}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <X className="w-5 h-5" strokeWidth={2} />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={handleApprove}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <Check className="w-5 h-5" strokeWidth={2} />
                        <span>Approve</span>
                      </button>
                    </>
                  )}
                  {canEdit && (
                    <>
                      <Button
                        variant="secondary"
                        icon={Trash2}
                        onClick={handleDelete}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        icon={Edit}
                        onClick={() => navigate(`/edit-request/${request.id}`)}
                      >
                        Edit Request
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Request Information */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
                  <div className="flex items-center space-x-2 mb-6">
                    <Info className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-semibold text-gray-900">Request Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Visit</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        <p className="text-gray-900">{formatDate(request.date_of_visit)}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Time</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        <p className="text-gray-900">{request.time_of_visit}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Place of Visit</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        <p className="text-gray-900">{request.place_of_visit}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Number of Persons</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
                        <p className="text-gray-900">{request.number_of_persons}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600">Purpose</label>
                    <p className="text-gray-900 mt-1">{request.purpose}</p>
                  </div>
                </div>

                {/* User Details */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
                  <div className="flex items-center space-x-2 mb-6">
                    <User className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 mt-1">{request.user?.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 mt-1">{request.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Department</label>
                      <p className="text-gray-900 mt-1">{request.user?.department || request.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Designation</label>
                      <p className="text-gray-900 mt-1">{request.designation}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                {request.vehicle && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
                    <div className="flex items-center space-x-2 mb-6">
                      <Car className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                      <h2 className="text-xl font-semibold text-gray-900">Vehicle Assigned</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Vehicle Number</label>
                        <p className="text-gray-900 mt-1">{request.vehicle.vehicle_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="text-gray-900 mt-1">{request.vehicle.vehicle_type}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '400ms', opacity: 0, animationFillMode: 'forwards' }}>
                  <div className="flex items-center space-x-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-semibold text-gray-900">Approval Timeline</h2>
                  </div>
                  <div className="space-y-4">
                    {approvals.length === 0 ? (
                      <p className="text-sm text-gray-500">No approvals yet</p>
                    ) : (
                      approvals.map((approval, i) => (
                        <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${approval.action === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {approval.action === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} /> : <Clock className="w-4 h-4 text-red-600" strokeWidth={2} />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{approval.approver?.full_name}</p>
                            <p className="text-sm text-gray-600 capitalize">{approval.approver_role}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(approval.created_at)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Info */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '500ms', opacity: 0, animationFillMode: 'forwards' }}>
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted</span>
                      <span className="text-gray-900">{formatDate(request.submitted_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <StatusBadge status={request.current_status} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Editable</span>
                      <span className={request.is_editable ? 'text-green-600' : 'text-gray-600'}>{request.is_editable ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DashboardLayout>

          <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
      );
    };
  }
};
export default RequestDetails;
