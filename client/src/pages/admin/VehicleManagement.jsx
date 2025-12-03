import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { Truck, Plus, Search, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: '',
    custom_vehicle_type: '',
    model: '',
    capacity: '',
    is_available: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('vehicles').select('*').order('vehicle_number');
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!formData.vehicle_number || !formData.vehicle_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.vehicle_type === 'Other' && !formData.custom_vehicle_type) {
      toast.error('Please specify the vehicle type');
      return;
    }

    setFormLoading(true);
    try {
      const vehicleType = formData.vehicle_type === 'Other' ? formData.custom_vehicle_type : formData.vehicle_type;

      const { error } = await supabase.from('vehicles').insert([{
        vehicle_number: formData.vehicle_number.toUpperCase(),
        vehicle_type: vehicleType,
        model: formData.model || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_available: formData.is_available,
        created_at: new Date().toISOString(),
      }]);

      if (error) throw error;

      toast.success('Vehicle added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchVehicles();
    } catch (err) {
      console.error('Error adding vehicle:', err);
      if (err.code === '23505') {
        toast.error('Vehicle number already exists');
      } else {
        toast.error('Failed to add vehicle');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditVehicle = async () => {
    if (!selectedVehicle) return;

    if (formData.vehicle_type === 'Other' && !formData.custom_vehicle_type) {
      toast.error('Please specify the vehicle type');
      return;
    }

    setFormLoading(true);
    try {
      const vehicleType = formData.vehicle_type === 'Other' ? formData.custom_vehicle_type : formData.vehicle_type;

      const { error } = await supabase
        .from('vehicles')
        .update({
          vehicle_number: formData.vehicle_number.toUpperCase(),
          vehicle_type: vehicleType,
          model: formData.model || null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          is_available: formData.is_available,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedVehicle.id);

      if (error) throw error;

      toast.success('Vehicle updated successfully!');
      setShowEditModal(false);
      setSelectedVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast.error('Failed to update vehicle');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
      if (error) throw error;

      toast.success('Vehicle deleted successfully!');
      fetchVehicles();
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      toast.error('Failed to delete vehicle');
    }
  };

  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    // Check if vehicle type is one of the predefined types
    const predefinedTypes = ['Car', 'Bus', 'Van', 'SUV', 'Truck'];
    const isCustomType = !predefinedTypes.includes(vehicle.vehicle_type);

    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: isCustomType ? 'Other' : vehicle.vehicle_type,
      custom_vehicle_type: isCustomType ? vehicle.vehicle_type : '',
      model: vehicle.model || '',
      capacity: vehicle.capacity?.toString() || '',
      is_available: vehicle.is_available,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      vehicle_type: '',
      custom_vehicle_type: '',
      model: '',
      capacity: '',
      is_available: true,
    });
  };

  const filteredVehicles = vehicles.filter(v =>
    v.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehicle_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="mb-8 flex justify-between items-center animate-slideDown">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Truck className="w-8 h-8 text-purple-600" strokeWidth={1.5} />
              <h1 className="text-4xl font-bold text-gray-900">Vehicle Management</h1>
            </div>
            <p className="text-gray-600">Manage your fleet of vehicles</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Vehicle</Button>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search vehicles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500 mb-4">No vehicles found</p>
            <Button variant="primary" icon={Plus} onClick={() => setShowAddModal(true)}>Add Your First Vehicle</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle, i) => (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: `${i * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-purple-600" strokeWidth={1.5} />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => openEditModal(vehicle)} className="p-2 hover:bg-purple-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-purple-600" strokeWidth={1.5} />
                    </button>
                    <button onClick={() => handleDeleteVehicle(vehicle.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-600" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{vehicle.vehicle_number}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="text-gray-900 font-medium">{vehicle.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="text-gray-900">{vehicle.model || 'N/A'}</span>
                  </div>
                  {vehicle.capacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="text-gray-900">{vehicle.capacity} persons</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {vehicle.is_available ? 'Available' : 'In Use'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Add New Vehicle">
        <div className="space-y-4">
          <Input
            label="Vehicle Number"
            name="vehicle_number"
            value={formData.vehicle_number}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
            placeholder="PB-01-AB-1234"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select Type</option>
              <option value="Car">Car</option>
              <option value="Bus">Bus</option>
              <option value="Van">Van</option>
              <option value="SUV">SUV</option>
              <option value="Truck">Truck</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.vehicle_type === 'Other' && (
            <Input
              label="Specify Vehicle Type"
              name="custom_vehicle_type"
              value={formData.custom_vehicle_type}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_vehicle_type: e.target.value }))}
              placeholder="e.g., Motorcycle, Scooter, etc."
              required
            />
          )}
          <Input
            label="Model"
            name="model"
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            placeholder="e.g., Toyota Innova"
          />
          <Input
            label="Capacity (Persons)"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
            placeholder="e.g., 7"
            min="1"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700">Vehicle is available</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" icon={Plus} onClick={handleAddVehicle} loading={formLoading}>Add Vehicle</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }} title="Edit Vehicle">
        <div className="space-y-4">
          <Input
            label="Vehicle Number"
            name="vehicle_number"
            value={formData.vehicle_number}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))}
            placeholder="PB-01-AB-1234"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Select Type</option>
              <option value="Car">Car</option>
              <option value="Bus">Bus</option>
              <option value="Van">Van</option>
              <option value="SUV">SUV</option>
              <option value="Truck">Truck</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {formData.vehicle_type === 'Other' && (
            <Input
              label="Specify Vehicle Type"
              name="custom_vehicle_type"
              value={formData.custom_vehicle_type}
              onChange={(e) => setFormData(prev => ({ ...prev, custom_vehicle_type: e.target.value }))}
              placeholder="e.g., Motorcycle, Scooter, etc."
              required
            />
          )}
          <Input
            label="Model"
            name="model"
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            placeholder="e.g., Toyota Innova"
          />
          <Input
            label="Capacity (Persons)"
            type="number"
            name="capacity"
            value={formData.capacity}
            onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
            placeholder="e.g., 7"
            min="1"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="edit_is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="edit_is_available" className="text-sm text-gray-700">Vehicle is available</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }}>Cancel</Button>
            <Button variant="primary" icon={Edit} onClick={handleEditVehicle} loading={formLoading}>Update Vehicle</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default VehicleManagement;