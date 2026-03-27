import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../services/supabase';
import { toast } from 'react-hot-toast';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CreditCard,
  Truck,
  Search,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [hasActiveAssignment, setHasActiveAssignment] = useState(false);

  const emptyForm = {
    full_name: '',
    phone: '',
    license_number: '',
    license_expiry: '',
    assigned_vehicle_id: '',
    is_available: true,
    notes: ''
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select(`*, vehicle:vehicles(id, vehicle_number, vehicle_type)`)
        .order('full_name', { ascending: true });

      if (error) {
        // Table might not exist yet — show empty state gracefully
        console.warn('Drivers table not found or error:', error.message);
        setDrivers([]);
      } else {
        setDrivers(data || []);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('id, vehicle_number, vehicle_type')
      .order('vehicle_number', { ascending: true });
    setVehicles(data || []);
  };

  const openAdd = () => {
    setEditingDriver(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = async (driver) => {
    setEditingDriver(driver);
    setHasActiveAssignment(false);

    // If driver is not available, check if on a trip
    if (!driver.is_available) {
        try {
            const { count, error } = await supabase
                .from('transport_requests')
                .select('*', { count: 'exact', head: true })
                .eq('driver_id', driver.id)
                .eq('current_status', 'vehicle_assigned');
            
            if (!error && count > 0) {
                setHasActiveAssignment(true);
            }
        } catch (err) {
            console.error('Error checking assignment:', err);
        }
    }

    setForm({
      full_name: driver.full_name || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_expiry: driver.license_expiry || '',
      assigned_vehicle_id: driver.assigned_vehicle_id || '',
      is_available: driver.is_available ?? true,
      notes: driver.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { toast.error('Driver name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return; }
    if (!form.license_number.trim()) { toast.error('License number is required'); return; }

    setSaving(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        license_number: form.license_number.trim(),
        license_expiry: form.license_expiry || null,
        assigned_vehicle_id: form.assigned_vehicle_id || null,
        is_available: form.is_available,
        notes: form.notes.trim() || null
      };

      let error;
      if (editingDriver) {
        ({ error } = await supabase.from('drivers').update(payload).eq('id', editingDriver.id));
      } else {
        ({ error } = await supabase.from('drivers').insert([payload]));
      }

      if (error) throw error;

      toast.success(editingDriver ? 'Driver updated!' : 'Driver added!');
      setShowModal(false);
      fetchDrivers();
    } catch (err) {
      toast.error(err.message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    // Find the driver to check status
    const driver = drivers.find(d => d.id === id);
    if (driver && !driver.is_available) {
        toast.error('Cannot delete a driver who is currently on duty');
        setDeleteConfirm(null);
        return;
    }

    try {
      const { error } = await supabase.from('drivers').delete().eq('id', id);
      if (error) throw error;
      toast.success('Driver removed');
      setDeleteConfirm(null);
      fetchDrivers();
    } catch (err) {
      console.error('Error deleting driver:', err);
      toast.error('Failed to delete driver. They may be referenced in trip requests.');
    }
  };

  const filtered = drivers.filter(d =>
    d.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.license_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm)
  );

  const vehicleTypeLabel = (type) => {
    const map = { diesel_car: 'Diesel Car', petrol_car: 'Petrol Car', bus: 'Bus' };
    return map[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8" style={{ animation: 'slideDown 0.5s ease-out' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-8 h-8 text-teal-600" strokeWidth={1.5} />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage drivers, licenses, and vehicle assignments</p>
              </div>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Driver
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, license, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Drivers', value: drivers.length, color: 'teal' },
            { label: 'Available', value: drivers.filter(d => d.is_available).length, color: 'green' },
            { label: 'On Duty', value: drivers.filter(d => !d.is_available).length, color: 'amber' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              <span className="text-sm text-gray-500 mt-1">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Driver Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">
              {searchTerm ? 'No drivers match your search' : 'No drivers added yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={openAdd}
                className="mt-4 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                Add First Driver
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((driver, idx) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition-all duration-300 p-5 group"
                style={{ animation: 'slideUp 0.4s ease-out forwards', animationDelay: `${idx * 60}ms`, opacity: 0 }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 font-bold text-sm">
                        {driver.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">
                        {driver.full_name}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${driver.is_available ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {driver.is_available ? 'Available' : 'On Duty'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(driver)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(driver.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{driver.license_number}</span>
                    {driver.license_expiry && (
                      <span className="text-xs text-gray-400 ml-1">exp: {driver.license_expiry}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {driver.vehicle
                        ? `${driver.vehicle.vehicle_number} (${vehicleTypeLabel(driver.vehicle.vehicle_type)})`
                        : 'No vehicle assigned'}
                    </span>
                  </div>
                  {driver.notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">{driver.notes}</p>
                  )}
                </div>

                {/* Delete confirm inline */}
                {deleteConfirm === driver.id && (
                  <div className="mt-3 pt-3 border-t border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-xs text-red-600 flex-1">Delete this driver?</span>
                    <button onClick={() => handleDelete(driver.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200">No</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              style={{ animation: 'modalIn 0.25s ease-out' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Driver full name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* License */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License No. *</label>
                    <input
                      type="text"
                      value={form.license_number}
                      onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="DL-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={form.license_expiry}
                      onChange={e => setForm(p => ({ ...p, license_expiry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>

                {/* Assigned Vehicle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Vehicle</label>
                  <select
                    value={form.assigned_vehicle_id}
                    onChange={e => setForm(p => ({ ...p, assigned_vehicle_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                  >
                    <option value="">— None —</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} ({vehicleTypeLabel(v.vehicle_type)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
                      className="sr-only peer"
                      disabled={hasActiveAssignment}
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-disabled:opacity-50" />
                  </label>
                  <span className="text-sm text-gray-700">
                    Available for duty {hasActiveAssignment && <span className="text-red-500 ml-1 text-xs italic">(Locked: Currently on duty)</span>}
                  </span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm resize-none"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="px-6 pb-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingDriver ? 'Save Changes' : 'Add Driver'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Animations */}
        <style>{`
          @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes slideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
          @keyframes modalIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        `}</style>
      </DashboardLayout>
    </div>
  );
};

export default DriverManagement;
