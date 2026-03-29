import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, MapPin, User, Phone, Calendar, Clock,
  CheckCircle2, AlertCircle, Package, Navigation,
  Users, Info, Car, CreditCard, RefreshCw, Building2,
  ArrowRight, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

const StatusPill = ({ status }) => {
  const cfg = {
    vehicle_assigned: { label: 'Active Trip', cls: 'bg-blue-100 text-blue-700', dot: 'animate-pulse bg-blue-500' },
    travel_completed: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    approved_awaiting_vehicle: { label: 'Awaiting Vehicle', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  };
  const c = cfg[status] || { label: status?.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${c.cls}`}>
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
  const [confirming, setConfirming] = useState(false);

  const fetchDriverData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${apiBase}/driver/trips?user_id=${profile.id}`);
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch dashboard data');

      setDriverRecord(data.driver);
      
      const allTrips = data.trips || [];
      const active = allTrips.find(t => t.current_status === 'vehicle_assigned');
      const history = allTrips.filter(t => t.current_status === 'travel_completed' || t.current_status === 'completed');

      setCurrentTrip(active);
      setTripHistory(history.slice(0, 10));

    } catch (err) {
      toast.error('Failed to load dashboard. Falling back to notification sync...');
      
      // Minimal notification fallback
      try {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .not('related_request_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (notifs?.length > 0) {
          const tripMap = new Map();
          notifs.forEach(n => {
            if (!tripMap.has(n.related_request_id)) {
              tripMap.set(n.related_request_id, {
                id: n.related_request_id,
                place_of_visit: n.message?.split('to ')[1]?.split(' on ')[0] || 'Unknown',
                date_of_visit: n.created_at,
                current_status: (n.title?.includes('Completed') || n.message?.includes('completed')) ? 'travel_completed' : 'vehicle_assigned',
                is_reconstructed: true,
                user: { full_name: 'Requester (via alert)' }
              });
            }
          });
          const trips = Array.from(tripMap.values());
          setCurrentTrip(trips.find(t => t.current_status === 'vehicle_assigned'));
          setTripHistory(trips.filter(t => t.current_status !== 'vehicle_assigned'));
        }
      } catch (inner) {
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

  const handleCompleteTrip = async () => {
    if (!currentTrip) return;
    setActionLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${apiBase}/driver/complete-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: currentTrip.id, driver_id: driverRecord?.id })
      });
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to complete trip');

      toast.success('Trip marked as complete! Sent for admin review.');
      await fetchDriverData();
    } catch (err) {
      toast.error('Failed to complete trip: ' + err.message);
    } finally {
      setActionLoading(false);
      setConfirming(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-400 animate-pulse">Loading dashboard...</p>
      </div>
    </DashboardLayout>
  );
  const requester = currentTrip?.user || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <DashboardLayout>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between" style={{ animation: 'slideDown 0.4s ease-out' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200">
              <Truck className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-400 text-sm">Driver Dashboard — Your trips and assignments</p>
            </div>
          </div>
          <button onClick={() => { setLoading(true); fetchDriverData(); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Unlinked warning */}
        {!driverRecord && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">Profile Not Linked to Driver Record</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Contact admin to link your account. Some features may be limited.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main Column: Active Trip + History ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active Trip Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 200ms both' }}>

              {currentTrip && <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />}

              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Navigation className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Current Assignment</h2>
                </div>
                {currentTrip && <StatusPill status={currentTrip.current_status} />}
              </div>

              {!currentTrip ? (
                <div className="p-14 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-10 h-10 text-gray-300" strokeWidth={1} />
                  </div>
                  <p className="text-gray-600 font-bold text-lg">No Active Trip</p>
                  <p className="text-gray-400 text-sm mt-1">You'll see your next assignment once admin assigns a trip.</p>
                  <button
                    onClick={() => navigate('/driver/assignments')}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    View All Assignments <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Trip Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" /> Trip Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: MapPin, label: 'Destination', value: currentTrip.place_of_visit },
                        { icon: Calendar, label: 'Date', value: fmtDate(currentTrip.date_of_visit) },
                        { icon: Clock, label: 'Time', value: currentTrip.time_of_visit || '—' },
                        { icon: Users, label: 'Passengers', value: currentTrip.number_of_persons ? `${currentTrip.number_of_persons} persons` : '—' },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold uppercase text-blue-400 mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-gray-900">{value || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Passenger / Requester
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: User, label: 'Name', value: requester.full_name },
                        { icon: Building2, label: 'Department', value: requester.department || currentTrip.department },
                        { icon: Phone, label: 'Contact', value: requester.phone },
                        { icon: Info, label: 'Designation', value: requester.designation || currentTrip.designation },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-start gap-2">
                          <Icon className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[9px] font-bold uppercase text-purple-400 mb-0.5">{label}</p>
                            <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Request ID</p>
                      <p className="font-mono font-black text-blue-700">{currentTrip.request_number || '—'}</p>
                    </div>
                      <div className="flex gap-3">
                        {confirming ? (
                          <div className="flex items-center gap-2 bg-blue-50/50 p-1.5 rounded-2xl border border-blue-100" style={{ animation: 'slideIn 0.3s ease-out' }}>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">Final Step:</span>
                            <button
                              onClick={handleCompleteTrip}
                              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-green-200"
                            >
                              Yes, Confirm
                            </button>
                            <button
                              onClick={() => setConfirming(false)}
                              className="px-6 py-2 bg-white text-gray-500 rounded-xl text-xs font-bold border border-gray-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirming(true)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading
                              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              : <CheckCircle2 className="w-5 h-5" />}
                            {actionLoading ? 'Saving...' : 'Mark Trip Complete'}
                          </button>
                        )}
                      </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trip History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 300ms both' }}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                    <History className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Trip History</h2>
                </div>
                {tripHistory.length > 0 && (
                  <button onClick={() => navigate('/driver/assignments')}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
                    See All <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {tripHistory.length === 0 ? (
                <div className="p-10 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" strokeWidth={1} />
                  <p className="text-gray-400 text-sm font-medium">No completed trips yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tripHistory.map((trip, i) => (
                    <div key={trip.id} className="p-4 hover:bg-gray-50 transition-colors"
                      style={{ animation: `slideRight 0.3s ease-out ${i * 40}ms both` }}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-blue-600 font-bold">{trip.request_number || '—'}</p>
                          <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{trip.place_of_visit}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {trip.user?.full_name || '—'} · {trip.user?.department || '—'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusPill status={trip.current_status} />
                          <p className="text-xs text-gray-400">{fmtDate(trip.date_of_visit)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Profile + Vehicle ── */}
          <div className="space-y-5">
            {/* Driver Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 150ms both' }}>
              <div className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/25 ring-4 ring-white/30 flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <span className="text-3xl font-black text-white">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <h3 className="font-black text-lg text-white">{profile?.full_name}</h3>
                <p className="text-teal-100 text-sm mt-0.5">{profile?.designation || 'Driver'}</p>
              </div>

              <div className="p-4 space-y-2">
                {[
                  { icon: Phone, label: profile?.phone || driverRecord?.phone || 'No phone' },
                  { icon: CreditCard, label: driverRecord?.license_number || 'License: Not linked' },
                  { icon: Calendar, label: driverRecord?.license_expiry ? `Expires: ${fmtDate(driverRecord.license_expiry)}` : 'Expiry: N/A' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm py-1.5 border-b border-gray-50 last:border-0">
                    <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700 truncate">{label}</span>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/driver/profile')}
                  className="w-full mt-3 py-2 text-sm font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all border border-teal-100"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Assigned Vehicle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 250ms both' }}>
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Car className="w-4 h-4 text-purple-600" />
                </div>
                <h2 className="font-bold text-gray-900">Assigned Vehicle</h2>
              </div>
              <div className="p-4">
                {driverRecord?.vehicle ? (
                  <>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4 text-center mb-3">
                      <p className="text-3xl font-black tracking-widest text-purple-700">{driverRecord.vehicle.vehicle_number}</p>
                      <p className="text-sm text-purple-500 capitalize mt-1">{driverRecord.vehicle.vehicle_type?.replace('_', ' ')}</p>
                    </div>
                    {[
                      { label: 'Model', value: driverRecord.vehicle.model || '—' },
                      { label: 'Capacity', value: driverRecord.vehicle.capacity ? `${driverRecord.vehicle.capacity} persons` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase">{label}</span>
                        <span className="text-sm font-bold text-gray-900">{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-gray-200" strokeWidth={1} />
                    <p className="text-sm text-gray-400">No vehicle assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              style={{ animation: 'slideUp 0.5s ease-out 300ms both' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/driver/assignments')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm font-semibold text-blue-700 transition-all border border-blue-100"
                >
                  <span className="flex items-center gap-2"><Package className="w-4 h-4" /> View All Assignments</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/driver/profile')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 hover:bg-teal-100 rounded-xl text-sm font-semibold text-teal-700 transition-all border border-teal-100"
                >
                  <span className="flex items-center gap-2"><User className="w-4 h-4" /> Update Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            {driverRecord?.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1.5">Admin Notes</p>
                <p className="text-sm text-amber-800 leading-relaxed">{driverRecord.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default DriverDashboard;
