/* eslint-disable */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';

import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { createNotification } from '../../services/requestService';
import { Truck, Search, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const VehicleAssignment = () => {
  
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch requests awaiting vehicle assignment
      // Note: Both 'pending_vehicle' and 'approved_awaiting_vehicle' indicate awaiting vehicle
      const { data: requestsData, error: requestsError } = await supabase
        .from('transport_requests')
        .select('*, user:users!transport_requests_user_id_fkey(full_name, email)')
        .in('current_status', ['pending_vehicle', 'approved_awaiting_vehicle'])
        .order('submitted_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch approvals for these requests to determine who approved
      if (requestsData && requestsData.length > 0) {
        const requestIds = requestsData.map(r => r.id);
        const { data: approvalsData } = await supabase
          .from('approvals')
          .select('request_id, approver_role, action, comment')
          .in('request_id', requestIds)
          .eq('action', 'approved');

        // Add approval info to requests
        requestsData.forEach(request => {
          const approval = approvalsData?.find(a => a.request_id === request.id && a.action === 'approved');
          if (approval) {
            request.approved_by = approval.approver_role;
            // Check if it was routed to authority from comment
            if (approval.comment && approval.comment.includes('Routed to')) {
              const match = approval.comment.match(/Routed to (\w+)/);
              if (match) {
                request.approved_by = match[1];
              }
            }
          }
        });
      }

      // Fetch available drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_available', true)
        .order('full_name', { ascending: true });

      if (driversError && driversError.code !== '42P01' && driversError.code !== 'PGRST205') {
        // Ignore table missing errors
        throw driversError;
      }

      // Fetch available vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_available', true)
        .order('vehicle_number', { ascending: true });

      if (vehiclesError && vehiclesError.code !== '42P01' && vehiclesError.code !== 'PGRST205') {
        throw vehiclesError;
      }

      setRequests(requestsData || []);
      setVehicles(vehiclesData || []);
      setDrivers(driversData || []);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (request) => {
    setSelectedRequest(request);
    setSelectedVehicle('');
    setSelectedDriver('');
    setShowModal(true);
  };

  const handleAssignVehicle = async () => {
    if (!selectedVehicle) {
      toast.error('Please select a vehicle');
      return;
    }
    
    setAssigning(true);
    try {
      // Get driver details
      let finalDriverId = null;
      let finalDriverName = '';
      let finalDriverPhone = '';

      if (selectedDriver) {
        const d = drivers.find(d => d.id === selectedDriver);
        if (d) {
            finalDriverId = d.id;
            finalDriverName = d.full_name;
            finalDriverPhone = d.phone;
        }
      } else {
        finalDriverName = driverName;
        finalDriverPhone = driverPhone;
      }

      if (!finalDriverName) {
          toast.error('Please select or enter a driver');
          return;
      }

      // Update request with vehicle and driver details
      const updatePayload = {
        vehicle_id: selectedVehicle,
        driver_id: finalDriverId,
        driver_name: finalDriverName,
        driver_contact: finalDriverPhone,
        current_status: 'vehicle_assigned',
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('transport_requests')
        .update(updatePayload)
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Auto-link driver record to user_id if missing
      if (finalDriverId) {
          const d = drivers.find(drv => drv.id === finalDriverId);
          if (d && !d.user_id) {
              // Try to find the user account for this driver
              const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'driver')
                .or(`phone.eq.${finalDriverPhone},full_name.ilike.${finalDriverName}`)
                .maybeSingle();
              
              if (userData) {
                  await supabase.from('drivers').update({ user_id: userData.id }).eq('id', finalDriverId);
              }
          }
      }

      // Create approval record for vehicle assignment
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: selectedRequest.id,
          approver_id: user.id,
          approver_role: 'admin',
          action: 'vehicle_assigned',
          comment: `Vehicle ID: ${selectedVehicle}, Driver: ${finalDriverName}`,
          approved_at: new Date().toISOString(),
        }]);

      if (approvalError) console.error('Error recording assignment:', approvalError);

      // Update vehicle to mark as unavailable
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedVehicle);

      if (vehicleError) throw vehicleError;
      
      // Update driver to mark as unavailable in DB if it's a registered driver
      if (finalDriverId) {
          const { error: driverError } = await supabase
            .from('drivers')
            .update({
              is_available: false,
              assigned_vehicle_id: selectedVehicle,
              updated_at: new Date().toISOString()
            })
            .eq('id', finalDriverId);
            
          if (driverError) throw driverError;
      }

      // Notify the requester
      await createNotification({
          user_id: selectedRequest.user_id,
          title: 'Vehicle Assigned',
          message: `A vehicle (${vehicles.find(v => v.id === selectedVehicle)?.vehicle_number}) has been assigned to your request. Driver: ${finalDriverName} (${finalDriverPhone})`,
          type: 'info',
          related_request_id: selectedRequest.id
      });

      // Notify the driver (if they have a user account)
      if (finalDriverId) {
          // Find the user account for this driver to send notification
          const { data: driverUser } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'driver')
            .or(`phone.eq.${finalDriverPhone},full_name.ilike.${finalDriverName}`)
            .maybeSingle();

          if (driverUser) {
              const requesterInfo = `${selectedRequest.user?.full_name || 'N/A'} from ${selectedRequest.user?.department || 'N/A'} (Contact: ${selectedRequest.user?.phone || 'N/A'})`;
              
              await createNotification({
                  user_id: driverUser.id,
                  title: 'New Trip Assigned',
                  message: `You have been assigned a new trip to ${selectedRequest.place_of_visit} on ${formatDate(selectedRequest.date_of_visit)}. Requester: ${requesterInfo}`,
                  type: 'vehicle_assigned',
                  related_request_id: selectedRequest.id
              });
          }
      }

      toast.success('Vehicle assigned successfully!');
      setShowModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(`Failed to assign vehicle: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader size="lg" /></div></DashboardLayout>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="mb-8 animate-slideDown">
          <div className="flex items-center space-x-3 mb-2">
            <Truck className="w-8 h-8 text-green-600" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-gray-900">Vehicle Assignment</h1>
          </div>
          <p className="text-gray-600">Assign vehicles to approved transport requests</p>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500">No requests awaiting vehicle assignment</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Destination</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Persons</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Approved By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-green-600">{req.request_number}</td>
                    <td className="px-6 py-4 text-gray-900">{req.user?.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(req.date_of_visit)}</td>
                    <td className="px-6 py-4 text-gray-900">{req.place_of_visit}</td>
                    <td className="px-6 py-4 text-gray-600">{req.number_of_persons}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {req.approved_by ? req.approved_by.toUpperCase() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="primary" size="sm" onClick={() => handleAssignClick(req)}>Assign Vehicle</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardLayout>

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Assign Vehicle</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Request: {selectedRequest?.request_number}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Request Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">User:</span>
                    <span className="ml-2 font-medium">{selectedRequest?.user?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedRequest?.date_of_visit)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Destination:</span>
                    <span className="ml-2 font-medium">{selectedRequest?.place_of_visit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Persons:</span>
                    <span className="ml-2 font-medium">{selectedRequest?.number_of_persons}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle <span className="text-red-500">*</span>
                </label>
                {vehicles.length === 0 ? (
                  <p className="text-red-500 text-sm">No available vehicles</p>
                ) : (
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- Select a vehicle --</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicle_number} - {vehicle.vehicle_type} (Capacity: {vehicle.capacity})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Driver Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver Assignment <span className="text-red-500">*</span>
                </label>
                
                {drivers.length > 0 ? (
                  <div className="space-y-4">
                    <select
                      value={selectedDriver}
                      onChange={(e) => {
                        setSelectedDriver(e.target.value);
                        if (e.target.value === 'manual') {
                            setDriverName('');
                            setDriverPhone('');
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Select a registered driver --</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name} ({driver.phone})
                        </option>
                      ))}
                      <option value="manual">+ Enter manual driver details</option>
                    </select>

                    {(selectedDriver === 'manual' || !selectedDriver) && (
                      <div className="grid grid-cols-2 gap-4 animate-slideDown">
                        <input
                          type="text"
                          placeholder="Driver Name"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Driver Name"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={assigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignVehicle}
                disabled={assigning || !selectedVehicle || (!selectedDriver && !driverName) || (selectedDriver === 'manual' && !driverName)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {assigning ? (
                  <>
                    <Loader size="sm" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Assign Vehicle</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default VehicleAssignment;