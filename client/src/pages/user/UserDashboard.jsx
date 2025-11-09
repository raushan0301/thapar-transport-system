import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const UserDashboard = () => {
  const stats = [
    { label: 'Total Requests', value: '0', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending', value: '0', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Approved', value: '0', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Rejected', value: '0', icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-0">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Recent Requests">
        <div className="text-center py-8 text-gray-500">
          <p>No requests yet. Create your first transport request!</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default UserDashboard;