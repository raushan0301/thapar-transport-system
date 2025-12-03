import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import FilterBar from '../../components/common/FilterBar';
import ExportButton from '../../components/common/ExportButton';
import StatisticsCards from '../../components/common/StatisticsCards';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { FileText, Search, ChevronDown, ChevronRight, CheckCircle, XCircle, List, Grid } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grouped'
  const [expandedRequests, setExpandedRequests] = useState(new Set());
  const [filters, setFilters] = useState({
    role: 'all',
    action: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          approver:users!approvals_approver_id_fkey(full_name),
          request:transport_requests!approvals_request_id_fkey(
            request_number,
            place_of_visit,
            submitted_at,
            current_status,
            user:users!transport_requests_user_id_fkey(full_name)
          )
        `)
        .in('action', ['approved', 'rejected'])
        .order('approved_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeTaken = (submittedAt, approvedAt) => {
    if (!submittedAt || !approvedAt) return 'N/A';

    const submitted = new Date(submittedAt);
    const approved = new Date(approvedAt);
    const diffMs = approved - submitted;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m`;
    }
  };

  const applyFilters = (log) => {
    if (filters.role !== 'all' && log.approver_role !== filters.role) return false;
    if (filters.action !== 'all' && log.action !== filters.action) return false;

    if (filters.dateRange !== 'all') {
      const logDate = new Date(log.approved_at);
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
      if (logDate < cutoffDate) return false;
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.request?.request_number?.toLowerCase().includes(searchLower) ||
        log.approver?.full_name?.toLowerCase().includes(searchLower) ||
        log.request?.user?.full_name?.toLowerCase().includes(searchLower) ||
        log.request?.place_of_visit?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  };

  const filteredLogs = logs.filter(applyFilters);

  // Group logs by request
  const groupedByRequest = () => {
    const groups = {};
    filteredLogs.forEach(log => {
      const requestId = log.request_id;
      if (!groups[requestId]) {
        groups[requestId] = {
          request: log.request,
          approvals: []
        };
      }
      groups[requestId].approvals.push(log);
    });

    // Sort approvals within each group by date
    Object.values(groups).forEach(group => {
      group.approvals.sort((a, b) => new Date(a.approved_at) - new Date(b.approved_at));
    });

    return Object.entries(groups);
  };

  const toggleRequest = (requestId) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const handleClearFilters = () => {
    setFilters({ role: 'all', action: 'all', dateRange: 'all' });
    setSearchTerm('');
  };

  const exportData = filteredLogs.map(log => ({
    'Date/Time': formatDate(log.approved_at),
    'Request #': log.request?.request_number || 'N/A',
    'User': log.request?.user?.full_name || 'N/A',
    'Destination': log.request?.place_of_visit || 'N/A',
    'Approver': log.approver?.full_name || 'N/A',
    'Role': log.approver_role,
    'Action': log.action,
    'Time Taken': calculateTimeTaken(log.request?.submitted_at, log.approved_at),
    'Comments': log.comment || '-'
  }));

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-gray-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Audit Logs</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded flex items-center space-x-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm">Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1 rounded flex items-center space-x-2 transition-colors ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <Grid className="w-4 h-4" />
                  <span className="text-sm">Grouped</span>
                </button>
              </div>
              <ExportButton data={exportData} filename="audit_logs" variant="primary" />
            </div>
          </div>
          <p className="text-gray-600">Track all system activities and approvals</p>
        </div>

        {/* Statistics */}
        <StatisticsCards logs={filteredLogs} />

        {/* Search */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search by request #, approver, user, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '150ms', opacity: 0, animationFillMode: 'forwards' }}>
          <FilterBar filters={filters} onFilterChange={setFilters} onClearFilters={handleClearFilters} />
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} records
          {viewMode === 'grouped' && ` (${groupedByRequest().length} requests)`}
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date/Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Destination</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Approver</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Time Taken</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">No audit logs found</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, i) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.approved_at)}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600">{log.request?.request_number || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-900">{log.request?.user?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600">{log.request?.place_of_visit || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-900">{log.approver?.full_name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-600 capitalize">{log.approver_role}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{calculateTimeTaken(log.request?.submitted_at, log.approved_at)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{log.comment || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grouped View */
          <div className="space-y-4">
            {groupedByRequest().length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500">No audit logs found</p>
              </div>
            ) : (
              groupedByRequest().map(([requestId, group], i) => {
                const isExpanded = expandedRequests.has(requestId);
                const request = group.request;
                const approvals = group.approvals;

                return (
                  <div
                    key={requestId}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    style={{ animation: 'slideUp 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}
                  >
                    {/* Header */}
                    <div
                      onClick={() => toggleRequest(requestId)}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <span className="font-bold text-blue-600">{request?.request_number || 'N/A'}</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-gray-900">{request?.user?.full_name || 'N/A'}</span>
                            <span className="text-gray-600">|</span>
                            <span className="text-gray-600">{request?.place_of_visit || 'N/A'}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {approvals.length} approval{approvals.length !== 1 ? 's' : ''} • Status: {request?.current_status?.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {approvals.every(a => a.action === 'approved') ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-3">
                          {approvals.map((approval, idx) => (
                            <div key={approval.id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${approval.action === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {approval.action}
                                    </span>
                                    <span className="text-sm text-gray-600">{formatDate(approval.approved_at)}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-500">Approver:</span>
                                      <span className="ml-2 font-medium">{approval.approver?.full_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Role:</span>
                                      <span className="ml-2 font-medium capitalize">{approval.approver_role}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Time Taken:</span>
                                      <span className="ml-2 font-medium">{calculateTimeTaken(request?.submitted_at, approval.approved_at)}</span>
                                    </div>
                                    {approval.comment && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500">Comment:</span>
                                        <span className="ml-2">{approval.comment}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default AuditLogs;