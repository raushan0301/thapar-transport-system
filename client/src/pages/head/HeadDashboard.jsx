import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';

const HeadDashboard = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Head Dashboard</h1>
      <Card>
        <p>Head dashboard content</p>
      </Card>
    </DashboardLayout>
  );
};

export default HeadDashboard;