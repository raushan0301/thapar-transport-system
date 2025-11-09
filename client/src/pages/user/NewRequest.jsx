import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Button from '../../components/common/Button';
import HeadSelector from '../../components/forms/HeadSelector';
import FileUpload from '../../components/forms/FileUpload';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../services/requestService';
import { validateTransportRequest } from '../../utils/validators';
import { FileText, Send } from 'lucide-react';
import toast from 'react-hot-toast';

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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleHeadChange = (headData) => {
    setFormData((prev) => ({ ...prev, ...headData }));
    if (errors.head) {
      setErrors((prev) => ({ ...prev, head: '' }));
    }
  };

  const handleFileUpload = (fileData) => {
    setAttachments((prev) => [...prev, fileData]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validationErrors = validateTransportRequest(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Prepare request data
      const requestData = {
        user_id: profile.id,
        department: formData.department,
        designation: formData.designation,
        date_of_visit: formData.date_of_visit,
        time_of_visit: formData.time_of_visit,
        place_of_visit: formData.place_of_visit,
        purpose: formData.purpose,
        number_of_persons: parseInt(formData.number_of_persons),
        head_id: formData.head_id || null,
        custom_head_email: formData.custom_head_email || null,
        head_type: formData.head_type,
        current_status: 'pending_head',
        is_editable: true,
      };

      // Create request
      const { data, error } = await createRequest(requestData);

      if (error) {
        toast.error('Failed to create request');
        return;
      }

      // TODO: Upload attachments if any
      // For now, we'll skip this and implement later

      toast.success('Transport request submitted successfully!');
      navigate('/my-requests');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">New Transport Request</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Section A - Request Details */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Request Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Enter department"
                error={errors.department}
                required
              />

              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Enter designation"
                error={errors.designation}
                required
              />

              <Input
                label="Date of Visit"
                type="date"
                name="date_of_visit"
                value={formData.date_of_visit}
                onChange={handleChange}
                error={errors.date_of_visit}
                min={new Date().toISOString().split('T')[0]}
                required
              />

              <Input
                label="Time of Visit"
                type="time"
                name="time_of_visit"
                value={formData.time_of_visit}
                onChange={handleChange}
                error={errors.time_of_visit}
                required
              />

              <Input
                label="Place of Visit"
                name="place_of_visit"
                value={formData.place_of_visit}
                onChange={handleChange}
                placeholder="Enter place/location"
                error={errors.place_of_visit}
                required
              />

              <Input
                label="Number of Persons"
                type="number"
                name="number_of_persons"
                value={formData.number_of_persons}
                onChange={handleChange}
                min="1"
                error={errors.number_of_persons}
                required
              />
            </div>

            <Textarea
              label="Purpose of Visit"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter purpose of visit"
              rows={4}
              error={errors.purpose}
              required
            />
          </div>

          {/* Head Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Approval Head
            </h2>
            <HeadSelector
              value={{ head_id: formData.head_id, custom_head_email: formData.custom_head_email }}
              onChange={handleHeadChange}
              error={errors.head}
            />
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b">
              Attachments
            </h2>
            <FileUpload onUploadComplete={handleFileUpload} existingFiles={attachments} />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={Send}
            >
              Submit Request
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/my-requests')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
};

export default NewRequest;