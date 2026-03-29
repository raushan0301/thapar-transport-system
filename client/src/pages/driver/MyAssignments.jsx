/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Truck, Search, MapPin, Calendar, Clock, CheckCircle2,
  AlertCircle, User, Building2, RefreshCw, Navigation,
  Users, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

const StatusBadge = ({ status }) => {
  const cfg = {
    vehicle_assigned: { label: 'Active Trip', cls: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'animate-pulse bg-blue-500' },
    travel_completed: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    completed: { label: 'Completed', cls: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
  };
  const c = cfg[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const Tripd = ({ trip, onComplete, actionLoading, idx, confirming, setConfirming }) => {
  const [expanded, setExpanded] = useState(false);
  const isActive = trip.current_status === 'vehicle_assigned';
  const isReview = trip.current_status === 'travel_completed';
  const isDone = trip.current_status === 'completed';

  const requester = trip.user || {};
  const hasRequester = requester.full_name && requester.full_name !== '—';

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300 ${
        isActive ? 'border-blue-200 shadow-md shadow-blue-50' : 'border-gray-100 shadow-sm'
      }`}
      style={{ animation: `slideUp 0.4s ease-out ${idx * 60}ms both` }}
    >
      {isActive && <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400" />}
      {isReview && <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />}
      {isDone && <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-400" />}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isActive ? 'bg-blue-100' : isReview ? 'bg-amber-100' : 'bg-green-100'
            }`}>
              <Navigation className={`w-5 h-5 ${isActive ? 'text-blue-600' : isReview ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {trip.is_reconstructed ? 'Ref ID' : 'Request #'}
              </p>
              <p className="font-mono font-black text-gray-900 text-base leading-tight">
                {trip.is_reconstructed ? `REF-${trip.id?.substring(0, 6).toUpperCase()}` : (trip.request_number || '—')}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <StatusBadge status={trip.current_status} />
            {trip.is_reconstructed && (
              <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-bold tracking-wide">
                FROM ALERT
              </span>
            )}
          </div>
        </div>

        {/* Destination + Date/Time + Persons row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl p-3 border border-blue-100">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500">Destination</p>
              <p className="text-sm font-bold text-gray-900 truncate">{trip.place_of_visit || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-purple-50 rounded-xl p-3 border border-purple-100">
            <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-purple-500">Date</p>
              <p className="text-sm font-bold text-gray-900">{fmtDate(trip.date_of_visit)}</p>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {trip.time_of_visit || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-orange-50 rounded-xl p-3 border border-orange-100">
            <Users className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-orange-500">Passengers</p>
              <p className="text-sm font-bold text-gray-900">
                {trip.number_of_persons ? `${trip.number_of_persons} person${trip.number_of_persons > 1 ? 's' : ''}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Requester Section — Always visible */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-3 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            Passenger / Requester Details
          </p>
          {hasRequester ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Name</p>
                <p className="text-sm font-bold text-gray-900">{requester.full_name}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Department</p>
                <p className="text-sm font-semibold text-gray-800">{requester.department || trip.department || '—'}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Contact</p>
                <p className="text-sm font-semibold text-gray-800">{requester.phone || '—'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Info className="w-4 h-4" />
              <p className="text-xs italic">Requester info not available — contact admin if needed</p>
            </div>
          )}
        </div>

        {/* Expandable trip details */}
        {!trip.is_reconstructed && (trip.purpose || trip.special_requirements || trip.place_to_return) && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-700 py-2 border-t border-gray-100 transition-colors"
            >
              <span>{expanded ? 'Hide' : 'Show'} Full Trip Details</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="pt-3 space-y-3">
                {trip.place_to_return && (
                  <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                    <p className="text-[9px] font-bold uppercase text-teal-600 mb-1">Return Destination</p>
                    <p className="text-sm font-semibold text-teal-800">{trip.place_to_return}</p>
                  </div>
                )}
                {trip.special_requirements && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-[9px] font-bold uppercase text-amber-600 mb-1">Special Requirements</p>
                    <p className="text-sm text-amber-800">{trip.special_requirements}</p>
                  </div>
                )}
                {requester.designation && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Designation: <strong>{requester.designation}</strong></span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

            <div className="flex flex-wrap gap-2">
              {isActive && (
                <div className="flex items-center gap-2">
                  {confirming === trip.id ? (
                    <div className="flex items-center gap-2" style={{ animation: 'slideIn 0.3s ease-out' }}>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight mr-1">Sure?</span>
                      <button
                        onClick={() => {
                          setConfirming(null);
                          onComplete(trip.id);
                        }}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirming(null)}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirming(trip.id)}
                      disabled={!!actionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-xs font-bold shadow-[0_4px_12px_rgba(37,99,235,0.2)] flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {actionLoading === trip.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {actionLoading === trip.id ? 'Saving...' : 'Mark Trip Complete'}
                    </button>
                  )}
                </div>
              )}

              {isReview && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-700">Awaiting Admin Final Review</span>
                </div>
              )}

              {isDone && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[11px] font-bold text-green-700">Trip Finalized ✓</span>
                </div>
              )}
            </div>
      </div>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const MyAssignments = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [driverRecord, setDriverRecord] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* ─── Fetch ─────────────────────────────────────────────────────────────── */
  /* ─── Fetch ─────────────────────────────────────────────────────────────── */
  const fetchDriverData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${apiBase}/driver/trips?user_id=${profile.id}`);
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to fetch trips');

      setDriverRecord(data.driver);
      
      // The API already sorts and joins requester details
      setAssignments(data.trips || []);
    } catch (err) {
      toast.error('Failed to load assignments. Falling back to notification sync...');
      
      // Keep a minimal notification fallback just in case the server is down
      try {
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', profile.id)
          .not('related_request_id', 'is', null)
          .order('created_at', { ascending: false });
        
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
          setAssignments(Array.from(tripMap.values()));
        }
      } catch (inner) {
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

  /* ─── Complete Trip ──────────────────────────────────────────────────────── */
  const handleCompleteTrip = async (requestId) => {
    if (!requestId) {
      toast.error('Invalid request ID');
      return;
    }
    setActionLoading(requestId); // Use ID instead of boolean to track specific trip loading
    try {

      const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      const response = await fetch(`${apiBase}/driver/complete-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, driver_id: driverRecord?.id })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update trip status');

      toast.success('Trip completed! Sent for admin review.');
      await fetchDriverData(); 
    } catch (err) {
      toast.error('Failed to complete trip: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Filter ─────────────────────────────────────────────────────────────── */
  const filtered = assignments.filter(a => {
    const s = searchTerm.toLowerCase();
    const matchSearch = !s
      || a.place_of_visit?.toLowerCase().includes(s)
      || a.request_number?.toLowerCase().includes(s)
      || a.user?.full_name?.toLowerCase().includes(s);
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && a.current_status === 'vehicle_assigned') ||
      (statusFilter === 'review' && a.current_status === 'travel_completed') ||
      (statusFilter === 'done' && a.current_status === 'completed');
    return matchSearch && matchStatus;
  });

  const counts = {
    all: assignments.length,
    active: assignments.filter(a => a.current_status === 'vehicle_assigned').length,
    review: assignments.filter(a => a.current_status === 'travel_completed').length,
    done: assignments.filter(a => a.current_status === 'completed').length,
  };

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-400 animate-pulse">Fetching your assignments...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <DashboardLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-8" style={{ animation: 'slideDown 0.4s ease-out' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Truck className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
              <p className="text-sm text-gray-400">All your trips in one place</p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchDriverData(); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stat Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { id: 'all', label: 'All Trips', count: counts.all, color: 'blue' },
            { id: 'active', label: 'Active', count: counts.active, color: 'cyan' },
            { id: 'review', label: 'Pending Review', count: counts.review, color: 'amber' },
            { id: 'done', label: 'Completed', count: counts.done, color: 'green' },
          ].map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`bg-white rounded-xl p-4 text-left border shadow-sm hover:shadow-md transition-all ${
                statusFilter === s.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
              }`}
              style={{ animation: `slideUp 0.4s ease-out ${i * 50}ms both` }}
            >
              <p className="text-2xl font-black text-gray-900">{s.count}</p>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Unlinked account warning */}
        {!driverRecord && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Account Not Linked</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Your profile isn't linked to a driver record. Trips are shown from notifications. Ask admin to link your account for full data.
              </p>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by destination, requester or request ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: '🔵 Active' },
              { id: 'review', label: '🟡 Pending' },
              { id: 'done', label: '🟢 Done' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  statusFilter === f.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trip ds */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-200" strokeWidth={1} />
              <p className="text-gray-600 font-bold text-lg">No trips found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different filter or refresh to pull latest data.</p>
              <button
                onClick={() => { setLoading(true); fetchDriverData(); }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Refresh Now
              </button>
            </div>
          ) : (
            filtered.map((trip, idx) => (
              <Tripd
                key={trip.id}
                trip={trip}
                idx={idx}
                onComplete={handleCompleteTrip}
                actionLoading={actionLoading}
                confirming={confirming}
                setConfirming={setConfirming}
              />
            ))
          )}
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default MyAssignments;
