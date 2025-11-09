import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Settings, Save } from 'lucide-react';

const RateSettings = () => {
  const [formData, setFormData] = useState({
    diesel_car_rate: '4.00',
    petrol_car_rate: '5.00',
    bus_student_rate: '15.00',
    bus_other_rate: '18.00',
    night_charge: '100.00',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Will implement later
    console.log('Rate settings:', formData);
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Rate Settings</h1>
      </div>
      
      <Card title="Transport Rates Configuration">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Diesel Car Rate (per KM)"
              type="number"
              step="0.01"
              name="diesel_car_rate"
              value={formData.diesel_car_rate}
              onChange={handleChange}
              required
            />

            <Input
              label="Petrol Car Rate (per KM)"
              type="number"
              step="0.01"
              name="petrol_car_rate"
              value={formData.petrol_car_rate}
              onChange={handleChange}
              required
            />

            <Input
              label="Bus Rate for Students (per KM)"
              type="number"
              step="0.01"
              name="bus_student_rate"
              value={formData.bus_student_rate}
              onChange={handleChange}
              required
            />

            <Input
              label="Bus Rate for Others (per KM)"
              type="number"
              step="0.01"
              name="bus_other_rate"
              value={formData.bus_other_rate}
              onChange={handleChange}
              required
            />

            <Input
              label="Night Charges (Flat Rate)"
              type="number"
              step="0.01"
              name="night_charge"
              value={formData.night_charge}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mt-6">
            <Button type="submit" variant="primary" icon={Save}>
              Save Rate Settings
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Current Rates" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Diesel Car</p>
            <p className="text-2xl font-bold text-gray-900">₹4.00/KM</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Petrol Car</p>
            <p className="text-2xl font-bold text-gray-900">₹5.00/KM</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Bus (Students)</p>
            <p className="text-2xl font-bold text-gray-900">₹15.00/KM</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-gray-600">Bus (Others)</p>
            <p className="text-2xl font-bold text-gray-900">₹18.00/KM</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Night Charges</p>
            <p className="text-2xl font-bold text-gray-900">₹100.00</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default RateSettings;