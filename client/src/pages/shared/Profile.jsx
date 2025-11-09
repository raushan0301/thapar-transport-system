import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../services/supabase';

const Profile = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    department: profile?.department || '',
    designation: profile?.designation || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          department: formData.department,
          designation: formData.designation,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

        <Card>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <Avatar name={profile?.full_name} size="xl" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{profile?.full_name}</h2>
              <p className="text-gray-600 capitalize">{profile?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              disabled
            />

            <Input
              label="Phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />

            <Input
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="Enter department"
            />

            <Input
              label="Designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="Enter designation"
            />

            <Button type="submit" variant="primary" loading={loading} icon={Save}>
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;