import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import { CheckCircle } from 'lucide-react';

const TravelCompletion = () => {
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Travel Completion</h1>
      
      <Card>
        <div className="text-center py-12 text-gray-500">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No travels to complete</p>
          <p className="text-sm mt-2">Completed travels awaiting details will appear here</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default TravelCompletion;