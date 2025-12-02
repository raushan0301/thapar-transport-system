import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { FileText, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('approvals').select('*, approver:users(full_name), request:transport_requests(request_number)').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => log.request?.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) || log.approver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-8 h-8 text-gray-600" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-gray-900">Audit Logs</h1>
          </div>
          <p className="text-gray-600">Track all system activities and approvals</p>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date/Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Approver</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 30}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(log.created_at)}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{log.request?.request_number || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-900">{log.approver?.full_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{log.approver_role}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.action === 'approved' ? 'bg-green-100 text-green-700' : log.action === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.comments || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardLayout>

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default AuditLogs;