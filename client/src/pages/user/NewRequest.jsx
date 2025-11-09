import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { FileText } from 'lucide-react';

const NewRequest = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Transport Request</h1>
      
      <Card>
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">Request form coming soon</p>
          <p className="text-sm mt-2">You'll be able to submit transport requests here</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default NewRequest;