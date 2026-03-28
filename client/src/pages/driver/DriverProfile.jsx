import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, MapPin, CreditCard, Calendar, Save, Edit2, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DriverProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const [driverRecord, setDriverRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', department: '', designation: '' });

  useEffect(() => {
    if (profile) {
      fetchDriverData();
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        designation: profile.designation || '',
      });
    }
  }, [profile]);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('drivers')
        .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model)')
        .ilike('full_name', profile.full_name || '')
        .maybeSingle();
      setDriverRecord(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          department: form.department,
          designation: form.designation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>

        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and view your driver details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Avatar Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-4xl font-black text-white">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{profile?.full_name}</h2>
                <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/20 rounded-full text-teal-50 text-sm font-medium">
                  🚗 Driver
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 truncate">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profile?.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{profile?.department || 'Driver'}</span>
                </div>
              </div>
            </div>

            {/* Driver Record Info */}
            {driverRecord && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                style={{ animation: 'slideUp 0.5s ease-out 100ms', opacity: 0, animationFillMode: 'forwards' }}>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  Driver Record
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: 'License No.', value: driverRecord.license_number },
                    { label: 'License Expiry', value: driverRecord.license_expiry ? new Date(driverRecord.license_expiry).toLocaleDateString('en-IN') : 'N/A' },
                    { label: 'Assigned Vehicle', value: driverRecord.vehicle?.vehicle_number || 'None' },
                    { label: 'Status', value: driverRecord.is_available ? '✅ Available' : '🚗 On Duty' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Editable Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 50ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                ) : (
                  <button onClick={() => { setEditing(false); setForm({ full_name: profile.full_name || '', phone: profile.phone || '', department: profile.department || '', designation: profile.designation || '' }); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { key: 'full_name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Your full name' },
                    { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', placeholder: '+91 XXXXX XXXXX' },
                    { key: 'department', label: 'Department', icon: MapPin, type: 'text', placeholder: 'e.g. Transport' },
                    { key: 'designation', label: 'Designation', icon: User, type: 'text', placeholder: 'e.g. Senior Driver' },
                  ].map(({ key, label, icon: Icon, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={type}
                          value={form[key]}
                          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                          disabled={!editing}
                          placeholder={placeholder}
                          className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm transition-all ${editing
                            ? 'border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none'
                            : 'border-gray-100 bg-gray-50 text-gray-600 cursor-default'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Email (read-only) */}
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-100 bg-gray-50 text-gray-500 rounded-xl text-sm cursor-default"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin if needed.</p>
                </div>

                {editing && (
                  <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default DriverProfile;
