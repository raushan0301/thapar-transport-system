import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { createNotification, notifyAdmins, notifyRegistrars } from '../../services/requestService';
import Button from '../common/Button';
import { Check, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestActions = ({ request, onActionComplete }) => {
    const { user, profile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [comment, setComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    if (!request || !profile) return null;

    const role = profile.role;
    let canAct = false;
    let actions = [];

    if (role === 'head' && request.current_status === 'pending_head') {
        const isAssignedHead = request.head_id === user.id || request.custom_head_email === user.email;
        if (isAssignedHead) {
            canAct = true;
            actions = [
                { type: 'reject', label: 'Reject', icon: <X className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm focus:ring-red-500' },
                { type: 'approve_head', label: 'Approve', icon: <Check className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-emerald-600 text-white border border-transparent hover:bg-emerald-700 shadow-sm hover:shadow focus:ring-emerald-500' }
            ];
        }
    } else if (role === 'admin' && request.current_status === 'pending_admin') {
        canAct = true;
        actions = [
            { type: 'reject', label: 'Reject', icon: <X className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm focus:ring-red-500' },
            { type: 'approve_route', label: 'Approve & Route', icon: <Send className="w-4 h-4" strokeWidth={2} />, color: 'bg-indigo-600 text-white border border-transparent hover:bg-indigo-700 shadow-sm hover:shadow focus:ring-indigo-500' },
            { type: 'approve_direct', label: 'Approve Directly', icon: <Check className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-emerald-600 text-white border border-transparent hover:bg-emerald-700 shadow-sm hover:shadow focus:ring-emerald-500' }
        ];
    } else if (role === 'registrar' && request.current_status === 'pending_registrar') {
        canAct = true;
        actions = [
            { type: 'reject', label: 'Reject', icon: <X className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-sm focus:ring-red-500' },
            { type: 'approve_registrar', label: 'Approve Request', icon: <Check className="w-4 h-4" strokeWidth={2.5} />, color: 'bg-emerald-600 text-white border border-transparent hover:bg-emerald-700 shadow-sm hover:shadow focus:ring-emerald-500' }
        ];
    }

    if (!canAct) return null;

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
            let logComment = comment.trim();

            // Determine status changes and notifications based on modalType
            if (modalType === 'reject') {
                nextStatus = 'rejected';
                actionType = 'rejected';
                notificationTitle = `Request Rejected by ${role.charAt(0).toUpperCase() + role.slice(1)}`;
                notificationMessage = `Your transport request has been rejected. Reason: ${comment}`;
            } else if (modalType === 'approve_head') {
                nextStatus = 'pending_admin';
                notificationTitle = 'Request Approved by Head';
                notificationMessage = 'Your transport request has been approved and forwarded to the Admin.';
            } else if (modalType === 'approve_route') {
                nextStatus = 'pending_registrar';
                notificationTitle = 'Request Approved by Admin';
                notificationMessage = 'Your transport request has been approved by the Admin and sent to the Registrar.';
            } else if (modalType === 'approve_direct') {
                nextStatus = 'approved_awaiting_vehicle';
                notificationTitle = 'Direct Approval by Admin';
                notificationMessage = 'Your transport request has been directly approved by the Admin.';
                if (!logComment) logComment = 'Direct Admin Approval';
            } else if (modalType === 'approve_registrar') {
                nextStatus = 'approved_awaiting_vehicle';
                notificationTitle = 'Request Approved by Registrar';
                notificationMessage = 'Your transport request has been approved by the Registrar and is awaiting vehicle assignment.';
            }

            // Create approval record
            const { error: approvalError } = await supabase
                .from('approvals')
                .insert([{
                    request_id: request.id,
                    approver_id: user.id,
                    approver_role: role,
                    action: actionType,
                    comment: logComment || null,
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
                .eq('id', request.id);

            if (updateError) throw updateError;

            // Notify the requester
            await createNotification({
                user_id: request.user_id,
                title: notificationTitle,
                message: notificationMessage,
                type: actionType === 'approved' ? 'approval' : 'rejection',
                related_request_id: request.id
            });

            // Route-specific notifications
            if (modalType === 'approve_head') {
                await notifyAdmins({
                    title: 'New Request for Review',
                    message: `Transport request ${request.request_number} has been approved by Head and is ready for your review.`,
                    type: 'new_request',
                    related_request_id: request.id
                });
            } else if (modalType === 'approve_route') {
                await notifyRegistrars({
                    title: 'New Request for Final Approval',
                    message: `Transport request ${request.request_number} has been routed to you for final approval.`,
                    type: 'new_request',
                    related_request_id: request.id
                });
            } else if (modalType === 'approve_registrar') {
                await notifyAdmins({
                    title: 'Vehicle Assignment Pending',
                    message: `Request ${request.request_number} has been approved by Registrar. Please assign a vehicle.`,
                    type: 'info',
                    related_request_id: request.id
                });
            }

            toast.success(`Request successfully processed!`);
            setShowModal(false);
            if (onActionComplete) onActionComplete();
        } catch (err) {
            toast.error(`Failed to process action: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-wrap gap-4 animate-slideDown" style={{ animationDelay: '50ms' }}>
                {actions.map((act) => (
                    <button
                        key={act.type}
                        onClick={() => handleActionClick(act.type)}
                        disabled={actionLoading}
                        className={`flex items-center space-x-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${act.color}`}
                    >
                        {act.icon}
                        <span>{act.label}</span>
                    </button>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
                        <div className={`p-6 text-white ${modalType === 'reject' ? 'bg-red-600' : modalType.includes('approve_route') ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-between`}>
                            <div className="flex items-center space-x-2">
                                {modalType === 'reject' ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                                <h3 className="text-xl font-bold">
                                    {modalType === 'reject' ? 'Reject Request' : 'Approve Request'}
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
                                placeholder={modalType === 'reject' ? 'Please explain why...' : 'Enter any notes...'}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                autoFocus
                            />
                            <div className="flex items-center justify-end space-x-3 mt-6">
                                <Button variant="secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>
                                    Cancel
                                </Button>
                                <Button 
                                    variant={modalType === 'reject' ? 'danger' : modalType.includes('approve_route') ? 'primary' : 'success'} 
                                    onClick={submitAction}
                                    loading={actionLoading}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RequestActions;
