import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { Clock } from 'lucide-react';

const PendingReview = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Review</h1>
      
      <Card>
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No requests pending review</p>
          <p className="text-sm mt-2">Head-approved requests will appear here</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default PendingReview;