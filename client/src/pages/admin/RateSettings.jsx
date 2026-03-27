import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { supabase } from '../../services/supabase';
import { DollarSign, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const RateSettings = () => {
  const [rates, setRates] = useState({
    per_km_rate: '',
    base_rate: '',
    night_charge: '',
    waiting_charge_per_hour: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [settingsId, setSettingsId] = useState(null);

  // Fetch existing rate settings on mount
  useEffect(() => {
    fetchRateSettings();
  }, []);

  const fetchRateSettings = async () => {
    try {
      setFetchLoading(true);

      // Fetch rate settings from database
      const { data, error } = await supabase
        .from('rate_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116' && error.code !== '42P01' && error.code !== 'PGRST205') { 
        throw error;
      }

      if (data) {
        setRates({
          per_km_rate: data.per_km_rate?.toString() || '10',
          base_rate: data.base_rate?.toString() || '500',
          night_charge: data.night_charge?.toString() || '200',
          waiting_charge_per_hour: data.waiting_charge_per_hour?.toString() || '100',
        });
        setSettingsId(data.id);
      } else {
        // No settings exist, use defaults
        setRates({
          per_km_rate: '10',
          base_rate: '500',
          night_charge: '200',
          waiting_charge_per_hour: '100',
        });
      }
    } catch (err) {
      console.error('Error fetching rate settings:', err);
      toast.error('Failed to load rate settings');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRates(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const rateData = {
        per_km_rate: parseFloat(rates.per_km_rate) || 0,
        base_rate: parseFloat(rates.base_rate) || 0,
        night_charge: parseFloat(rates.night_charge) || 0,
        waiting_charge_per_hour: parseFloat(rates.waiting_charge_per_hour) || 0,
        updated_at: new Date().toISOString(),
      };

      let error;

      if (settingsId) {
        // Update existing settings
        const result = await supabase
          .from('rate_settings')
          .update(rateData)
          .eq('id', settingsId);
        error = result.error;
      } else {
        // Insert new settings
        const result = await supabase
          .from('rate_settings')
          .insert([{ ...rateData, created_at: new Date().toISOString() }])
          .select()
          .single();

        error = result.error;
        if (!error && result.data) {
          setSettingsId(result.data.id);
        }
      }

      if (error) throw error;

      toast.success('Rate settings saved successfully!');
      setHasChanges(false);

      // Refresh to confirm save
      await fetchRateSettings();
    } catch (err) {
      console.error('Error saving rate settings:', err);
      toast.error('Failed to save rate settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchRateSettings();
    setHasChanges(false);
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <DashboardLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </DashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-slideDown">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" strokeWidth={1.5} />
                  <h1 className="text-4xl font-bold text-gray-900">Rate Settings</h1>
                </div>
                <p className="text-gray-600">Configure transport rates and charges</p>
                {hasChanges && (
                  <p className="text-sm text-amber-600 mt-2">● Unsaved changes</p>
                )}
              </div>
              <Button
                variant="ghost"
                icon={RefreshCw}
                onClick={fetchRateSettings}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '100ms', opacity: 0, animationFillMode: 'forwards' }}>
            <div className="space-y-6">
              <Input
                label="Per Kilometer Rate (₹)"
                type="number"
                name="per_km_rate"
                value={rates.per_km_rate}
                onChange={handleChange}
                placeholder="10"
                min="0"
                step="0.01"
                leftIcon={DollarSign}
                helperText="Rate charged per kilometer traveled"
              />

              <Input
                label="Base Rate (₹)"
                type="number"
                name="base_rate"
                value={rates.base_rate}
                onChange={handleChange}
                placeholder="500"
                min="0"
                step="0.01"
                leftIcon={DollarSign}
                helperText="Minimum charge for any trip"
              />

              <Input
                label="Night Charge (₹)"
                type="number"
                name="night_charge"
                value={rates.night_charge}
                onChange={handleChange}
                placeholder="200"
                min="0"
                step="0.01"
                leftIcon={DollarSign}
                helperText="Additional charge for night trips (10 PM - 6 AM)"
              />

              <Input
                label="Waiting Charge per Hour (₹)"
                type="number"
                name="waiting_charge_per_hour"
                value={rates.waiting_charge_per_hour}
                onChange={handleChange}
                placeholder="100"
                min="0"
                step="0.01"
                leftIcon={DollarSign}
                helperText="Charge per hour for waiting time"
              />
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={handleCancel}
                disabled={!hasChanges || loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                loading={loading}
                disabled={!hasChanges}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '200ms', opacity: 0, animationFillMode: 'forwards' }}>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes to rate settings will apply to all new transport requests. Existing requests will retain their original rates.
            </p>
          </div>

          {/* Current Rates Summary */}
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6" style={{ animation: 'slideUp 0.6s ease-out', animationDelay: '300ms', opacity: 0, animationFillMode: 'forwards' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Rates Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Per KM</p>
                <p className="text-2xl font-bold text-green-600">₹{rates.per_km_rate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="text-2xl font-bold text-green-600">₹{rates.base_rate}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Night Charge</p>
                <p className="text-2xl font-bold text-green-600">₹{rates.night_charge}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Waiting/Hour</p>
                <p className="text-2xl font-bold text-green-600">₹{rates.waiting_charge_per_hour}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RateSettings;