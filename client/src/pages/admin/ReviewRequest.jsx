import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { ArrowLeft, User, MapPin, Calendar, Users, FileText, Clock, Check, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReviewRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuthorityModal, setShowAuthorityModal] = useState(false);
    const [selectedAuthority, setSelectedAuthority] = useState('');

    const AUTHORITIES = ['REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN'];

    useEffect(() => {
        if (id && user?.id) fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            console.log('Admin Review - User:', user);
            console.log('Admin Review - Request ID:', id);

            const { data, error } = await supabase
                .from('transport_requests')
                .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department, designation, phone)')
                .eq('id', id)
                .single();

            console.log('Admin Review - Request Data:', data);
            console.log('Admin Review - Error:', error);

            if (error) throw error;

            // Check if status is pending_admin (more lenient - don't check role here as it might redirect admins)
            if (data.current_status !== 'pending_admin') {
                console.log('Admin Review - Wrong status:', data.current_status);
                toast.error(`This request is not pending admin review (Status: ${data.current_status})`);
                navigate('/admin/pending');
                return;
            }

            setRequest(data);
        } catch (err) {
            console.error('Admin Review - Error:', err);
            toast.error(`Failed to load request: ${err.message}`);
            navigate('/admin/pending');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAndAssign = async () => {
        // NOTE: window.confirm() was being auto-cancelled by browser
        console.log('🔵 Admin approve button clicked');

        try {
            console.log('📝 Creating admin approval...');
            console.log('Request ID:', id);
            console.log('Approver ID:', user.id);

            // Create approval record
            const { data: approvalData, error: approvalError } = await supabase
                .from('approvals')
                .insert([{
                    request_id: id,
                    approver_id: user.id,
                    approver_role: 'admin',
                    action: 'approved',
                    comment: null,
                    approved_at: new Date().toISOString(),
                }])
                .select();

            if (approvalError) {
                console.error('❌ Approval failed:', approvalError);
                console.error('Error details:', JSON.stringify(approvalError, null, 2));
                throw approvalError;
            }

            console.log('✅ Approval created:', approvalData);
            console.log('📝 Updating request status...');

            // Update request status
            const { error: updateError } = await supabase
                .from('transport_requests')
                .update({
                    current_status: 'pending_vehicle',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (updateError) {
                console.error('❌ Status update failed:', updateError);
                throw updateError;
            }

            console.log('✅ Request approved successfully');

            toast.success('Request approved! Redirecting to vehicle assignment...');
            navigate('/admin/vehicle-assignment');
        } catch (err) {
            console.error('❌ ADMIN APPROVAL FAILED:', err);
            console.error('Error details:', JSON.stringify(err, null, 2));
            toast.error(`Failed to approve: ${err.message || 'Unknown error'}`, { duration: 6000 });
        }
    };

    const handleRouteToAuthority = () => {
        setShowAuthorityModal(true);
    };

    const confirmRouteToAuthority = async () => {
        if (!selectedAuthority) {
            toast.error('Please select an authority');
            return;
        }

        try {
            // Determine the status based on authority type
            const isRegistrar = selectedAuthority === 'REGISTRAR';
            const newStatus = isRegistrar ? 'pending_registrar' : 'pending_authority';

            // Create approval record (use routed_to_authority for all)
            const { error: approvalError } = await supabase
                .from('approvals')
                .insert([{
                    request_id: id,
                    approver_id: user.id,
                    approver_role: 'admin',
                    action: 'routed_to_authority',
                    comment: `Routed to ${selectedAuthority}`,
                    approved_at: new Date().toISOString(),
                }]);

            if (approvalError) throw approvalError;

            // Update request
            const updateData = {
                current_status: newStatus,
                updated_at: new Date().toISOString(),
            };

            // Only set routed_to_authority for non-registrar authorities
            if (!isRegistrar) {
                updateData.routed_to_authority = selectedAuthority;
            }

            const { error: updateError } = await supabase
                .from('transport_requests')
                .update(updateData)
                .eq('id', id);

            if (updateError) throw updateError;

            toast.success(`Request routed to ${selectedAuthority}`);
            navigate('/admin/pending');
        } catch (err) {
            console.error('Error:', err);
            toast.error(`Failed to route: ${err.message}`);
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
                <div className="mb-6 flex space-x-4 animate-slideDown" style={{ animationDelay: '100ms' }}>
                    <button
                        onClick={handleRouteToAuthority}
                        className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <ArrowUpRight className="w-5 h-5" strokeWidth={2} />
                        <span>Route to Higher Authority</span>
                    </button>
                    <button
                        onClick={handleApproveAndAssign}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <Check className="w-5 h-5" strokeWidth={2} />
                        <span>Approve & Assign Vehicle</span>
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
                                <p className="font-medium text-gray-900">{request.purpose}</p>
                            </div>
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
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slideUp" style={{ animationDelay: '400ms' }}>
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> You can either approve and assign a vehicle directly, or route this request to a higher authority for special approval.
                    </p>
                </div>
            </DashboardLayout>

            {/* Authority Selection Modal */}
            {showAuthorityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideUp">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Select Higher Authority</h3>
                        <p className="text-gray-600 mb-6">Choose which authority should review this request:</p>

                        <div className="space-y-3 mb-6">
                            {AUTHORITIES.map((authority) => (
                                <label key={authority} className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
                                    <input
                                        type="radio"
                                        name="authority"
                                        value={authority}
                                        checked={selectedAuthority === authority}
                                        onChange={(e) => setSelectedAuthority(e.target.value)}
                                        className="w-5 h-5 text-purple-600"
                                    />
                                    <span className="font-medium text-gray-900">{authority.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowAuthorityModal(false);
                                    setSelectedAuthority('');
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRouteToAuthority}
                                disabled={!selectedAuthority}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                Confirm
                            </button>
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
