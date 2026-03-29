import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { User, Save, Mail, Phone, Building, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { profile, user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        designation: profile.designation || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    setLoading(true);
    try {
      // Update user profile in database
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile();
      }

      toast.success('Profile updated successfully!');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        department: profile.department || '',
        designation: profile.designation || '',
      });
      setHasChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
            </div>
            <p className="text-gray-600">Manage your personal information</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
            {/* Profile Header */}
            <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100 hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
                <p className="text-gray-600 capitalize">{profile?.role || 'User'}</p>
                {hasChanges && (
                  <p className="text-sm text-amber-600 mt-1">● Unsaved changes</p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                leftIcon={User}
                placeholder="Enter your full name"
                required
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                leftIcon={Mail}
                disabled
                helperText="Email cannot be changed"
              />

              <Input
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                leftIcon={Phone}
                placeholder="Enter your phone number"
              />

              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                leftIcon={Building}
                placeholder="Enter your department"
              />

              <Input
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Enter your designation"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={!hasChanges || loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                loading={loading}
                disabled={!hasChanges}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changes to your profile will be reflected across the system. Make sure all information is accurate.
              </p>
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

export default Profile;