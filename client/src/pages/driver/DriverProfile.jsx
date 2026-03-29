/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  User, Phone, Mail, CreditCard, Save, Edit2, X, Building2, FileText,
  Car, Shield, AlertCircle, } from 'lucide-react';
import toast from 'react-hot-toast';

const FieldGroup = ({ label, value, editing, onChange, type = 'text', placeholder, icon: Icon, readOnly = false }) => (
  <div>
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={!editing || readOnly}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl text-sm font-medium transition-all ${
          readOnly
            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
            : editing
            ? 'border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none'
            : 'bg-gray-50 border-gray-100 text-gray-700 cursor-default'
        }`}
      />
      {readOnly && (
        <Shield className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
      )}
    </div>
    {readOnly && <p className="text-[10px] text-gray-400 mt-1">This field is managed by admin</p>}
  </div>
);

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, label, value, color = 'gray' }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-500',
    teal: 'from-teal-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-600',
    gray: 'from-gray-400 to-gray-500',
  };
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-md`}>
        <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-lg font-black text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
      </div>
    </div>
  );
};

const DriverProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const [driverRecord, setDriverRecord] = useState(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
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
      // Robust driver lookup
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
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({ full_name: profile.full_name || '', phone: profile.phone || '', department: profile.department || '', designation: profile.designation || '' });
  };

  const isDirty = form.full_name !== (profile?.full_name || '') ||
    form.phone !== (profile?.phone || '') ||
    form.department !== (profile?.department || '') ||
    form.designation !== (profile?.designation || '');

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  const licenseExpired = driverRecord?.license_expiry && new Date(driverRecord.license_expiry) < new Date();
  const licenseExpiringSoon = driverRecord?.license_expiry && !licenseExpired &&
    new Date(driverRecord.license_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <DashboardLayout>

        {/* Header */}
        <div className="mb-8" style={{ animation: 'slideDown 0.4s ease-out' }}>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-500 text-sm">Manage your personal information and driver details</p>
        </div>

        {/* License warnings */}
        {licenseExpired && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-800 text-sm">License Expired</p>
              <p className="text-xs text-red-700">Your driving license expired on {new Date(driverRecord.license_expiry).toLocaleDateString('en-IN')}. Contact admin immediately.</p>
            </div>
          </div>
        )}
        {licenseExpiringSoon && !licenseExpired && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              License expiring soon — {new Date(driverRecord.license_expiry).toLocaleDateString('en-IN')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left sidebar */}
          <div className="space-y-5">
            {/* Avatar Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out both' }}>
              <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-white/25 backdrop-blur flex items-center justify-center mx-auto mb-4 shadow-xl ring-4 ring-white/30">
                  <span className="text-5xl font-black text-white">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <h2 className="text-xl font-black text-white">{profile?.full_name}</h2>
                <p className="text-teal-100 text-sm font-medium mt-1">{profile?.designation || 'Driver'}</p>
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white">🚗 Driver</span>
                </div>
              </div>

              <div className="p-5 space-y-2.5">
                {[
                  { icon: Mail, text: profile?.email },
                  { icon: Phone, text: profile?.phone || 'No phone set' },
                  { icon: Building2, text: profile?.department || 'Transport Division' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm">
                    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Record card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 100ms both' }}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-900">Driver Record</h3>
              </div>
              <div className="p-5">
                {driverRecord ? (
                  <div className="space-y-3">
                    {[
                      { label: 'License No.', value: driverRecord.license_number || '—' },
                      {
                        label: 'License Expiry',
                        value: driverRecord.license_expiry
                          ? new Date(driverRecord.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'
                      },
                      { label: 'Experience', value: driverRecord.experience ? `${driverRecord.experience} years` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                        <span className="text-sm font-bold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-300" />
                    <p className="text-sm font-semibold text-amber-700">Not Linked</p>
                    <p className="text-xs text-gray-400 mt-1">Ask admin to link your driver record</p>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Vehicle */}
            {driverRecord?.vehicle && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 200ms both' }}>
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Assigned Vehicle</h3>
                </div>
                <div className="p-5">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-center mb-3">
                    <p className="text-3xl font-black tracking-widest text-blue-700">{driverRecord.vehicle.vehicle_number}</p>
                    <p className="text-sm text-blue-500 capitalize mt-1">{driverRecord.vehicle.vehicle_type?.replace('_', ' ')}</p>
                  </div>
                  {[
                    { label: 'Model', value: driverRecord.vehicle.model },
                    { label: 'Capacity', value: driverRecord.vehicle.capacity ? `${driverRecord.vehicle.capacity} persons` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-semibold text-gray-400 uppercase">{label}</span>
                      <span className="text-sm font-bold text-gray-900">{value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Edit Form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ animation: 'slideUp 0.5s ease-out 50ms both' }}>
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Update your contact details and profile info</p>
                </div>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FieldGroup
                    label="Full Name"
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    editing={editing}
                    icon={User}
                    placeholder="Your full name"
                  />
                  <FieldGroup
                    label="Phone Number"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    editing={editing}
                    type="tel"
                    icon={Phone}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  <FieldGroup
                    label="Department"
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    editing={editing}
                    icon={Building2}
                    placeholder="e.g. Transport"
                  />
                  <FieldGroup
                    label="Designation"
                    value={form.designation}
                    onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                    editing={editing}
                    icon={FileText}
                    placeholder="e.g. Senior Driver"
                  />
                </div>

                <div className="mt-5">
                  <FieldGroup
                    label="Email Address"
                    value={profile?.email || ''}
                    editing={false}
                    readOnly
                    icon={Mail}
                    type="email"
                  />
                </div>

                {editing && (
                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                    {isDirty ? (
                      <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Unsaved changes
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">No changes made</p>
                    )}
                    <button
                      type="submit"
                      disabled={saving || !isDirty}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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

            {/* Notes from admin */}
            {driverRecord?.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Notes from Admin
                </p>
                <p className="text-sm text-amber-800">{driverRecord.notes}</p>
              </div>
            )}

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-800 text-sm">Profile Security</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your email and driver license details are managed by the administrator. To make changes to these fields, please contact the admin through the transport department.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default DriverProfile;
