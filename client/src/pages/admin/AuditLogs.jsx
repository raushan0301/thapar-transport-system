import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import {
  FileText, Search, Filter, Download, RefreshCcw,
  CheckCircle2, XCircle, Clock, Truck,
  ChevronDown, ChevronRight, Activity, MapPin,
  List, LayoutList, GitCommitHorizontal, Info, Timer, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── IST formatting ───────────────────────────────────────────────────────────
const fmtDT = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true, timeZone: 'Asia/Kolkata'
  }) + ' IST';
};

const timeSince = (from, to) => {
  if (!from || !to) return null;
  const ms = new Date(to) - new Date(from);
  if (ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
};

// ── Event config ─────────────────────────────────────────────────────────────
const EVENT_CFG = {
  submitted: { label: 'Submitted', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: FileText },
  head_approved: { label: 'Head Approved', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', icon: CheckCircle2 },
  head_rejected: { label: 'Head Rejected', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: XCircle },
  registrar_approved: { label: 'Registrar Approved', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', icon: CheckCircle2 },
  registrar_rejected: { label: 'Registrar Rejected', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: XCircle },
  admin_approved: { label: 'Admin Approved', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', icon: CheckCircle2 },
  admin_rejected: { label: 'Admin Rejected', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', icon: XCircle },
  vehicle_assigned: { label: 'Vehicle Assigned', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', icon: Truck },
  travel_completed: { label: 'Travel Completed', badge: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400', icon: MapPin },
  admin_vehicle_assigned: { label: 'Vehicle Assigned', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', icon: Truck },
  admin_travel_completed: { label: 'Travel Completed', badge: 'bg-gray-200 text-gray-700', dot: 'bg-gray-400', icon: MapPin },
};

const Badge = ({ type }) => {
  const cfg = EVENT_CFG[type] || { label: type, badge: 'bg-gray-100 text-gray-600', icon: Activity };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
};

// ── Tab descriptions ─────────────────────────────────────────────────────────
const TAB_INFO = {
  timeline: {
    title: 'Timeline View',
    desc: 'A chronological activity feed showing every system event newest-first. Each event card shows the actor, destination, requester, and turnaround time at a glance.'
  },
  table: {
    title: 'Table View',
    desc: 'A structured, spreadsheet-style view of all events. Best for reviewing large volumes of data, comparing entries side by side, and exporting to CSV.'
  },
  grouped: {
    title: 'Grouped View',
    desc: 'Events are clustered by transport request. Expand any request card to see the full decision trail — from submission through final approval/rejection and vehicle assignment.'
  },
};

// ── Main ─────────────────────────────────────────────────────────────────────
const AuditLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline');
  const [expanded, setExpanded] = useState(new Set());
  const [showTabInfo, setShowTabInfo] = useState(false);

  // Raw counts from DB (for stat cards)
  const [rawStats, setRawStats] = useState({
    total: 0, submissions: 0, approvals: 0,
    rejections: 0, completed: 0
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, approvs] = await Promise.all([
        // SAFE: only join 'user' — its FK is confirmed to work.
        // driver:drivers(name) was crashing because column is 'full_name' and FK may not exist.
        // vehicle/driver info is already stored as flat cols: driver_name, vehicle_id, etc.
        supabase
          .from('transport_requests')
          .select('*, user:users!transport_requests_user_id_fkey(full_name, email, department)')
          .order('submitted_at', { ascending: false })
          .limit(500),

        supabase
          .from('approvals')
          .select(`
            id, action, approved_at, comment, approver_role,
            approver:users!approvals_approver_id_fkey(full_name, email),
            request:transport_requests!approvals_request_id_fkey(
              id, request_number, place_of_visit, submitted_at,
              user:users!transport_requests_user_id_fkey(full_name, email, department)
            )
          `)
          .order('approved_at', { ascending: false })
          .limit(500),
      ]);

      // Surface any real errors to console for debugging
      if (reqs.error)   console.error('[AuditLogs] transport_requests ERROR:', JSON.stringify(reqs.error));
      if (approvs.error) console.error('[AuditLogs] approvals ERROR:', JSON.stringify(approvs.error));

      const requests  = reqs.data   || [];
      const approvals = approvs.data || [];

      if (requests.length > 0) {
        const statusCounts = requests.reduce((acc, r) => {
          acc[r.current_status] = (acc[r.current_status] || 0) + 1;
          return acc;
        }, {});

      }

      // DONE statuses: TravelCompletion.jsx writes 'completed', some flows write 'travel_completed'
      const DONE_STATUSES = ['completed', 'travel_completed', 'closed'];
      const totalApprovals  = approvals.filter(a => a.action === 'approved').length;
      const totalRejections = approvals.filter(a => a.action === 'rejected').length;
      // Only use current_status — don't rely on completed_at which may not exist in schema
      const totalCompleted  = requests.filter(r => DONE_STATUSES.includes(r.current_status)).length;
      const totalSubmissions = requests.length;

      setRawStats({
        total: totalSubmissions + approvals.length,
        submissions: totalSubmissions,
        approvals: totalApprovals,
        rejections: totalRejections,
        completed: totalCompleted,
      });

      // ── Build event list ──
      const evtList = [];

      requests.forEach(r => {
        // Detect if this is likely a resubmission (if it has any rejected approvals)
        const hasRejection = approvals.some(a => (a.request?.id || a.request_id) === r.id && a.action === 'rejected');

        evtList.push({
          id: `submit-${r.id}`, type: 'submitted',
          timestamp: r.submitted_at || r.created_at,
          requestId: r.id, requestNumber: r.request_number,
          userName: r.user?.full_name, userEmail: r.user?.email,
          userDept: r.user?.department, destination: r.place_of_visit,
          actor: r.user?.full_name, actorRole: 'user',
          detail: hasRejection ? 'Transport request resubmitted for approval' : 'Transport request submitted to system',
        });

      });

      approvals.forEach(a => {
        evtList.push({
          id: `appr-${a.id}`,
          type: `${a.approver_role}_${a.action}`,
          timestamp: a.approved_at,
          requestId: a.request?.id, requestNumber: a.request?.request_number,
          userName: a.request?.user?.full_name, userEmail: a.request?.user?.email,
          userDept: a.request?.user?.department, destination: a.request?.place_of_visit,
          actor: a.approver?.full_name, actorRole: a.approver_role,
          detail: a.comment ? `Comment: "${a.comment}"` : 'Decision recorded',
          turnaround: timeSince(a.request?.submitted_at, a.approved_at),
        });
      });

      evtList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setEvents(evtList);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (dateFilter !== 'all') {
      const cutoff = new Date(Date.now() - parseInt(dateFilter) * 86400000);
      if (new Date(e.timestamp) < cutoff) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        e.requestNumber?.toLowerCase().includes(q) ||
        e.userName?.toLowerCase().includes(q) ||
        e.actor?.toLowerCase().includes(q) ||
        e.destination?.toLowerCase().includes(q) ||
        e.userDept?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Grouped ──────────────────────────────────────────────────────────────────
  const grouped = filtered.reduce((acc, e) => {
    if (!e.requestId) return acc;
    if (!acc[e.requestId]) acc[e.requestId] = {
      requestNumber: e.requestNumber,
      userName: e.userName,
      destination: e.destination,
      events: []
    };
    acc[e.requestId].events.push(e);
    return acc;
  }, {});

  // ── Excel Export ───────────────────────────────────────────────────────────
  const exportExcel = () => {
    const headers = ['Timestamp (IST)', 'Event', 'Request #', 'Requester', 'Dept', 'Destination', 'Actor', 'Role', 'Detail', 'Turnaround'];
    
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    filtered.forEach(e => {
      const row = [
        fmtDT(e.timestamp),
        EVENT_CFG[e.type]?.label || e.type,
        e.requestNumber || '',
        e.userName || '',
        e.userDept || '',
        e.destination || '',
        e.actor || '',
        e.actorRole || '',
        e.detail || '',
        e.turnaround || ''
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    const csvString = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const fileName = `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Manual anchor download pattern (most reliable for setting filename)
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filtered.length} events to ${fileName}`);
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const printAuditLog = () => {
    const rows = filtered.map(e => `
      <tr>
        <td>${fmtDT(e.timestamp)}</td>
        <td>${EVENT_CFG[e.type]?.label || e.type}</td>
        <td>${e.requestNumber || '—'}</td>
        <td>${e.userName || '—'}</td>
        <td>${e.destination || '—'}</td>
        <td>${e.actor || '—'} (${e.actorRole || '—'})</td>
        <td>${e.detail || '—'}</td>
      </tr>`).join('');

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Thapar Transport — Audit Log</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          h1 { font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
          .meta { font-size: 10px; color: #6b7280; margin-bottom: 16px; }
          .stats { display: flex; gap: 24px; margin-bottom: 20px; padding: 12px 16px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd; }
          .stat { text-align: center; }
          .stat-val { font-size: 22px; font-weight: 700; color: #1d4ed8; }
          .stat-lbl { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1d4ed8; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          tr:hover td { background: #eff6ff; }
          .footer { margin-top: 20px; font-size: 9px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          @media print {
            @page { margin: 15mm; size: A4 landscape; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>🏫 Thapar Institute — Transport Audit Log</h1>
        <div class="meta">Generated: ${fmtDT(new Date().toISOString())} &nbsp;|&nbsp; Showing ${filtered.length} of ${events.length} events</div>
        <div class="stats">
          <div class="stat"><div class="stat-val">${rawStats.total}</div><div class="stat-lbl">Total Events</div></div>
          <div class="stat"><div class="stat-val">${rawStats.approvals}</div><div class="stat-lbl">Approvals</div></div>
          <div class="stat"><div class="stat-val">${rawStats.rejections}</div><div class="stat-lbl">Rejections</div></div>
          <div class="stat"><div class="stat-val">${rawStats.completed}</div><div class="stat-lbl">Trips Completed</div></div>
        </div>
        <table>
          <thead><tr><th>Timestamp (IST)</th><th>Event</th><th>Request #</th><th>Requester</th><th>Destination</th><th>Actor</th><th>Detail</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">Thapar Institute of Engineering &amp; Technology &mdash; Transport Management System &mdash; Confidential</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center h-64"><Loader size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>

        {/* ── Header (matches AdminDashboard style) ── */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Audit Logs</h1>
              <p className="text-gray-600">
                Complete system activity log — all timestamps in <strong>IST (Asia/Kolkata, UTC+5:30)</strong>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={fetchAll}
                className="p-2 text-gray-500 hover:bg-white rounded-lg border border-gray-200 transition-colors shadow-sm"
                title="Refresh">
                <RefreshCcw className="w-4 h-4" />
              </button>
              {/* Export section */}
              <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden shadow-sm text-sm font-medium">
                <span className="px-3 py-2 bg-gray-50 text-gray-500 border-r border-gray-200 text-xs tracking-wide">Export</span>
                <button onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-green-50 text-green-700 transition-colors border-r border-gray-200"
                  title="Export to Excel (.xlsx)">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={printAuditLog}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 text-blue-700 transition-colors"
                  title="Print audit log">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards (4 cards) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              title: 'Total Events',
              tip: 'All system actions combined: every submission, approval, rejection, vehicle assignment, and completion logged in this audit trail.',
              value: rawStats.total,
              icon: Activity,
              grad: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20', text: 'text-blue-600'
            },
            {
              title: 'Approvals',
              tip: 'Total approve decisions recorded across all approvers (Head, Registrar, Admin). One request may receive multiple approvals at different stages.',
              value: rawStats.approvals,
              icon: CheckCircle2,
              grad: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20', text: 'text-green-600'
            },
            {
              title: 'Rejections',
              tip: 'Total reject decisions recorded across all approvers. A rejected request can be corrected and resubmitted by the user.',
              value: rawStats.rejections,
              icon: XCircle,
              grad: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20', text: 'text-red-600'
            },
            {
              title: 'Trips Completed',
              tip: 'Requests where the vehicle was returned and meter readings were logged via Travel Completion. Status set to \'completed\'.',
              value: rawStats.completed,
              icon: Truck,
              grad: 'from-teal-500 to-cyan-600', shadow: 'shadow-teal-500/20', text: 'text-teal-600'
            },
          ].map((s, i) => (
            <div key={s.title} className="group relative">
              <div
                className={`bg-white rounded-2xl shadow-lg ${s.shadow} border border-gray-100 p-5 flex items-center space-x-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default`}
                style={{ animation: 'slideUp 0.5s ease-out', animationDelay: `${i * 80}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <s.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <p className={`text-3xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{s.title}</p>
                </div>
              </div>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center leading-relaxed">
                <span className="font-semibold block mb-1">{s.title}</span>
                {s.tip}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>

        {/* ── View Mode Tabs with description ── */}
        <div className="mb-5" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm p-1 space-x-1">
              {[
                { id: 'timeline', label: 'Timeline', icon: GitCommitHorizontal },
                { id: 'table', label: 'Table', icon: List },
                { id: 'grouped', label: 'Grouped', icon: LayoutList },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setViewMode(id); setShowTabInfo(false); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTabInfo(v => !v)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <Info className="w-4 h-4" />
              <span>{showTabInfo ? 'Hide' : 'What is this view?'}</span>
            </button>
          </div>

          {/* Tab explanation banner */}
          {showTabInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 animate-slideDown">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-0.5">{TAB_INFO[viewMode].title}</p>
                <p className="text-sm text-blue-700">{TAB_INFO[viewMode].desc}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search request #, user, actor, destination…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none appearance-none bg-white">
                <option value="all">All Event Types</option>
                {Object.entries(EVENT_CFG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none appearance-none bg-white">
                <option value="all">All Time</option>
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Showing <strong className="text-gray-900">{filtered.length}</strong> of <strong className="text-gray-900">{events.length}</strong> events
          {viewMode === 'grouped' && ` · ${Object.keys(grouped).length} requests`}
        </p>

        {/* ════════════════════════════════════════════════════════
            TIMELINE VIEW
        ════════════════════════════════════════════════════════ */}
        {viewMode === 'timeline' && (
          <div className="relative ml-4">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 rounded-full" />
            <div className="space-y-3 pl-10">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  No events found for the selected filters.
                </div>
              ) : filtered.map((e, i) => {
                const cfg = EVENT_CFG[e.type] || { dot: 'bg-gray-400', icon: Activity };
                const Icon = cfg.icon;
                return (
                  <div key={e.id} className="relative bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all"
                    style={{ animation: 'slideRight 0.3s ease-out', animationDelay: `${Math.min(i * 15, 250)}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    {/* Timeline dot */}
                    <div className={`absolute top-5 -left-7 w-4 h-4 rounded-full ${cfg.dot} border-2 border-white shadow-sm flex items-center justify-center`}>
                      <Icon className="w-2.5 h-2.5 text-white" />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge type={e.type} />
                        {e.requestNumber && (
                          <span className="text-sm font-bold text-blue-600">{e.requestNumber}</span>
                        )}
                        {e.destination && (
                          <span className="text-sm text-gray-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{e.destination}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap font-mono">{fmtDT(e.timestamp)}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
                      {e.userName && (
                        <span>
                          <span className="text-gray-400 text-xs">Requester </span>
                          <strong>{e.userName}</strong>
                          {e.userDept ? <span className="text-gray-400"> · {e.userDept}</span> : ''}
                        </span>
                      )}
                      {e.actor && (
                        <span>
                          <span className="text-gray-400 text-xs">Actor </span>
                          <strong>{e.actor}</strong>
                          <span className="text-gray-400 capitalize text-xs"> ({e.actorRole})</span>
                        </span>
                      )}
                      {e.turnaround && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          <Timer className="w-3 h-3" /> {e.turnaround}
                        </span>
                      )}
                    </div>
                    {e.detail && (
                      <p className="mt-1.5 text-xs text-gray-400 italic">{e.detail}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TABLE VIEW
        ════════════════════════════════════════════════════════ */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            style={{ animation: 'slideUp 0.5s ease-out', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Timestamp (IST)', 'Event Type', 'Request #', 'Requester', 'Dept', 'Destination', 'Actor', 'Role', 'Detail', 'Turnaround'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-500">No events found</td></tr>
                  ) : filtered.map((e, i) => (
                    <tr key={e.id}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                      style={{ animation: 'slideRight 0.3s ease-out', animationDelay: `${Math.min(i * 15, 200)}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                      <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap font-mono">{fmtDT(e.timestamp)}</td>
                      <td className="px-5 py-4 whitespace-nowrap"><Badge type={e.type} /></td>
                      <td className="px-5 py-4 font-bold text-blue-600 whitespace-nowrap">{e.requestNumber || '—'}</td>
                      <td className="px-5 py-4 text-gray-900">{e.userName || '—'}</td>
                      <td className="px-5 py-4 text-gray-500 text-sm">{e.userDept || '—'}</td>
                      <td className="px-5 py-4 text-gray-700">{e.destination || '—'}</td>
                      <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{e.actor || '—'}</td>
                      <td className="px-5 py-4 capitalize text-gray-500 text-sm">{e.actorRole || '—'}</td>
                      <td className="px-5 py-4 text-xs text-gray-500 max-w-xs" title={e.detail}>
                        <span className="truncate block max-w-[200px]">{e.detail || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        {e.turnaround ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            <Timer className="w-3 h-3" /> {e.turnaround}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            GROUPED VIEW
        ════════════════════════════════════════════════════════ */}
        {viewMode === 'grouped' && (
          <div className="space-y-3">
            {Object.keys(grouped).length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                No events found for the selected filters.
              </div>
            ) : Object.entries(grouped).map(([reqId, g], gi) => {
              const isOpen = expanded.has(reqId);
              const hasReject = g.events.some(e => e.type.endsWith('_rejected'));
              const hasDone = g.events.some(e => e.type === 'travel_completed');
              return (
                <div key={reqId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                  style={{ animation: 'slideUp 0.4s ease-out', animationDelay: `${Math.min(gi * 40, 300)}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                  <button
                    onClick={() => { const n = new Set(expanded); n.has(reqId) ? n.delete(reqId) : n.add(reqId); setExpanded(n); }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                      <span className="font-bold text-blue-600">{g.requestNumber || 'Request'}</span>
                      {g.userName && <span className="text-sm text-gray-700 font-medium">{g.userName}</span>}
                      {g.destination && (
                        <span className="text-sm text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />{g.destination}
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {g.events.length} event{g.events.length !== 1 ? 's' : ''}
                      </span>
                      {hasDone && <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-medium">Completed</span>}
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {hasReject
                        ? <XCircle className="w-5 h-5 text-red-500" />
                        : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
                      {g.events.map(e => (
                        <div key={e.id} className="bg-white rounded-lg border border-gray-200 p-3 flex flex-wrap items-start gap-3">
                          <Badge type={e.type} />
                          <div className="flex-1 min-w-0 text-sm text-gray-700">
                            <span className="text-gray-400 text-xs">Actor: </span>
                            <strong>{e.actor || '—'}</strong>
                            <span className="capitalize text-gray-400 text-xs"> ({e.actorRole})</span>
                            {e.turnaround && (
                              <span className="ml-3 inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                <Timer className="w-3 h-3" /> {e.turnaround}
                              </span>
                            )}
                            {e.detail && <p className="text-xs text-gray-400 mt-0.5 italic">{e.detail}</p>}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap font-mono flex-shrink-0">
                            {fmtDT(e.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </DashboardLayout>

      <style>{`
        @keyframes slideUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-15px); } to { opacity:1; transform:translateY(0);  } }
        @keyframes slideRight{ from { opacity:0; transform:translateX(-15px); } to { opacity:1; transform:translateX(0); } }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default AuditLogs;