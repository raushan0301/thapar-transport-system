import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, Plus } from 'lucide-react';

const HeadManagement = () => {
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Head Management</h1>
        <Button variant="primary" icon={Plus}>
          Add Head
        </Button>
      </div>
      
      <Card>
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg">No heads added yet</p>
          <p className="text-sm mt-2">Click "Add Head" to add department heads</p>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default HeadManagement;