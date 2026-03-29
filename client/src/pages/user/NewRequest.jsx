import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import HeadSelector from '../../components/forms/HeadSelector';
import FileUpload from '../../components/forms/FileUpload';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../services/requestService';
import { validateTransportRequest } from '../../utils/validators';
import { handleSupabaseError, showSuccess } from '../../utils/errorHandler';
import { FileText, Send, Calendar, MapPin, Users, Info, User, Phone, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ROLES } from '../../utils/constants';

const NewRequest = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [formData, setFormData] = useState({
    department: profile?.department || '',
    designation: profile?.designation || '',
    date_of_visit: '',
    time_of_visit: '',
    place_of_visit: '',
    purpose: '',
    number_of_persons: 1,
    head_id: '',
    custom_head_email: '',
    head_type: 'predefined',
    special_requirements: '',
    guest_name: '',
    guest_contact: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        department: profile.department || prev.department,
        designation: profile.designation || prev.designation,
      }));
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleHeadChange = (headData) => {
    setFormData((prev) => ({ ...prev, ...headData }));
    if (errors.head) setErrors((prev) => ({ ...prev, head: '' }));
  };

  const handleFileUpload = (fileData) => {
    setAttachments((prev) => [...prev, fileData]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

      // Check if user is a privilege role (Head, Admin, Registrar skip head approval)
    const isPrivilegedRole = [ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR].includes(profile?.role);

    const validationErrors = validateTransportRequest(formData);

    // Remove head validation error for privileged roles (they don't need head approval)
    if (isPrivilegedRole && validationErrors.head) {
      delete validationErrors.head;
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        user_id: profile.id,
        department: formData.department,
        designation: formData.designation,
        date_of_visit: formData.date_of_visit,
        time_of_visit: formData.time_of_visit,
        place_of_visit: formData.place_of_visit,
        purpose: formData.purpose + 
          (formData.guest_name || formData.guest_contact ? `\n\n[Guest Details]:\nName: ${formData.guest_name}\nContact: ${formData.guest_contact}` : '') +
          (formData.special_requirements ? `\n\n[Special Requirements]:\n${formData.special_requirements}` : ''),
        number_of_persons: parseInt(formData.number_of_persons),
        head_id: isPrivilegedRole ? null : (formData.head_id || null),
        custom_head_email: isPrivilegedRole ? null : (formData.custom_head_email || null),
        head_type: isPrivilegedRole ? null : formData.head_type,
        current_status: isPrivilegedRole ? 'pending_admin' : 'pending_head',
        is_editable: true,
      };

      const { error } = await createRequest(requestData);
      if (error) {
        handleSupabaseError(error, 'create your request');
        return;
      }

      showSuccess('Transport request submitted successfully!');
      navigate('/my-requests');
    } catch (error) {
      handleSupabaseError(error, 'submit your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">New Transport Request</h1>
            </div>
            <p className="text-gray-600">Fill in the details to submit your transport request</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8" style={{ animation: 'slideUp 0.6s ease-out' }}>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Request Details Section */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <Info className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                  <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                </div>
                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="Your department" error={errors.department} required />
                  <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Your designation" error={errors.designation} required />
                  <Input label="Date of Visit" type="date" name="date_of_visit" value={formData.date_of_visit} onChange={handleChange} error={errors.date_of_visit} min={new Date().toISOString().split('T')[0]} required leftIcon={Calendar} />
                  <Input label="Time of Visit" type="time" name="time_of_visit" value={formData.time_of_visit} onChange={handleChange} error={errors.time_of_visit} required leftIcon={Clock} />
                  <Input label="Place of Visit" name="place_of_visit" value={formData.place_of_visit} onChange={handleChange} placeholder="Destination" error={errors.place_of_visit} required leftIcon={MapPin} />
                  <Input label="Number of Persons" type="number" name="number_of_persons" value={formData.number_of_persons} onChange={handleChange} min="1" error={errors.number_of_persons} required leftIcon={Users} />
                </div>

                {/* Purpose */}
                <div className="mt-6">
                  <Textarea label="Purpose of Visit" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Describe the purpose of your visit" rows={3} error={errors.purpose} required />
                </div>

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
                  <Textarea label="Special Requirements (Optional)" name="special_requirements" value={formData.special_requirements} onChange={handleChange} placeholder="Any specific needs? (e.g. extra luggage, specific seating, accessibility)" rows={2} />
                </div>
              </div>

              {/* Head Selection - Only for regular users */}
              {![ROLES.HEAD, ROLES.ADMIN, ROLES.REGISTRAR].includes(profile?.role) && (
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <Users className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                    <h2 className="text-xl font-semibold text-gray-900">Approval Head</h2>
                  </div>
                  <HeadSelector value={{ head_id: formData.head_id, custom_head_email: formData.custom_head_email }} onChange={handleHeadChange} error={errors.head} />
                </div>
              )}

              {/* File Upload */}
              <div>
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                  <h2 className="text-xl font-semibold text-gray-900">Attachments (Optional)</h2>
                </div>
                <FileUpload onUploadComplete={handleFileUpload} existingFiles={attachments} />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button type="button" variant="secondary" onClick={() => navigate('/user/requests')}>Cancel</Button>
                <Button type="submit" variant="primary" loading={loading} icon={Send}>Submit Request</Button>
              </div>
            </form>
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

export default NewRequest;