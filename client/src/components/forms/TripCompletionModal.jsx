/* eslint-disable */
import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, Calculator, Fuel, DollarSign, X, PenBox, Calculator as CalculatorIcon 
} from 'lucide-react';
import FileUpload from './FileUpload';
import toast from 'react-hot-toast';

const TripCompletionModal = ({ trip, onClose, onFinish, actionLoading }) => {
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [formData, setFormData] = useState({
        opening_meter: trip.opening_meter || '',
        closing_meter: trip.closing_meter || '',
        fuel_consumed: trip.fuel_consumed || '',
        tolls_parking: trip.tolls_parking || '',
        remarks: trip.driver_remarks || '',
        trip_type: trip.trip_type || 'official'
    });

    const handleInp = (e) => {
        const { name, value } = e.target;
        setFormData(v => ({ ...v, [name]: value }));
    };

    const handleFileComplete = (fileData) => {
      if (fileData) setUploadedFiles(prev => [...prev, fileData]);
      setUploading(false);
    };

    const handleFileRemove = (idx) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const dist = Math.max(0, (parseFloat(formData.closing_meter) || 0) - (parseFloat(formData.opening_meter) || 0));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.opening_meter || !formData.closing_meter) {
            toast.error('Please fill meter readings');
            return;
        }
        if (parseFloat(formData.closing_meter) <= parseFloat(formData.opening_meter)) {
            toast.error('End meter must be greater than start meter');
            return;
        }
        onFinish({
            ...formData,
            total_distance: dist,
            attachments: uploadedFiles 
        });
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[95vh] flex flex-col animate-slideUp">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <PenBox className="w-6 h-6 text-white" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Complete Trip Details</h2>
                            <p className="text-[10px] text-blue-100 uppercase font-bold tracking-widest mt-0.5">Request: {trip.request_number}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Trip Summary Card */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Destination</p>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{trip.place_of_visit}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Vehicle</p>
                            <p className="text-sm font-bold text-gray-900">{trip.vehicle_number || 'Official Vehicle'}</p>
                        </div>
                    </div>

                    {/* Meter Readings */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             Meter Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 ml-1">Opening Meter (KM)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="number" name="opening_meter" value={formData.opening_meter} onChange={handleInp} required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="Start KM"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 ml-1">Closing Meter (KM)</label>
                                <div className="relative">
                                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="number" name="closing_meter" value={formData.closing_meter} onChange={handleInp} required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="End KM"
                                    />
                                </div>
                            </div>
                        </div>

                        {dist > 0 && (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalculatorIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-bold text-blue-800">Total Distance Traveled</span>
                                </div>
                                <span className="text-xl font-black text-blue-600">{dist} <span className="text-xs">KM</span></span>
                            </div>
                        )}
                    </div>

                    {/* Operational Costs */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             Fuel & Charges
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 ml-1">Fuel Consumed (Ltrs)</label>
                                <div className="relative">
                                    <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="number" name="fuel_consumed" value={formData.fuel_consumed} onChange={handleInp}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-700 ml-1">Tolls / Parking (₹)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="number" name="tolls_parking" value={formData.tolls_parking} onChange={handleInp}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Receipts Upload */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                             Receipts / Proofs (Optional)
                        </h3>
                        <FileUpload 
                          onUploadStart={() => setUploading(true)}
                          onUploadComplete={handleFileComplete}
                          onRemove={handleFileRemove}
                          uploadedFiles={uploadedFiles}
                          disabled={actionLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 ml-1">Trip Type</label>
                        <select 
                            name="trip_type" 
                            value={formData.trip_type} 
                            onChange={handleInp}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer appearance-none"
                        >
                            <option value="official">Official Trip</option>
                            <option value="private">Private / Paid Trip</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 ml-1">Additional Remarks</label>
                        <textarea 
                            name="remarks" value={formData.remarks} onChange={handleInp} rows="3"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none resize-none"
                            placeholder="Any incidents, delay or specific details..."
                        ></textarea>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex items-center gap-3">
                    <button 
                        type="button" onClick={onClose} 
                        className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSubmit} disabled={!!actionLoading || uploading}
                        className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {actionLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                        {actionLoading ? 'SUBMITTING...' : uploading ? 'UPLOADING...' : 'COMPLETE & SUBMIT'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TripCompletionModal;
