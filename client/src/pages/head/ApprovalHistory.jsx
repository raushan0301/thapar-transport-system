import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { History } from 'lucide-react';

const ApprovalHistory = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Approval History</h1>
      
      <Card>
        <div className="text-center py-12 text-gray-500">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No approval history</p>
          <p className="text-sm mt-2">Your approval history will be shown here</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default ApprovalHistory;