import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';

const MyRequests = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Requests</h1>
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p>No requests found</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default MyRequests;