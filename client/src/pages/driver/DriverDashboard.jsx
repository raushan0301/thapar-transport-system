import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, MapPin, User, Phone, Calendar,
  AlertCircle, Navigation,
  Users, Car, RefreshCcw,
  ArrowRight, ClipboardList, Route,
  BadgeCheck, Clock3, Gauge, FileCheck2,
  ChevronRight, Milestone, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { linkAttachment } from '../../services/cloudinaryService';
import TripCompletionModal from '../../components/forms/TripCompletionModal';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

const StatusPill = ({ status }) => {
  const cfg = {
    vehicle_assigned: { label: 'Active Trip', cls: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500 animate-pulse' },
    travel_completed: { label: 'Pending Admin Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
    completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500' },
  };
  const c = cfg[status] || { label: status?.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const DriverDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [driverRecord, setDriverRecord] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(null);
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });

  const fetchDriverData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      let apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      if (apiBase && !apiBase.includes('/api/v1')) apiBase = `${apiBase.replace(/\/$/, '')}/api/v1`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers = session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};

      const response = await fetch(`${apiBase}/driver/trips?user_id=${profile.id}`, { headers });
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch dashboard data');

      setDriverRecord(data.driver);
      const allTrips = data.trips || [];
      const active = allTrips.find(t => t.current_status === 'vehicle_assigned');
      const history = allTrips.filter(t => t.current_status === 'travel_completed' || t.current_status === 'completed');

      setCurrentTrip(active);
      setTripHistory(history.slice(0, 5));
      setStats({
        active: allTrips.filter(t => t.current_status === 'vehicle_assigned').length,
        pending: allTrips.filter(t => t.current_status === 'travel_completed').length,
        completed: allTrips.filter(t => t.current_status === 'completed').length,
      });
    } catch (err) {
      toast.error('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

  const handleCompleteTrip = async (formData) => {
    if (!currentTrip) return;
    const { attachments, ...tripData } = formData;
    setActionLoading(true);
    try {
      let apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      if (apiBase && !apiBase.includes('/api/v1')) apiBase = `${apiBase.replace(/\/$/, '')}/api/v1`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch(`${apiBase}/driver/complete-trip`, {
        method: 'POST', headers,
        body: JSON.stringify({ request_id: currentTrip.id, driver_id: driverRecord?.id, ...tripData })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to complete trip');

      if (attachments?.length > 0) {
        try { await Promise.all(attachments.map(f => linkAttachment(currentTrip.id, f))); }
        catch (e) { console.error('Attachment link error:', e); }
      }

      toast.success('Trip completed & sent for admin review.');
      setShowCompletionForm(null);
      setTimeout(() => fetchDriverData(), 800);
    } catch (err) {
      toast.error('Failed to complete trip: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-400 animate-pulse">Loading your dashboard...</p>
      </div>
    </DashboardLayout>
  );

  const requester = currentTrip?.user || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout>

        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good day, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {driverRecord ? `License: ${driverRecord.license_number || 'On file'}` : 'Profile not linked — contact admin'}
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchDriverData(); }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Unlinked warning */}
        {!driverRecord && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Account Not Linked</p>
              <p className="text-xs text-amber-700 mt-0.5">Your profile isn't linked to a driver record. Contact the transport admin.</p>
            </div>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Route, label: 'Active', value: stats.active, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { icon: Clock3, label: 'Pending Review', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { icon: FileCheck2, label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} strokeWidth={1.8} />
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Main Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Current Assignment ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Navigation className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
                  <h2 className="text-base font-bold text-gray-900">Current Assignment</h2>
                </div>
                {currentTrip && <StatusPill status={currentTrip.current_status} />}
              </div>

              {!currentTrip ? (
                <div className="py-14 text-center px-6">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-200" strokeWidth={1} />
                  <p className="text-base font-bold text-gray-500">No Active Trip</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">Admin will assign your next trip here. Check back or refresh.</p>
                  <button
                    onClick={() => navigate('/driver/assignments')}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    View All Assignments <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {/* Trip info rows */}
                  <div className="px-5 py-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm font-bold text-gray-900 truncate">{currentTrip.place_of_visit || '—'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date & Time</p>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm font-bold text-gray-900">{fmtDate(currentTrip.date_of_visit)}</p>
                      </div>
                      <p className="text-xs text-gray-400 ml-5">{currentTrip.time_of_visit || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passengers</p>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <p className="text-sm font-bold text-gray-900">
                          {currentTrip.number_of_persons ? `${currentTrip.number_of_persons} person${currentTrip.number_of_persons > 1 ? 's' : ''}` : '—'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Request #</p>
                      <p className="text-sm font-mono font-bold text-blue-700">{currentTrip.request_number || '—'}</p>
                    </div>
                  </div>

                  {/* Requester info */}
                  <div className="px-5 py-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Requester Details</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-base font-black text-blue-700">
                          {requester.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{requester.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{requester.department || currentTrip.department || '—'} · {requester.phone || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  {currentTrip.purpose && (
                    <div className="px-5 py-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Purpose of Visit</p>
                      <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{currentTrip.purpose}</p>
                    </div>
                  )}

                  {/* Action */}
                  <div className="px-5 py-4 bg-gray-50">
                    <button
                      onClick={() => setShowCompletionForm(currentTrip)}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actionLoading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <BadgeCheck className="w-4 h-4" />}
                      {actionLoading ? 'Submitting...' : 'Mark Trip as Complete'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Trip History ── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-5 h-5 text-gray-500" strokeWidth={1.8} />
                  <h2 className="text-base font-bold text-gray-900">Trip History</h2>
                </div>
                <button
                  onClick={() => navigate('/driver/assignments')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {tripHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <Layers className="w-10 h-10 mx-auto mb-2 text-gray-200" strokeWidth={1} />
                  <p className="text-sm text-gray-400 font-medium">No past trips yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tripHistory.map((trip, i) => (
                    <div key={trip.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Milestone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm font-bold text-gray-900 truncate">{trip.place_of_visit}</p>
                        </div>
                        <p className="text-xs text-gray-400 ml-5">{fmtDate(trip.date_of_visit)} · {trip.request_number || '—'}</p>
                      </div>
                      <StatusPill status={trip.current_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-4">

            {/* Driver Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-6 pb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-white truncate">{profile?.full_name}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{profile?.designation || 'Driver'}</p>
                  </div>
                </div>
              </div>

              <div className="-mt-4 mx-4 mb-4 bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {[
                  { icon: Phone, label: 'Phone', value: profile?.phone || driverRecord?.phone || 'Not set' },
                  { icon: Gauge, label: 'License', value: driverRecord?.license_number || 'Not linked' },
                  { icon: Calendar, label: 'Expiry', value: driverRecord?.license_expiry ? fmtDate(driverRecord.license_expiry) : 'N/A' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5">
                    <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate('/driver/profile')}
                  className="w-full py-2.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" /> Edit Profile
                </button>
              </div>
            </div>

            {/* Assigned Vehicle */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <Car className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
                <h3 className="font-bold text-gray-900 text-sm">Assigned Vehicle</h3>
              </div>
              {driverRecord?.vehicle ? (
                <div className="p-4">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center mb-3">
                    <p className="text-2xl font-black tracking-widest text-gray-900">{driverRecord.vehicle.vehicle_number}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">{driverRecord.vehicle.vehicle_type?.replace('_', ' ')}</p>
                  </div>
                  {[
                    { label: 'Model', value: driverRecord.vehicle.model || '—' },
                    { label: 'Capacity', value: driverRecord.vehicle.capacity ? `${driverRecord.vehicle.capacity} persons` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                      <span className="text-xs font-bold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Car className="w-9 h-9 mx-auto mb-2 text-gray-200" strokeWidth={1} />
                  <p className="text-xs text-gray-400 font-medium">No vehicle assigned</p>
                </div>
              )}
            </div>

            {/* Quick Nav */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">Quick Navigation</p>
              {[
                { icon: ClipboardList, label: 'All Assignments', path: '/driver/assignments' },
                { icon: User, label: 'My Profile', path: '/driver/profile' },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700 group"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" strokeWidth={1.8} />
                    {label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>

            {/* Admin Notes */}
            {driverRecord?.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1.5">Note from Admin</p>
                <p className="text-xs text-amber-800 leading-relaxed">{driverRecord.notes}</p>
              </div>
            )}
          </div>
        </div>

      </DashboardLayout>

      {showCompletionForm && (
        <TripCompletionModal
          trip={showCompletionForm}
          onClose={() => setShowCompletionForm(null)}
          onFinish={handleCompleteTrip}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
