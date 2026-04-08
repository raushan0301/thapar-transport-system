import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  User, Phone, Mail, CreditCard, Save, Camera,
  Car, Shield, AlertCircle, Building, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadProfileImage } from '../../services/cloudinaryService';

const DriverProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const [driverRecord, setDriverRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    department: '',
    designation: '',
  });

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let drv = null;
      ({ data: drv } = await supabase.from('drivers')
        .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
        .eq('user_id', profile.id).maybeSingle());

      if (!drv) {
        ({ data: drv } = await supabase.from('drivers')
          .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
          .ilike('full_name', profile.full_name || '').maybeSingle());
      }
      if (!drv && profile.phone) {
        ({ data: drv } = await supabase.from('drivers')
          .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
          .eq('phone', profile.phone).maybeSingle());
      }
      setDriverRecord(drv);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      fetchData();
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        designation: profile.designation || '',
      });
    }
  }, [profile, fetchData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('users')
        .update({ full_name: form.full_name, phone: form.phone, department: form.department, designation: form.designation, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated successfully!');
      setHasChanges(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ full_name: profile.full_name || '', phone: profile.phone || '', department: profile.department || '', designation: profile.designation || '' });
    setHasChanges(false);
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setUploadingAvatar(true);
    const t = toast.loading('Uploading profile image...');
    try {
      const { error } = await uploadProfileImage(file);
      if (error) throw new Error(error);
      toast.success('Profile image updated!', { id: t });
      await refreshProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to upload image', { id: t });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const licenseExpired = driverRecord?.license_expiry && new Date(driverRecord.license_expiry) < new Date();
  const licenseExpiringSoon = driverRecord?.license_expiry && !licenseExpired &&
    new Date(driverRecord.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
            </div>
            <p className="text-gray-600">Manage your personal information and driver details</p>
          </div>

          {/* License warnings */}
          {licenseExpired && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-800 text-sm">License Expired</p>
                <p className="text-xs text-red-700">Expired on {fmtDate(driverRecord.license_expiry)}. Contact admin immediately.</p>
              </div>
            </div>
          )}
          {licenseExpiringSoon && !licenseExpired && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-amber-800">
                License expiring soon — {fmtDate(driverRecord.license_expiry)}
              </p>
            </div>
          )}

          {/* ── Main Card ── */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8"
            style={{ animation: 'slideUp 0.5s ease-out 100ms both' }}>

            {/* Avatar + Name header */}
            <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-black text-white">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                )}
                <label className={`absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${uploadingAvatar ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} disabled={uploadingAvatar} />
                  <Camera className="w-4 h-4 text-gray-600" strokeWidth={1.5} />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'Driver'}</h2>
                <p className="text-gray-500 capitalize">{profile?.designation || 'Driver'}</p>
                {hasChanges && (
                  <p className="text-sm text-amber-600 mt-1">● Unsaved changes</p>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} className="space-y-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
                    <input
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
                    <input
                      type="text"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Transport"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Designation</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
                    <input
                      type="text"
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Driver"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email — read only */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={!hasChanges || saving}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Info note */}
            <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changes to your profile will be reflected across the system. Make sure all information is accurate.
              </p>
            </div>
          </div>

          {/* ── Driver Record Card ── */}
          {driverRecord && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mt-5"
              style={{ animation: 'slideUp 0.5s ease-out 200ms both' }}>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <CreditCard className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-gray-900">Driver Record</h3>
                <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Read-only — managed by admin</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">License Number</p>
                  <p className="text-sm font-bold text-gray-900">{driverRecord.license_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">License Expiry</p>
                  <p className={`text-sm font-bold ${licenseExpired ? 'text-red-600' : licenseExpiringSoon ? 'text-amber-600' : 'text-gray-900'}`}>
                    {fmtDate(driverRecord.license_expiry)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-sm font-bold text-gray-900">{driverRecord.experience ? `${driverRecord.experience} years` : '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Assigned Vehicle Card ── */}
          {driverRecord?.vehicle && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mt-5"
              style={{ animation: 'slideUp 0.5s ease-out 300ms both' }}>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <Car className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-gray-900">Assigned Vehicle</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vehicle Number</p>
                  <p className="text-xl font-black tracking-widest text-gray-900">{driverRecord.vehicle.vehicle_number}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{driverRecord.vehicle.vehicle_type?.replace('_', ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Model / Capacity</p>
                  <p className="text-sm font-bold text-gray-900">{driverRecord.vehicle.model || '—'}</p>
                  <p className="text-xs text-gray-500">{driverRecord.vehicle.capacity ? `${driverRecord.vehicle.capacity} persons` : ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Admin notes */}
          {driverRecord?.notes && (
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Note from Admin
              </p>
              <p className="text-sm text-amber-800">{driverRecord.notes}</p>
            </div>
          )}

          {/* Security note */}
          <div className="mt-5 mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-sm text-blue-800">
                Your email address and driver license details are managed by the administrator. To update these, contact the transport department.
              </p>
            </div>
          </div>

        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default DriverProfile;
