import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { FileSpreadsheet, Download, Calendar } from 'lucide-react';

const ExportData = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending_head', label: 'Pending Head' },
    { value: 'pending_admin', label: 'Pending Admin' },
    { value: 'approved_awaiting_vehicle', label: 'Approved' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    // Will implement later
    console.log('Exporting with filters:', filters);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
      </div>

      <Card title="Export Transport Requests">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              icon={Calendar}
            />

            <Input
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              icon={Calendar}
            />
          </div>

          <Select
            label="Filter by Status"
            name="status"
            value={filters.status}
            onChange={handleChange}
            options={statusOptions}
          />

          <div className="flex gap-3">
            <Button variant="primary" icon={Download} onClick={handleExport}>
              Export to Excel
            </Button>
            <Button variant="outline" onClick={() => setFilters({ startDate: '', endDate: '', status: '' })}>
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Export Statistics" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Last Export</p>
            <p className="text-sm font-medium text-gray-900">Never</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default ExportData;