import React, { useState, useEffect } from 'react';
import Select from '../common/Select';
import Input from '../common/Input';
import { getPredefinedHeads } from '../../services/requestService';
import toast from 'react-hot-toast';

const HeadSelector = ({ value, onChange, error }) => {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headType, setHeadType] = useState('predefined');
  const [customEmail, setCustomEmail] = useState('');

  useEffect(() => {
    fetchHeads();
  }, []);

  const fetchHeads = async () => {
    setLoading(true);
    const { data, error } = await getPredefinedHeads();
    if (error) {
      toast.error('Failed to load heads');
    } else {
      setHeads(data || []);
    }
    setLoading(false);
  };

  const headOptions = heads.map((head) => ({
    value: head.user.id,
    label: `${head.user.full_name} - ${head.user.department || 'N/A'}`,
  }));

  const handleHeadTypeChange = (type) => {
    setHeadType(type);
    if (type === 'predefined') {
      setCustomEmail('');
      onChange({ head_id: '', custom_head_email: '', head_type: 'predefined' });
    } else {
      onChange({ head_id: '', custom_head_email: '', head_type: 'custom' });
    }
  };

  const handlePredefinedHeadChange = (e) => {
    const headId = e.target.value;
    onChange({ head_id: headId, custom_head_email: '', head_type: 'predefined' });
  };

  const handleCustomEmailChange = (e) => {
    const email = e.target.value;
    setCustomEmail(email);
    onChange({ head_id: '', custom_head_email: email, head_type: 'custom' });
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Head <span className="text-red-500">*</span>
      </label>

      {/* Head Type Selector */}
      <div className="flex gap-4 mb-3">
        <label className="flex items-center">
          <input
            type="radio"
            name="headType"
            value="predefined"
            checked={headType === 'predefined'}
            onChange={() => handleHeadTypeChange('predefined')}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Predefined Head</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="headType"
            value="custom"
            checked={headType === 'custom'}
            onChange={() => handleHeadTypeChange('custom')}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Custom Email</span>
        </label>
      </div>

      {/* Predefined Head Dropdown */}
      {headType === 'predefined' && (
        <Select
          name="head_id"
          value={value.head_id || ''}
          onChange={handlePredefinedHeadChange}
          options={headOptions}
          placeholder={loading ? 'Loading heads...' : 'Select a head'}
          error={error}
          disabled={loading}
        />
      )}

      {/* Custom Email Input */}
      {headType === 'custom' && (
        <Input
          type="email"
          name="custom_head_email"
          value={customEmail}
          onChange={handleCustomEmailChange}
          placeholder="Enter head's email address"
          error={error}
        />
      )}

      {headType === 'custom' && (
        <p className="text-xs text-gray-500 mt-1">
          Note: Admin will need to create an account for this head before approval.
        </p>
      )}
    </div>
  );
};

export default HeadSelector;