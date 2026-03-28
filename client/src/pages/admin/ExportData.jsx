import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Download, FileText, Printer, RefreshCcw,
  Calendar, Filter, CheckCircle2, Clock, Truck, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── IST formatter ────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata'
  });
};
const fmtDT = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
  }) + ' IST';
};

// ── Report types ──────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    id: 'completed',
    title: 'Completed Trips',
    desc: 'All trips with meter readings, distance, rate & amount. Best for billing/accounts.',
    icon: CheckCircle2,
    grad: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20',
    statuses: ['completed', 'travel_completed', 'closed'],
  },
  {
    id: 'all',
    title: 'All Requests',
    desc: 'Every request regardless of status — full history report.',
    icon: FileText,
    grad: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20',
    statuses: null, // no filter
  },
  {
    id: 'approved',
    title: 'Approved Requests',
    desc: 'Requests approved and awaiting/with vehicle, or completed.',
    icon: Truck,
    grad: 'from-indigo-500 to-indigo-600',
    shadow: 'shadow-indigo-500/20',
    statuses: ['approved_awaiting_vehicle', 'vehicle_assigned', 'completed', 'travel_completed'],
  },
  {
    id: 'pending',
    title: 'Pending Requests',
    desc: 'Requests still in approval queue (Head / Registrar / Admin).',
    icon: Clock,
    grad: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/20',
    statuses: ['pending_head', 'pending_admin', 'pending_registrar', 'pending_vehicle'],
  },
];

// ── Exact 16-column spec ──────────────────────────────────────────────────────
const buildRows = (records) =>
  records.map((r, idx) => ({
    'Sr. No.':          idx + 1,
    'ID / Request #':   r.request_number || r.id || '—',
    'Date of Travel':   fmtDate(r.date_of_visit),
    'Requester Name':   r.user?.full_name || '—',
    'Designation':      r.designation || r.user?.designation || '—',
    'Department':       r.department   || r.user?.department  || '—',
    'Opening Date':     fmtDate(r.submitted_at),
    'Closing Date':     fmtDate(r.completed_at || r.updated_at),
    'Destination (From → To)': r.place_of_visit || '—',
    'Opening KM':       r.opening_meter  != null ? r.opening_meter  : '—',
    'Closing KM':       r.closing_meter  != null ? r.closing_meter  : '—',
    'Total KM':         r.total_distance != null ? r.total_distance : '—',
    'Rate (₹/km)':      r.rate_per_km    != null ? r.rate_per_km    : '—',
    'Total Amount (₹)': r.total_amount   != null ? r.total_amount   : '—',
    'Type':             r.trip_type      ? (r.trip_type.charAt(0).toUpperCase() + r.trip_type.slice(1)) : '—',
    'Purpose':          r.purpose || '—',
  }));

// ── Excel export (browser-safe: Blob + anchor click) ─────────────────────────
const doExcel = (records, title) => {
  if (!records.length) { toast.error('No records to export'); return; }

  const rows = buildRows(records);
  const headers = Object.keys(rows[0]);

  // Create CSV with BOM for high compatibility
  const csvRows = [headers.map(h => `"${h}"`).join(',')];
  rows.forEach(r => {
    const values = headers.map(h => {
      const val = r[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const fileName = `Thapar_Transport_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  
  // Manual anchor pattern (proven fix for Mac/Chrome UI issues)
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  toast.success(`Exported ${records.length} records to ${fileName}`);
};

// ── Print ─────────────────────────────────────────────────────────────────────
const doPrint = (records, title) => {
  if (!records.length) { toast.error('No records to print'); return; }
  const rows = buildRows(records);
  const headers = Object.keys(rows[0]);

  const tableRows = rows.map(r =>
    `<tr>${headers.map(h => `<td>${r[h]}</td>`).join('')}</tr>`
  ).join('');

  const w = window.open('', '_blank', 'width=1400,height=900');
  w.document.write(`<!DOCTYPE html><html><head>
    <title>Thapar Transport — ${title}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:10.5px;color:#111;padding:20px}
      .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px;border-bottom:2px solid #1d4ed8;padding-bottom:12px}
      h1{font-size:18px;font-weight:700;color:#1d4ed8}
      .sub{font-size:10px;color:#6b7280;margin-top:3px}
      .meta{text-align:right;font-size:9px;color:#9ca3af}
      .info-bar{display:flex;gap:20px;margin-bottom:14px;padding:8px 14px;background:#f0f9ff;border-radius:6px;border:1px solid #bae6fd}
      .info-item{font-size:10px;color:#1e40af;font-weight:600}
      .info-item span{display:block;font-size:8px;color:#64748b;font-weight:400;text-transform:uppercase;letter-spacing:.05em}
      table{width:100%;border-collapse:collapse;font-size:9.5px}
      thead tr{background:#1d4ed8;color:#fff}
      th{padding:7px 8px;text-align:left;font-weight:600;font-size:9px;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
      td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}
      tr:nth-child(even) td{background:#f8fafc}
      .footer{margin-top:16px;font-size:8.5px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:8px}
      @media print{@page{margin:10mm;size:A4 landscape}body{padding:0}}
    </style>
  </head><body>
    <div class="header">
      <div>
        <h1>🏫 Thapar Institute of Engineering &amp; Technology</h1>
        <div class="sub">Transport Management System — ${title} Report</div>
      </div>
      <div class="meta">Generated: ${fmtDT(new Date().toISOString())}<br>Total Records: ${records.length}</div>
    </div>
    <div class="info-bar">
      <div class="info-item">${records.length}<span>Total Records</span></div>
      <div class="info-item">${records.filter(r=>r.trip_type==='official').length}<span>Official Trips</span></div>
      <div class="info-item">${records.filter(r=>r.trip_type==='private').length}<span>Private Trips</span></div>
      <div class="info-item">₹${records.reduce((s,r)=>s+(Number(r.total_amount)||0),0).toFixed(2)}<span>Total Amount</span></div>
      <div class="info-item">${records.reduce((s,r)=>s+(Number(r.total_distance)||0),0).toFixed(1)} km<span>Total Distance</span></div>
    </div>
    <table>
      <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="footer">Thapar Institute of Engineering &amp; Technology — Transport Management System — Confidential &nbsp;|&nbsp; Printed on ${fmtDT(new Date().toISOString())}</div>
    <script>window.onload=()=>{ window.print(); }</script>
  </body></html>`);
  w.document.close();
};

// ── Component ─────────────────────────────────────────────────────────────────
const ExportData = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [preview, setPreview]   = useState([]);        // loaded records
  const [activeType, setActiveType] = useState(null);  // selected report card
  const [loading, setLoading]  = useState(false);
  const [counts, setCounts]    = useState({});

  // Fetch counts for each type on mount
  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      await Promise.all(REPORT_TYPES.map(async rt => {
        let q = supabase.from('transport_requests').select('id', { count: 'exact', head: true });
        if (rt.statuses) q = q.in('current_status', rt.statuses);
        const { count } = await q;
        results[rt.id] = count || 0;
      }));
      setCounts(results);
    };
    fetchCounts();
  }, []);

  const loadData = useCallback(async (rt) => {
    setLoading(true);
    setActiveType(rt.id);
    try {
      let q = supabase
        .from('transport_requests')
        .select(`*,
          user:users!transport_requests_user_id_fkey(full_name, email, department, designation)
        `)
        .order('submitted_at', { ascending: false });

      if (rt.statuses)      q = q.in('current_status', rt.statuses);
      if (dateRange.start)  q = q.gte('date_of_visit', dateRange.start);
      if (dateRange.end)    q = q.lte('date_of_visit', dateRange.end);

      const { data, error } = await q;
      if (error) throw error;
      setPreview(data || []);
      toast.success(`Loaded ${data?.length || 0} records`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to load: ${err.message}`);
      setPreview([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const currentType = REPORT_TYPES.find(r => r.id === activeType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center space-x-3 mb-1">
              <Download className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Export Data</h1>
            </div>
            <p className="text-gray-600">
              Select a report type, optionally filter by date, then export to <strong>Excel</strong> or <strong>Print</strong>.
              All timestamps in <strong>IST (Asia/Kolkata)</strong>.
            </p>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6"
            style={{ animation: 'slideUp 0.5s ease-out', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Date Range Filter <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">From (Date of Travel)</label>
                <input
                  type="date" value={dateRange.start}
                  onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">To (Date of Travel)</label>
                <input
                  type="date" value={dateRange.end}
                  onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <RefreshCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
            {(dateRange.start || dateRange.end) && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 flex-shrink-0" />
                Filtering by date of travel:
                {dateRange.start && <strong> from {fmtDate(dateRange.start)}</strong>}
                {dateRange.end   && <strong> to {fmtDate(dateRange.end)}</strong>}
              </div>
            )}
          </div>

          {/* Report Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {REPORT_TYPES.map((rt, i) => (
              <div
                key={rt.id}
                onClick={() => loadData(rt)}
                className={`relative bg-white rounded-2xl border cursor-pointer p-5 transition-all duration-300 hover:-translate-y-1 shadow-lg
                  ${activeType === rt.id ? 'ring-2 ring-blue-500 shadow-xl' : 'border-gray-100 hover:shadow-xl'}
                  ${rt.shadow}`}
                style={{ animation: 'slideUp 0.5s ease-out', animationDelay: `${i * 80}ms`, opacity: 0, animationFillMode: 'forwards' }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${rt.grad} flex items-center justify-center mb-3 shadow-md`}>
                  <rt.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{rt.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{rt.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-800">{counts[rt.id] ?? '—'}</span>
                  <span className="text-xs text-gray-400">records</span>
                </div>
                {activeType === rt.id && (
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Preview + Export Panel */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 flex flex-col items-center gap-3">
              <Loader size="lg" />
              <p className="text-gray-500 text-sm">Loading records…</p>
            </div>
          )}

          {!loading && activeType && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              style={{ animation: 'slideUp 0.4s ease-out', opacity: 0, animationFillMode: 'forwards' }}>

              {/* Panel header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h3 className="font-bold text-gray-900">{currentType?.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {preview.length} records loaded
                    {(dateRange.start || dateRange.end) && ' (date filtered)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData(currentType)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Refresh">
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <span className="px-3 py-2 bg-gray-50 border-r border-gray-200 text-xs font-medium text-gray-500">Export as</span>
                    <button
                      onClick={() => doExcel(preview, currentType?.title)}
                      disabled={!preview.length}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-green-50 text-green-700 font-medium text-sm transition-colors border-r border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Download className="w-4 h-4" /> Excel
                    </button>
                    <button
                      onClick={() => doPrint(preview, currentType?.title)}
                      disabled={!preview.length}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview table */}
              {preview.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No records found</p>
                  <p className="text-sm mt-1">Try clearing the date filter or selecting a different report type.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-blue-700 text-white">
                      <tr>
                        {['Sr.', 'ID / Req #', 'Travel Date', 'Requester', 'Designation', 'Department',
                          'Opening Date', 'Closing Date', 'Destination', 'Open KM', 'Close KM',
                          'Total KM', 'Rate', 'Amount', 'Type', 'Purpose'
                        ].map(h => (
                          <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 50).map((r, idx) => (
                        <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}>
                          <td className="px-3 py-2.5 text-gray-400 font-medium text-center">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-semibold text-blue-600 whitespace-nowrap">{r.request_number || r.id}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-gray-700">{fmtDate(r.date_of_visit)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-900">{r.user?.full_name || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{r.designation || r.user?.designation || '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600">{r.department || r.user?.department || '—'}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">{fmtDate(r.submitted_at)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">{fmtDate(r.completed_at || r.updated_at)}</td>
                          <td className="px-3 py-2.5 text-gray-700 max-w-32 truncate" title={r.place_of_visit}>{r.place_of_visit || '—'}</td>
                          <td className="px-3 py-2.5 text-center text-gray-700">{r.opening_meter ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-gray-700">{r.closing_meter ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center font-semibold text-gray-900">{r.total_distance ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center text-gray-700">{r.rate_per_km ?? '—'}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-green-700">
                            {r.total_amount != null ? `₹${Number(r.total_amount).toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            {r.trip_type ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                                ${r.trip_type === 'official' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {r.trip_type.charAt(0).toUpperCase() + r.trip_type.slice(1)}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 max-w-40 truncate" title={r.purpose}>{r.purpose || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 50 && (
                    <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 text-xs text-amber-700 text-center">
                      Preview shows first 50 of {preview.length} records. <strong>Excel / Print exports all {preview.length} records.</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!loading && !activeType && (
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 text-center text-gray-400"
              style={{ animation: 'slideUp 0.4s ease-out', opacity: 0, animationFillMode: 'forwards' }}>
              <Download className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">Click any report card above to load data</p>
              <p className="text-sm mt-1">Then export to Excel or Print</p>
            </div>
          )}

        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-16px);} to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ExportData;