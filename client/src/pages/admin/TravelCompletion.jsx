import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { supabase } from '../../services/supabase';
import { formatDate } from '../../utils/helpers';
import { createNotification } from '../../services/requestService';
import { CheckCircle2, Search, X, Calculator, DollarSign, Truck, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const TravelCompletion = () => {

  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [completing, setCompleting] = useState(false);

  const [formData, setFormData] = useState({
    opening_meter: '',
    closing_meter: '',
    rate_per_km: '',
    trip_type: 'official'
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transport_requests')
        .select('*, user:users!transport_requests_user_id_fkey(full_name, email)')
        .in('current_status', ['vehicle_assigned', 'travel_completed'])
        .order('date_of_visit', { ascending: true });

      if (error) throw error;

      // Fetch vehicle details separately for each request
      const requestsWithVehicles = await Promise.all(
        (data || []).map(async (request) => {
          if (request.vehicle_id) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('vehicle_number, id')
              .eq('id', request.vehicle_id)
              .single();

            return { ...request, vehicle: vehicleData };
          }
          return { ...request, vehicle: null };
        })
      );

      setRequests(requestsWithVehicles);
    } catch (err) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const [requestAttachments, setRequestAttachments] = useState([]);

  const handleCompleteClick = async (request) => {
    setSelectedRequest(request);
    setFormData({
      opening_meter: request.opening_meter || '',
      closing_meter: request.closing_meter || '',
      rate_per_km: request.rate_per_km || '',
      trip_type: request.trip_type || 'official'
    });

    // Fetch attachments for this request
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('request_id', request.id);

      if (!error) setRequestAttachments(data || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    }

    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDistance = () => {
    const opening = parseFloat(formData.opening_meter) || 0;
    const closing = parseFloat(formData.closing_meter) || 0;
    return Math.max(0, closing - opening);
  };

  const calculateAmount = () => {
    const distance = calculateDistance();
    const rate = parseFloat(formData.rate_per_km) || 0;
    return distance * rate;
  };

  const parseDriverLog = (purpose) => {
    if (!purpose || !purpose.includes('--- [DRIVER LOG] ---')) return {};

    const logSection = purpose.split('--- [DRIVER LOG] ---')[1];
    const fuelMatch = logSection.match(/Fuel:\s*([\d.]+L)/);
    const tollMatch = logSection.match(/Tolls\/Parking:\s*₹?([\d.]+)/);
    const remarkMatch = logSection.match(/Driver Remarks:\s*([\s\S]+)/);

    return {
      fuel: fuelMatch ? fuelMatch[1] : null,
      tolls: tollMatch ? tollMatch[1] : null,
      remarks: remarkMatch ? remarkMatch[1].trim() : null
    };
  };

  const validateForm = () => {
    if (!formData.opening_meter || !formData.closing_meter || !formData.rate_per_km) {
      toast.error('Please fill in all required fields');
      return false;
    }

    const opening = parseFloat(formData.opening_meter);
    const closing = parseFloat(formData.closing_meter);
    const rate = parseFloat(formData.rate_per_km);

    if (closing < opening) {
      toast.error('Closing meter cannot be less than opening meter');
      return false;
    }

    if (rate < 0) {
      toast.error('Rate per KM cannot be negative');
      return false;
    }

    return true;
  };

  const handleCompleteTrip = async () => {
    if (!validateForm()) return;

    setCompleting(true);
    try {
      const distance = calculateDistance();
      const amount = calculateAmount();

      // Update request with completion details
      const { error: updateError } = await supabase
        .from('transport_requests')
        .update({
          opening_meter: parseInt(formData.opening_meter),
          closing_meter: parseInt(formData.closing_meter),
          total_distance: distance,
          rate_per_km: parseFloat(formData.rate_per_km),
          total_amount: amount,
          trip_type: formData.trip_type,
          current_status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      // Create approval record for travel completion
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([{
          request_id: selectedRequest.id,
          approver_id: user.id,
          approver_role: 'admin',
          action: 'travel_completed',
          comment: `Distance: ${distance} km, Total Amount: ₹${amount}`,
          approved_at: new Date().toISOString(),
        }]);

      if (approvalError) console.error('Error recording completion:', approvalError);

      // Notify the requester
      await createNotification({
        user_id: selectedRequest.user_id,
        title: 'Travel Completed',
        message: `Your transport trip (${selectedRequest.request_number}) has been marked as completed. Distance: ${distance} km.`,
        type: 'info',
        related_request_id: selectedRequest.id
      });

      // Mark vehicle as available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.vehicle_id);

      if (vehicleError) throw vehicleError;

      // Mark driver as available if registered
      if (selectedRequest.driver_id) {
        const { error: driverError } = await supabase
          .from('drivers')
          .update({
            is_available: true,
            assigned_vehicle_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRequest.driver_id);

        if (driverError) throw driverError;
      }

      toast.success('Trip completed successfully! Vehicle and Driver are now available.');

      // Notify the driver that the trip is completed
      try {
        let targetDriverUid = null;

        if (selectedRequest.driver_id) {
          // Route 1: driver_id exists — lookup from drivers table
          const { data: dData } = await supabase.from('drivers').select('id, full_name, phone, user_id').eq('id', selectedRequest.driver_id).maybeSingle();
          if (dData) {
            targetDriverUid = dData.user_id;
            if (!targetDriverUid) {
              const { data: ud } = await supabase.from('users').select('id').eq('role', 'driver')
                .or(`phone.eq.${dData.phone || ''},full_name.ilike.%${dData.full_name || ''}%`).maybeSingle();
              targetDriverUid = ud?.id;
            }
          }
        }

        // Route 2: No driver_id — search by driver_name/driver_contact on the request
        if (!targetDriverUid && (selectedRequest.driver_name || selectedRequest.driver_contact)) {
          const filters = [];
          if (selectedRequest.driver_contact) filters.push(`phone.eq.${selectedRequest.driver_contact}`);
          if (selectedRequest.driver_name) filters.push(`full_name.ilike.%${selectedRequest.driver_name}%`);

          if (filters.length > 0) {
            const { data: ud } = await supabase.from('users').select('id').eq('role', 'driver')
              .or(filters.join(',')).maybeSingle();
            targetDriverUid = ud?.id;
          }
        }

        if (targetDriverUid) {
          await supabase.from('notifications').insert([{
            user_id: targetDriverUid,
            title: 'Trip Completed',
            message: `Your trip to ${selectedRequest.place_of_visit} on ${selectedRequest.date_of_visit} has been marked as completed by admin.`,
            type: 'completed',
            related_request_id: selectedRequest.id,
          }]);
        }
      } catch (notifyErr) {
      }

      setShowModal(false);
      fetchRequests(); // Refresh list
    } catch (err) {
      toast.error(`Failed to complete trip: ${err.message}`);
    } finally {
      setCompleting(false);
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
            <CheckCircle2 className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-gray-900">Travel Completion</h1>
          </div>
          <p className="text-gray-600">Complete trips and make vehicles available for new assignments</p>
        </div>

        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
            <input type="text" placeholder="Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
            <p className="text-gray-500">No trips awaiting completion</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Destination</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req, i) => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors" style={{ animation: 'slideRight 0.4s ease-out', animationDelay: `${i * 50}ms`, opacity: 0, animationFillMode: 'forwards' }}>
                    <td className="px-6 py-4 font-semibold text-blue-600">{req.request_number}</td>
                    <td className="px-6 py-4 text-gray-900">{req.user?.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{req.vehicle?.vehicle_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(req.date_of_visit)}</td>
                    <td className="px-6 py-4 text-gray-900">{req.place_of_visit}</td>
                    <td className="px-6 py-4">
                      {req.current_status === 'travel_completed' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          Finished by Driver
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          In Progress
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="primary" size="sm" onClick={() => handleCompleteClick(req)}>Complete Trip</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardLayout>

      {/* Completion Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Complete Trip</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">Request: {selectedRequest.request_number}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip Details */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900 border-b pb-2">Trip Info</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="text-gray-500">User:</span> <p className="font-medium">{selectedRequest.user?.full_name}</p></div>
                    <div><span className="text-gray-500">Vehicle:</span> <p className="font-medium">{selectedRequest.vehicle?.vehicle_number}</p></div>
                    <div><span className="text-gray-500">Destination:</span> <p className="font-medium">{selectedRequest.place_of_visit}</p></div>
                  </div>
                </div>
                <div className="space-y-4 border-l pl-4">
                  <h3 className="font-bold text-blue-900 border-b border-blue-100 pb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Driver's Log
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {(() => {
                      const logs = parseDriverLog(selectedRequest.purpose);
                      const hasLogs = logs.fuel || logs.tolls || logs.remarks;

                      if (!hasLogs && !selectedRequest.fuel_consumed && !selectedRequest.tolls_parking && !selectedRequest.driver_remarks) {
                        return <p className="text-xs text-gray-400 italic">No extra logs provided by driver</p>;
                      }

                      return (
                        <>
                          {(logs.fuel || selectedRequest.fuel_consumed) && (
                            <div><span className="text-gray-500">Fuel:</span> <p className="font-bold text-blue-700">{logs.fuel || (selectedRequest.fuel_consumed + 'L')}</p></div>
                          )}
                          {(logs.tolls || selectedRequest.tolls_parking) && (
                            <div><span className="text-gray-500">Tolls/Parking:</span> <p className="font-bold text-blue-700">₹{logs.tolls || selectedRequest.tolls_parking}</p></div>
                          )}
                          {(logs.remarks || selectedRequest.driver_remarks) && (
                            <div className="col-span-full bg-blue-50 p-2 rounded-lg border border-blue-100 mt-1">
                              <span className="text-[10px] uppercase font-black text-blue-400">Driver Remarks:</span>
                              <p className="text-xs italic text-blue-900 mt-1">"{logs.remarks || selectedRequest.driver_remarks}"</p>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Completion Attachments (Receipts) */}
                    {requestAttachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-100">
                        <p className="text-[10px] uppercase font-black text-blue-400 mb-2">Attachments & Proofs:</p>
                        <div className="flex flex-wrap gap-2">
                          {requestAttachments.map((file) => (
                            <a
                              key={file.id}
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden hover:border-blue-500 transition-all"
                            >
                              {['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(file.file_type?.toLowerCase()) ? (
                                <img src={file.file_url} alt="Receipt" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Search className="w-4 h-4" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Meter Reading (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="opening_meter"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    value={formData.opening_meter}
                    onChange={handleInputChange}
                    placeholder="e.g., 12000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Meter Reading (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="closing_meter"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    value={formData.closing_meter}
                    onChange={handleInputChange}
                    placeholder="e.g., 12250"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Distance Display */}
                {formData.opening_meter && formData.closing_meter && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        Total Distance: {calculateDistance()} km
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate per KM (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="rate_per_km"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    value={formData.rate_per_km}
                    onChange={handleInputChange}
                    placeholder="e.g., 12.50"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Amount Display */}
                {formData.opening_meter && formData.closing_meter && formData.rate_per_km && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        Total Amount: ₹{calculateAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="trip_type"
                    value={formData.trip_type}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="official">Official</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={completing}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTrip}
                disabled={completing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {completing ? (
                  <>
                    <Loader size="sm" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete Trip</span>
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

export default TravelCompletion;