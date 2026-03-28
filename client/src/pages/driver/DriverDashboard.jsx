import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, MapPin, User, Phone, Calendar, Clock,
  CheckCircle2, XCircle, AlertCircle, Package,
  Navigation, Users, Info, Badge, Car, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StatusPill = ({ status }) => {
  const cfg = {
    vehicle_assigned: { label: 'Trip Assigned', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    travel_completed: { label: 'Trip Completed', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    approved_awaiting_vehicle: { label: 'Awaiting Vehicle', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${c.cls}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-gray-500" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-blue-700' : 'text-gray-900'} truncate`}>{value || '—'}</p>
    </div>
  </div>
);

const DriverDashboard = () => {
  const { profile } = useAuth();
  const [driverRecord, setDriverRecord] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [tripHistory, setTripHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchDriverData();
  }, [profile]);

  const fetchDriverData = async () => {
    setLoading(true);
    try {
      // Match driver record via user's email or full name since drivers table may not have user_id FK
      const { data: driverData, error: driverErr } = await supabase
        .from('drivers')
        .select('*, vehicle:vehicles(id, vehicle_number, vehicle_type, model, capacity)')
        .ilike('full_name', profile.full_name || '')
        .maybeSingle();

      if (!driverErr && driverData) {
        setDriverRecord(driverData);

        // Fetch current active trip for this driver
        const { data: activeTrip } = await supabase
          .from('transport_requests')
          .select('*, user:users!transport_requests_user_id_fkey(full_name, email, phone, department, designation)')
          .eq('driver_id', driverData.id)
          .eq('current_status', 'vehicle_assigned')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setCurrentTrip(activeTrip);

        // Fetch trip history (completed trips)
        const { data: history } = await supabase
          .from('transport_requests')
          .select('*, user:users!transport_requests_user_id_fkey(full_name, department)')
          .eq('driver_id', driverData.id)
          .in('current_status', ['travel_completed', 'completed'])
          .order('submitted_at', { ascending: false })
          .limit(10);

        setTripHistory(history || []);
      } else {
        // Try fallback: match by phone or check phone from profile
        console.warn('Driver record not found for profile:', profile?.full_name);
      }
    } catch (err) {
      console.error('Error fetching driver data:', err);
      toast.error('Failed to load trip data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  const stats = [
    { label: 'Total Trips', value: tripHistory.length + (currentTrip ? 1 : 0), icon: Truck, color: 'blue' },
    { label: 'Active Trip', value: currentTrip ? 'Yes' : 'None', icon: Navigation, color: currentTrip ? 'amber' : 'gray' },
    { label: 'Status', value: driverRecord?.is_available ? 'Available' : 'On Duty', icon: CheckCircle2, color: driverRecord?.is_available ? 'green' : 'orange' },
    { label: 'Completed', value: tripHistory.length, icon: Package, color: 'teal' },
  ];

  const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', grad: 'from-blue-500 to-blue-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', grad: 'from-amber-500 to-orange-600' },
    green: { bg: 'bg-green-100', text: 'text-green-700', grad: 'from-green-500 to-emerald-600' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', grad: 'from-gray-400 to-gray-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', grad: 'from-orange-500 to-red-500' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', grad: 'from-teal-500 to-cyan-600' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>

        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Truck className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-500 text-sm">Driver Dashboard — Your trips and assignments</p>
            </div>
          </div>
        </div>

        {/* Driver Record Not Linked Warning */}
        {!driverRecord && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Profile Not Linked to Driver Record</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your driver account has not been linked to a driver record yet. Please contact the admin to link your profile with a driver entry in the system.
              </p>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => {
            const c = colorMap[s.color];
            return (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                style={{ animation: 'slideUp 0.5s ease-out', animationDelay: `${i * 60}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center shadow-md mb-3`}>
                  <s.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Current Active Trip */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 200ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Current Assignment</h2>
                </div>
                {currentTrip && <StatusPill status={currentTrip.current_status} />}
              </div>

              {!currentTrip ? (
                <div className="p-12 text-center">
                  <Truck className="w-16 h-16 mx-auto mb-4 text-gray-200" strokeWidth={1} />
                  <p className="text-gray-500 font-medium">No active trip assigned</p>
                  <p className="text-sm text-gray-400 mt-1">You'll see trip details here once admin assigns you a trip.</p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Trip Info */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-bold text-blue-800">Trip Details</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <InfoRow icon={MapPin} label="Destination" value={currentTrip.place_of_visit} />
                      <InfoRow icon={Calendar} label="Date" value={fmtDate(currentTrip.date_of_visit)} />
                      <InfoRow icon={Clock} label="Time" value={currentTrip.time_of_visit} />
                      <InfoRow icon={Users} label="Persons" value={currentTrip.number_of_persons} />
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-100">
                      <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Purpose</p>
                      <p className="text-sm text-gray-800">{currentTrip.purpose?.split('\n\n[Special Requirements]')[0]}</p>
                    </div>
                  </div>

                  {/* Requester Info */}
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-bold text-purple-800">Requester Details</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      <InfoRow icon={User} label="Name" value={currentTrip.user?.full_name} />
                      <InfoRow icon={Phone} label="Phone" value={currentTrip.user?.phone || 'Not provided'} />
                      <InfoRow icon={Info} label="Department" value={currentTrip.user?.department || currentTrip.department} />
                      <InfoRow icon={Info} label="Designation" value={currentTrip.user?.designation || currentTrip.designation} />
                    </div>
                  </div>

                  {/* Request Number */}
                  <div className="text-center py-2">
                    <p className="text-xs text-gray-400">Request ID</p>
                    <p className="font-mono font-bold text-blue-700 text-lg">{currentTrip.request_number}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trip History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 300ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-gray-900">Trip History</h2>
                </div>
              </div>
              {tripHistory.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No completed trips yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tripHistory.map((trip, i) => (
                    <div key={trip.id} className="p-4 hover:bg-gray-50 transition-colors"
                      style={{ animation: 'slideRight 0.3s ease-out', animationDelay: `${i * 40}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-blue-600 font-bold">{trip.request_number}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{trip.place_of_visit}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{trip.user?.full_name} · {trip.user?.department}</p>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-1">
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

          {/* Right Column: Driver Profile + Vehicle */}
          <div className="space-y-6">
            {/* Driver profile card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 150ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-5 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                </div>
                <h3 className="font-bold text-lg">{profile?.full_name}</h3>
                <p className="text-teal-100 text-sm">Driver</p>
              </div>
              <div className="p-4">
                <InfoRow icon={Phone} label="Phone" value={profile?.phone || driverRecord?.phone || 'Not set'} />
                <InfoRow icon={Info} label="Department" value={profile?.department || 'Driver'} />
                <InfoRow icon={CreditCard} label="License" value={driverRecord?.license_number || 'Not linked'} />
                <InfoRow icon={Calendar} label="License Expiry" value={driverRecord?.license_expiry ? fmtDate(driverRecord.license_expiry) : 'N/A'} />
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${driverRecord?.is_available ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    <span className={`w-2 h-2 rounded-full ${driverRecord?.is_available ? 'bg-green-500' : 'bg-orange-500'}`} />
                    {driverRecord?.is_available ? 'Available' : 'On Duty'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Vehicle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.5s ease-out 250ms', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-gray-900">Assigned Vehicle</h2>
                </div>
              </div>
              <div className="p-4">
                {driverRecord?.vehicle ? (
                  <>
                    <div className="bg-purple-50 rounded-xl p-4 mb-3 text-center">
                      <p className="text-2xl font-black text-purple-700 tracking-wide">{driverRecord.vehicle.vehicle_number}</p>
                      <p className="text-sm text-purple-500 capitalize">{driverRecord.vehicle.vehicle_type?.replace('_', ' ')}</p>
                    </div>
                    <InfoRow icon={Car} label="Model" value={driverRecord.vehicle.model || 'N/A'} />
                    <InfoRow icon={Users} label="Capacity" value={driverRecord.vehicle.capacity ? `${driverRecord.vehicle.capacity} persons` : 'N/A'} />
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No vehicle assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {driverRecord?.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wide">Admin Notes</p>
                <p className="text-sm text-amber-800">{driverRecord.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideRight { from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default DriverDashboard;
