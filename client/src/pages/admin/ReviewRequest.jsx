import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { createNotification, notifyRegistrars } from '../../services/requestService';
import { ArrowLeft, User, MapPin, Calendar, Users, FileText, Clock, Check, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReviewRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approve_route', 'approve_direct', 'reject'
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (id && user?.id) fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);

    const fetchRequest = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department, designation, phone)')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Check if status is pending_admin (more lenient - don't check role here as it might redirect admins)
            if (data.current_status !== 'pending_admin') {

                toast.error(`This request is not pending admin review (Status: ${data.current_status})`);
                navigate('/admin/pending');
                return;
            }

            setRequest(data);
        } catch (err) {
            toast.error(`Failed to load request: ${err.message}`);
            navigate('/admin/pending');
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (type) => {
        setModalType(type);
        setComment('');
        setShowModal(true);
    };

    const submitAction = async () => {
        if (modalType === 'reject' && !comment.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        try {
            let nextStatus;
            let actionType = 'approved';
            let notificationTitle;
            let notificationMessage;
            let actionText;

            if (modalType === 'approve_route') {
                nextStatus = 'pending_registrar';
                notificationTitle = 'Request Approved by Admin';
                notificationMessage = `Your transport request has been approved by the Admin and sent to the Registrar.`;
                actionText = 'approved and routed to Registrar';
            } else if (modalType === 'approve_direct') {
                nextStatus = 'approved_awaiting_vehicle';
                notificationTitle = 'Direct Approval by Admin';
                notificationMessage = `Your transport request has been directly approved by the Admin.`;
                actionText = 'approved directly';
            } else {
                nextStatus = 'rejected';
                actionType = 'rejected';
                notificationTitle = 'Request Rejected by Admin';
                notificationMessage = `Your transport request has been rejected by the Admin. Reason: ${comment}`;
                actionText = 'rejected';
            }

            // Create approval record
            const { error: approvalError } = await supabase
                .from('approvals')
                .insert([{
                    request_id: id,
                    approver_id: user.id,
                    approver_role: 'admin',
                    action: actionType,
                    comment: comment.trim() || (modalType === 'approve_direct' ? 'Direct Admin Approval' : null),
                    approved_at: new Date().toISOString(),
                }]);

            if (approvalError) throw approvalError;

            // Update request status
            const { error: updateError } = await supabase
                .from('transport_requests')
                .update({
                    current_status: nextStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Notify the requester
            await createNotification({
                user_id: request.user_id,
                title: notificationTitle,
                message: notificationMessage,
                type: actionType === 'approved' ? 'approval' : 'rejection',
                related_request_id: id
            });

            // If routing to registrar, notify all registrars
            if (modalType === 'approve_route') {
                await notifyRegistrars({
                    title: 'New Request for Final Approval',
                    message: `Transport request ${request.request_number} has been routed to you for final approval.`,
                    type: 'new_request',
                    related_request_id: id
                });
            }

            toast.success(`Request ${actionText}!`);
            setShowModal(false);
            navigate('/admin/pending');
        } catch (err) {
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;
    if (!request) return <DashboardLayout><div className="text-center py-12"><p className="text-gray-500">Request not found</p></div></DashboardLayout>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <DashboardLayout>
                {/* Header */}
                <div className="mb-8 animate-slideDown">
                    <button onClick={() => navigate('/admin/pending')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Pending Review</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Process Transport Request</h1>
                            <p className="text-gray-600">Request Number: <span className="font-semibold text-blue-600">{request.request_number}</span></p>
                        </div>
                        <StatusBadge status={request.current_status} />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-6 flex flex-wrap gap-4 animate-slideDown" style={{ animationDelay: '100ms' }}>
                    <button
                        onClick={() => handleActionClick('reject')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5" strokeWidth={2} />
                        <span>Reject</span>
                    </button>
                    <button
                        onClick={() => handleActionClick('approve_route')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" strokeWidth={2} />
                        <span>Approve & Route to Registrar</span>
                    </button>
                    <button
                        onClick={() => handleActionClick('approve_direct')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-5 h-5" strokeWidth={2} />
                        <span>Approve Directly</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request Information */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center space-x-2 mb-4">
                            <FileText className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                            <h2 className="text-xl font-bold text-gray-900">Request Information</h2>
                        </div>
                        <div className="space-y-4">
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
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Purpose</p>
                                <p className="font-medium text-gray-900">{request.purpose?.split('\n\n[Guest Details]:')[0].split('\n\n[Special Requirements]:')[0]}</p>
                            </div>
                            {(request.special_requirements || request.purpose?.includes('[Special Requirements]:')) && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-semibold mb-1">Special Requirements</p>
                                    <p className="text-blue-900">
                                        {request.special_requirements || request.purpose?.split('\n\n[Special Requirements]:\n')[1]}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Details */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center space-x-2 mb-4">
                            <User className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
                            <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Name</p>
                                <p className="font-medium text-gray-900">{request.user?.full_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{request.user?.email || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Department</p>
                                    <p className="font-medium text-gray-900">{request.user?.department || request.department}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Designation</p>
                                    <p className="font-medium text-gray-900">{request.user?.designation || request.designation}</p>
                                </div>
                            </div>

                            {request.purpose?.includes('[Guest Details]:') && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wider">Guest Information</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Guest Name</p>
                                            <p className="font-medium text-gray-900">{request.purpose.split('\n\n[Guest Details]:\n')[1]?.split('\nContact: ')[0].replace('Name: ', '') || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Contact No.</p>
                                            <p className="font-medium text-gray-900">{request.purpose.split('\nContact: ')[1]?.split('\n\n[Special Requirements]:')[0] || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>

            {/* Action Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <div className={`p-6 text-white ${modalType === 'reject' ? 'bg-red-600' : modalType === 'approve_route' ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-between`}>
                            <div className="flex items-center space-x-2">
                                {modalType === 'reject' ? <X className="w-6 h-6" /> : modalType === 'approve_route' ? <Send className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                                <h3 className="text-xl font-bold">
                                    {modalType === 'reject' ? 'Reject Request' : modalType === 'approve_route' ? 'Approve & Route' : 'Approve Directly'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                {modalType === 'reject' ? 'Reason for Rejection (Required)' : 'Comments/Notes (Optional)'}
                            </label>
                            <textarea 
                                className="w-full h-32 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                placeholder={modalType === 'reject' ? 'Please explain why this request is being rejected...' : 'Enter any instructions or notes...'}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                autoFocus
                            />
                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant={modalType === 'reject' ? 'danger' : modalType === 'approve_route' ? 'primary' : 'success'} 
                                    onClick={submitAction}
                                    loading={actionLoading}
                                >
                                    Confirm {modalType === 'reject' ? 'Rejection' : 'Approval'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
};

export default AdminReviewRequest;
