import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { createNotification } from '../../services/requestService';
import { ArrowLeft, User, MapPin, Calendar, Users, FileText, Clock, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const HeadReviewRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'approve' or 'reject'
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (id && user?.id) fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user?.id]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department, designation, phone)')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Check if current user is assigned head
            const isAssignedHead = data.head_id === user.id || data.custom_head_email === user.email;
            if (!isAssignedHead || data.current_status !== 'pending_head') {
                toast.error('You are not authorized to review this request');
                navigate('/head/pending');
                return;
            }

            setRequest(data);
        } catch (err) {
            console.error('Error:', err);
            toast.error('Failed to load request');
            navigate('/head/pending');
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
            const action = modalType === 'approve' ? 'approved' : 'rejected';
            const nextStatus = modalType === 'approve' ? 'pending_admin' : 'rejected';

            // Create approval record
            const { error: approvalError } = await supabase
                .from('approvals')
                .insert([{
                    request_id: id,
                    approver_id: user.id,
                    approver_role: 'head',
                    action: action,
                    comment: comment.trim() || null,
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
                title: modalType === 'approve' ? 'Request Approved by Head' : 'Request Rejected by Head',
                message: modalType === 'approve' 
                    ? `Your transport request has been approved and forwarded to the Admin.` 
                    : `Your transport request has been rejected. Reason: ${comment}`,
                type: modalType === 'approve' ? 'approval' : 'rejection',
                related_request_id: request.id
            });

            toast.success(modalType === 'approve' ? 'Request approved successfully!' : 'Request rejected successfully');
            setShowModal(false);
            navigate('/head/pending');
        } catch (err) {
            console.error(`❌ ${modalType.toUpperCase()} FAILED:`, err);
            toast.error(`Failed to ${modalType}: ${err.message || 'Unknown error'}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;
    if (!request) return <DashboardLayout><div className="text-center py-12"><p className="text-gray-500">Request not found</p></div></DashboardLayout>;    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <DashboardLayout>
                {/* Header */}
                <div className="mb-8 animate-slideDown">
                    <button onClick={() => navigate('/head/pending')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Pending Approvals</span>
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Review Transport Request</h1>
                            <p className="text-gray-600">Request Number: <span className="font-semibold text-amber-600">{request.request_number}</span></p>
                        </div>
                        <StatusBadge status={request.current_status} />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mb-6 flex space-x-4 animate-slideDown" style={{ animationDelay: '100ms' }}>
                    <button
                        onClick={() => handleActionClick('reject')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X className="w-5 h-5" strokeWidth={2} />
                        <span>Reject</span>
                    </button>
                    <button
                        onClick={() => handleActionClick('approve')}
                        disabled={actionLoading}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-5 h-5" strokeWidth={2} />
                        <span>Approve</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Request Information */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center space-x-2 mb-4">
                            <FileText className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
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
                                    <p className="font-medium text-gray-900">{request.purpose}</p>
                                </div>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-slideUp" style={{ animationDelay: '300ms' }}>
                            <div className="flex items-center space-x-2 mb-4">
                                <User className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
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
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 animate-slideUp" style={{ animationDelay: '400ms' }}>
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> Approving this request will forward it to the Transport Admin for vehicle assignment. Rejecting will notify the user with your provided reason.
                        </p>
                    </div>
                {/* Legend Modal (Custom Dialog) */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
                            <div className={`p-6 text-white ${modalType === 'approve' ? 'bg-green-600' : 'bg-red-600'} flex items-center justify-between`}>
                                <div className="flex items-center space-x-2">
                                    {modalType === 'approve' ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                                    <h3 className="text-xl font-bold">
                                        {modalType === 'approve' ? 'Approve Request' : 'Reject Request'}
                                    </h3>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    {modalType === 'approve' ? 'Comments/Notes (Optional)' : 'Reason for Rejection (Required)'}
                                </label>
                                <textarea 
                                    className="w-full h-32 border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                    placeholder={modalType === 'approve' ? 'Enter any instructions or notes...' : 'Please explain why this request is being rejected...'}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex items-center justify-end space-x-3 mt-6">
                                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={actionLoading}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant={modalType === 'approve' ? 'success' : 'danger'} 
                                        onClick={submitAction}
                                        loading={actionLoading}
                                    >
                                        Confirm {modalType === 'approve' ? 'Approval' : 'Rejection'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
            
            <style jsx="true">{`
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slideUp { animation: slideUp 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default HeadReviewRequest;
