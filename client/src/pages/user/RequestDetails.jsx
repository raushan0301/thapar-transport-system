import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';

const RequestDetails = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Request Details</h1>
      <Card>
        <p>Request details will be shown here</p>
      </Card>
    </DashboardLayout>
  );
};

export default RequestDetails;