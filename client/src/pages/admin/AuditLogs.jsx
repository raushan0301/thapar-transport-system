import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Shield, Search } from 'lucide-react';

const AuditLogs = () => {
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'approve_request', label: 'Approve Request' },
    { value: 'reject_request', label: 'Reject Request' },
    { value: 'export_data', label: 'Export Data' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
      </div>

      <Card title="Filter Logs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Search"
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search by user or action..."
            icon={Search}
          />

          <Select
            label="Action Type"
            name="action"
            value={filters.action}
            onChange={handleChange}
            options={actionOptions}
          />

          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
          />

          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card title="Audit Trail" className="mt-6">
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No audit logs found</p>
          <p className="text-sm mt-2">System activities will be logged here</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default AuditLogs;