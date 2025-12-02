import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ExportData = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const handleExport = async (type) => {
    setLoading(true);
    setTimeout(() => {
      toast.success(`${type} exported successfully!`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center space-x-3 mb-2">
              <Download className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Export Data</h1>
            </div>
            <p className="text-gray-600">Download reports and data exports</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Date Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'All Requests', desc: 'Export all transport requests', icon: FileText, color: 'blue' },
              { title: 'Approved Requests', desc: 'Export approved requests only', icon: FileText, color: 'green' },
              { title: 'Pending Requests', desc: 'Export pending requests', icon: FileText, color: 'amber' },
              { title: 'Vehicle Usage', desc: 'Export vehicle usage report', icon: FileText, color: 'purple' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: `${(i + 2) * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.desc}</p>
                <Button variant="primary" icon={Download} onClick={() => handleExport(item.title)} loading={loading} fullWidth>Export CSV</Button>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>

      <style jsx>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ExportData;