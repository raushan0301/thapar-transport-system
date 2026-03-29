import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Save, FileText, MapPin, Calendar, Users, Clock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { ROLES } from '../../utils/constants';

const EditRequest = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [searchParams] = useSearchParams();
    const isResubmit = searchParams.get('resubmit') === 'true';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [, setRequest] = useState(null);
    const [formData, setFormData] = useState({
        purpose: '',
        place_of_visit: '',
        date_of_visit: '',
        time_of_visit: '',
        number_of_persons: '',
        special_requirements: '',
        guest_name: '',
        guest_contact: '',
    });

    useEffect(() => {
        if (id && user?.id) fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);

    const fetchRequest = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transport_requests')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id) // Ensure user owns this request
                .single();

            if (error) throw error;

            // Check if request can be edited
            // Allow editing if: pending_head, draft, OR rejected (in resubmit mode)
            const canEdit = data.current_status === 'pending_head' ||
                data.current_status === 'draft' ||
                (data.current_status === 'rejected' && isResubmit);

            if (!canEdit) {
                toast.error('This request cannot be edited');
                navigate(`/request/${id}`);
                return;
            }
            
            setRequest(data);

            const cleanPurpose = data.purpose?.split('\n\n[Guest Details]:')[0].split('\n\n[Special Requirements]:')[0] || '';
            const guestPart = data.purpose?.split('\n\n[Guest Details]:\n')[1] || '';
            const guestName = guestPart.split('\nContact: ')[0].replace('Name: ', '') || '';
            const guestContact = guestPart.split('\nContact: ')[1]?.split('\n\n[Special Requirements]:')[0] || '';
            const specialReqs = data.purpose?.split('\n\n[Special Requirements]:\n')[1] || '';

            setFormData({
                purpose: cleanPurpose,
                place_of_visit: data.place_of_visit || '',
                date_of_visit: data.date_of_visit || '',
                time_of_visit: data.time_of_visit || '',
                number_of_persons: data.number_of_persons?.toString() || '',
                special_requirements: specialReqs,
                guest_name: guestName,
                guest_contact: guestContact,
            });
        } catch (err) {
            toast.error('Failed to load request');
            navigate('/my-requests');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.purpose || !formData.place_of_visit || !formData.date_of_visit) {
            toast.error('Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {

            // Prepare update data
            const updateData = {
                purpose: formData.purpose + 
                    (formData.guest_name || formData.guest_contact ? `\n\n[Guest Details]:\nName: ${formData.guest_name}\nContact: ${formData.guest_contact}` : '') +
                    (formData.special_requirements ? `\n\n[Special Requirements]:\n${formData.special_requirements}` : ''),
                place_of_visit: formData.place_of_visit,
                date_of_visit: formData.date_of_visit,
                time_of_visit: formData.time_of_visit || null,
                number_of_persons: formData.number_of_persons ? parseInt(formData.number_of_persons) : null,
                updated_at: new Date().toISOString(),
            };

            // If resubmitting a rejected request, reset status based on role
            if (isResubmit) {
                const isPrivileged = [ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR].includes(profile?.role);
                updateData.current_status = isPrivileged ? 'pending_admin' : 'pending_head';
                updateData.submitted_at = new Date().toISOString(); // Refresh submission date
            }

            const { data, error } = await supabase
                .from('transport_requests')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            
            // Send notifications if resubmitting
            if (isResubmit) {
                const { createNotification, notifyAdmins } = await import('../../services/requestService');
                
                if (updateData.current_status === 'pending_admin') {
                    await notifyAdmins({
                        title: 'Rejected Request Resubmitted',
                        message: `Transport request (${data.request_number}) has been resubmitted and is awaiting your approval.`,
                        type: 'new_request',
                        related_request_id: id
                    });
                } else if (updateData.current_status === 'pending_head' && data.head_id) {
                    await createNotification({
                        user_id: data.head_id,
                        title: 'Request Resubmitted',
                        message: `A rejected transport request (${data.request_number}) has been resubmitted for your approval.`,
                        type: 'new_request',
                        related_request_id: id
                    });
                }
            }

            if (error) {
                throw error;
            }

            if (isResubmit) {
                toast.success('Request resubmitted successfully! It will now go through the approval process again.');
            } else {
                toast.success('Request updated successfully!');
            }
            navigate(`/request/${id}`);
        } catch (err) {
            toast.error(`Failed to update request: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <DashboardLayout>
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 animate-slideDown">
                        <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(`/request/${id}`)} className="mb-4">Back to Request</Button>
                        <div className="flex items-center space-x-3 mb-2">
                            <FileText className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                            <h1 className="text-4xl font-bold text-gray-900">
                                {isResubmit ? 'Resubmit Request' : 'Edit Request'}
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            {isResubmit
                                ? 'Modify your rejected request and resubmit for approval'
                                : 'Update your transport request details'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
                            <div className="space-y-6">
                                {/* Purpose */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="w-4 h-4" strokeWidth={1.5} />
                                            <span>Purpose of Visit *</span>
                                        </div>
                                    </label>
                                    <textarea
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleChange}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe the purpose of your visit"
                                        required
                                    />
                                </div>

                                {/* Place of Visit */}
                                <Input
                                    label="Place of Visit"
                                    name="place_of_visit"
                                    value={formData.place_of_visit}
                                    onChange={handleChange}
                                    placeholder="Enter place of visit"
                                    leftIcon={MapPin}
                                    required
                                />

                                {/* Date and Time */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Date of Visit"
                                        type="date"
                                        name="date_of_visit"
                                        value={formData.date_of_visit}
                                        onChange={handleChange}
                                        leftIcon={Calendar}
                                        required
                                    />
                                    <Input
                                        label="Time of Visit"
                                        type="time"
                                        name="time_of_visit"
                                        value={formData.time_of_visit}
                                        onChange={handleChange}
                                        leftIcon={Clock}
                                    />
                                </div>

                                {/* Number of Persons */}
                                <Input
                                    label="Number of Persons"
                                    type="number"
                                    name="number_of_persons"
                                    value={formData.number_of_persons}
                                    onChange={handleChange}
                                    placeholder="Enter number of persons"
                                    leftIcon={Users}
                                    min="1"
                                />

                                {/* Guest Details Section */}
                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-600" />
                                        GUEST DETAILS (OPTIONAL)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Input label="Guest Name" name="guest_name" value={formData.guest_name} onChange={handleChange} placeholder="e.g., Prof. John Doe" leftIcon={User} />
                                        <Input label="Guest Contact No." name="guest_contact" value={formData.guest_contact} onChange={handleChange} placeholder="e.g., +91 98765 43210" leftIcon={Phone} />
                                    </div>
                                </div>

                                {/* Additional Needs */}
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements (Optional)</label>
                                    <textarea
                                        name="special_requirements"
                                        value={formData.special_requirements}
                                        onChange={handleChange}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Any specific needs? (e.g. extra luggage, specific seating, accessibility)"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => navigate(`/request/${id}`)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    icon={Save}
                                    loading={saving}
                                    className={isResubmit ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    {saving ? (isResubmit ? 'Resubmitting...' : 'Saving...') : (isResubmit ? 'Resubmit for Approval' : 'Save Changes')}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Info Box */}
                    <div className={`${isResubmit ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`} style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
                        <p className={`text-sm ${isResubmit ? 'text-green-800' : 'text-blue-800'}`}>
                            <strong>Note:</strong> {isResubmit
                                ? 'This request was previously rejected. You can modify the details and resubmit it. Once resubmitted, it will go through the approval process again starting from your head.'
                                : 'You can only edit requests that haven\'t been approved yet. Once a request is approved by your head, it cannot be edited.'}
                        </p>
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

export default EditRequest;
