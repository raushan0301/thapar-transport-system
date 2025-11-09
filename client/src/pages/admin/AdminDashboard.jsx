import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { FileText, Clock, CheckCircle, Car, Users, TrendingUp } from 'lucide-react';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Requests', value: '0', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending Review', value: '0', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Completed', value: '0', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    { label: 'Active Vehicles', value: '0', icon: Car, color: 'bg-purple-100 text-purple-600' },
    { label: 'Total Users', value: '0', icon: Users, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'This Month', value: '0', icon: TrendingUp, color: 'bg-teal-100 text-teal-600' },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Requests">
          <div className="text-center py-8 text-gray-500">
            <p>No recent requests</p>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium text-gray-900">Review Pending Requests</p>
              <p className="text-sm text-gray-600">0 requests waiting</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium text-gray-900">Assign Vehicles</p>
              <p className="text-sm text-gray-600">0 pending assignments</p>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <p className="font-medium text-gray-900">Complete Travel Details</p>
              <p className="text-sm text-gray-600">0 travels to complete</p>
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;