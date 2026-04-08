import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  Search, MapPin, Calendar, Clock, CheckCircle2,
  AlertCircle, RefreshCcw, Navigation,
  Users, BadgeCheck, ClipboardList
} from 'lucide-react';
import { linkAttachment } from '../../services/cloudinaryService';
import TripCompletionModal from '../../components/forms/TripCompletionModal';
import toast from 'react-hot-toast';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

const StatusBadge = ({ status }) => {
  const cfg = {
    vehicle_assigned: { label: 'Active Trip', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'animate-pulse bg-blue-500' },
    travel_completed: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    completed:        { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  };
  const c = cfg[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const TripCard = ({ trip, idx, setShowCompletionForm, actionLoading }) => {
  const isActive = trip.current_status === 'vehicle_assigned';
  const isReview = trip.current_status === 'travel_completed';
  const isDone   = trip.current_status === 'completed';
  const requester = trip.user || {};

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${isActive ? 'border-blue-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}
      style={{ animation: `slideUp 0.35s ease-out ${idx * 50}ms both` }}
    >
      {/* Status stripe */}
      <div className={`h-0.5 ${isActive ? 'bg-blue-500' : isReview ? 'bg-amber-400' : 'bg-green-400'}`} />

      <div className="p-5">
        {/* Row 1: request # + status */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Navigation className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : isReview ? 'text-amber-500' : 'text-green-600'}`} strokeWidth={1.8} />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {trip.is_reconstructed ? 'Ref ID' : 'Request #'}
              </p>
              <p className="font-mono font-black text-gray-900 text-sm leading-tight">
                {trip.is_reconstructed ? `REF-${trip.id?.substring(0, 6).toUpperCase()}` : (trip.request_number || '—')}
              </p>
            </div>
          </div>
          <StatusBadge status={trip.current_status} />
        </div>

        {/* Row 2: info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-4 pb-4 border-b border-gray-100">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Destination</p>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm font-bold text-gray-900 truncate">{trip.place_of_visit || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm font-bold text-gray-900">{fmtDate(trip.date_of_visit)}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</p>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm font-bold text-gray-900">{trip.time_of_visit || '—'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passengers</p>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-gray-400 flex-shrink-0" strokeWidth={1.8} />
              <p className="text-sm font-bold text-gray-900">
                {trip.number_of_persons ? `${trip.number_of_persons} person${trip.number_of_persons > 1 ? 's' : ''}` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Row 3: Requester */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-gray-600">
              {requester.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{requester.full_name || 'Unknown requester'}</p>
            <p className="text-xs text-gray-500">
              {requester.department || trip.department || '—'}
              {requester.phone ? ` · ${requester.phone}` : ''}
            </p>
          </div>
        </div>

        {/* Row 4: Action */}
        {isActive && (
          <button
            onClick={() => setShowCompletionForm(trip)}
            disabled={!!actionLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {actionLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BadgeCheck className="w-4 h-4" />
            )}
            Mark Trip as Complete
          </button>
        )}
        {isReview && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-bold text-amber-700">Awaiting Admin Final Review</span>
          </div>
        )}
        {isDone && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-xs font-bold text-green-700">Trip Finalized & Completed</span>
          </div>
        )}
      </div>
    </div>
  );
};

const MyAssignments = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [driverRecord, setDriverRecord] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTripForCompletion, setSelectedTripForCompletion] = useState(null);

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

      if (!data.success) throw new Error(data.message || 'Failed to fetch trips');
      setDriverRecord(data.driver);
      setAssignments(data.trips || []);
    } catch (err) {
      toast.error('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchDriverData(); }, [fetchDriverData]);

  const handleCompleteTrip = async (formData) => {
    const { attachments, ...tripData } = formData;
    const requestId = selectedTripForCompletion.id;
    setActionLoading(requestId);
    try {
      let apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api/v1';
      if (apiBase && !apiBase.includes('/api/v1')) apiBase = `${apiBase.replace(/\/$/, '')}/api/v1`;

      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const response = await fetch(`${apiBase}/driver/complete-trip`, {
        method: 'POST', headers,
        body: JSON.stringify({ request_id: requestId, driver_id: driverRecord?.id, ...tripData })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to update trip status');

      if (attachments?.length > 0) {
        try { await Promise.all(attachments.map(f => linkAttachment(requestId, f))); }
        catch (e) { console.error('Attachment link error:', e); }
      }

      toast.success('Trip completed! Sent for admin review.');
      setSelectedTripForCompletion(null);
      setTimeout(() => fetchDriverData(), 800);
    } catch (err) {
      toast.error('Failed to complete trip: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

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
      (statusFilter === 'done'   && a.current_status === 'completed');
    return matchSearch && matchStatus;
  });

  const counts = {
    active: assignments.filter(a => a.current_status === 'vehicle_assigned').length,
    review: assignments.filter(a => a.current_status === 'travel_completed').length,
    done:   assignments.filter(a => a.current_status === 'completed').length,
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader size="lg" />
        <p className="text-sm text-gray-400 animate-pulse">Fetching your assignments...</p>
      </div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            <p className="text-sm text-gray-500 mt-0.5">All your trips — active, pending review, completed</p>
          </div>
          <button
            onClick={() => { setLoading(true); fetchDriverData(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Unlinked warning */}
        {!driverRecord && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">Account Not Linked</p>
              <p className="text-xs text-amber-700 mt-0.5">Your profile isn't linked to a driver entry. Contact Admin.</p>
            </div>
          </div>
        )}

        {/* ── Search & Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={1.8} />
            <input
              type="text"
              placeholder="Search by destination, request ID or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all',    label: 'All',           count: assignments.length },
              { id: 'active', label: 'Active',        count: counts.active },
              { id: 'review', label: 'Pending',       count: counts.review },
              { id: 'done',   label: 'Completed',     count: counts.done },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === f.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  statusFilter === f.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Trip List ── */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 text-center border border-gray-200 shadow-sm">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1} />
              <p className="text-sm text-gray-400 font-semibold">No assignments found</p>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mt-2 text-xs text-blue-600 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filtered.map((trip, idx) => (
              <TripCard
                key={trip.id}
                trip={trip}
                idx={idx}
                setShowCompletionForm={setSelectedTripForCompletion}
                actionLoading={actionLoading}
              />
            ))
          )}
        </div>

        {/* Completion Modal */}
        {selectedTripForCompletion && (
          <TripCompletionModal
            trip={selectedTripForCompletion}
            onClose={() => setSelectedTripForCompletion(null)}
            onFinish={handleCompleteTrip}
            actionLoading={actionLoading === selectedTripForCompletion.id}
          />
        )}
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default MyAssignments;
