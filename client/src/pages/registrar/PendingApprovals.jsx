import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { createNotification, notifyAdmins } from '../../services/requestService';
import { formatDate, formatTime } from '../../utils/helpers';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);

      // Fetch requests pending registrar approval
      const { data, error } = await supabase
        .from('transport_requests')
        .select(`
          *,
          user:users!transport_requests_user_id_fkey(full_name, email, department)
        `)
        .eq('current_status', 'pending_registrar')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);

      // Update request status to approved awaiting vehicle
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          current_status: 'approved_awaiting_vehicle',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          request_id: selectedRequest.id,
          approver_id: user.id,
          approver_role: 'registrar',
          action: 'approved',
          comment: comments || null,
          approved_at: new Date().toISOString()
        });

      if (approvalError) throw approvalError;

      // Create notification for user
      await createNotification({
        user_id: selectedRequest.user_id,
        title: 'Request Approved',
        message: `Your request ${selectedRequest.request_number} has been approved and is awaiting vehicle assignment`,
        type: 'approval',
        related_request_id: selectedRequest.id,
      });

      // Notify all admins about the new request
      await notifyAdmins({
        title: 'Vehicle Assignment Pending',
        message: `Request ${selectedRequest.request_number} has been approved by Registrar and needs vehicle assignment`,
        type: 'info',
        related_request_id: selectedRequest.id,
      });

      toast.success('Request approved successfully');
      setShowApproveModal(false);
      setComments('');
      setSelectedRequest(null);
      fetchPendingRequests();

    } catch (err) {
      console.error('Error approving request:', err);
      toast.error('Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);

      // Update request status
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          current_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          request_id: selectedRequest.id,
          approver_id: user.id,
          approver_role: 'registrar',
          action: 'rejected',
          comment: comments,
          approved_at: new Date().toISOString()
        });

      if (approvalError) throw approvalError;

      // Create notification for user
      await createNotification({
        user_id: selectedRequest.user_id,
        title: 'Request Rejected',
        message: `Your request ${selectedRequest.request_number} has been rejected by Registrar`,
        type: 'rejection',
        related_request_id: selectedRequest.id,
      });

      toast.success('Request rejected');
      setShowRejectModal(false);
      setComments('');
      setSelectedRequest(null);
      fetchPendingRequests();

    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
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

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Final Approvals</h1>

      <Card>
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No pending approvals</p>
            <p className="text-sm mt-2">Requests forwarded by admin/authority will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Place
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Persons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.request_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{request.user?.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{request.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.department?.toUpperCase() || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={request.purpose}>
                        {request.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.place_of_visit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(request.date_of_visit)}</div>
                      <div className="text-xs text-gray-400">{formatTime(request.time_of_visit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.number_of_persons}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 flex items-center">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/registrar/review/${request.id}`)}
                      >
                        Review
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setComments('');
          setSelectedRequest(null);
        }}
        title="Approve Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to give final approval to request <strong>{selectedRequest?.request_number}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            After approval, the request will be ready for vehicle assignment.
          </p>

          <Textarea
            label="Comments (Optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any comments..."
            rows={3}
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowApproveModal(false);
                setComments('');
                setSelectedRequest(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setComments('');
          setSelectedRequest(null);
        }}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to reject request <strong>{selectedRequest?.request_number}</strong>?
          </p>

          <Textarea
            label="Reason for Rejection *"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Please provide a reason..."
            rows={3}
            required
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setComments('');
                setSelectedRequest(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={processing || !comments.trim()}
            >
              {processing ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default PendingApprovals;