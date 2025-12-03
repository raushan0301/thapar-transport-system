import React from 'react';
import { Filter, X } from 'lucide-react';

const FilterBar = ({ filters, onFilterChange, onClearFilters }) => {
    const handleChange = (filterName, value) => {
        onFilterChange({ ...filters, [filterName]: value });
    };

    const hasActiveFilters = Object.values(filters).some(
        value => value && value !== 'all' && value !== ''
    );

    return (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                        <X className="w-4 h-4" />
                        <span>Clear All</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Role Filter */}
                {filters.hasOwnProperty('role') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            value={filters.role || 'all'}
                            onChange={(e) => handleChange('role', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Roles</option>
                            <option value="head">Head</option>
                            <option value="admin">Admin</option>
                            <option value="director">Director</option>
                            <option value="dean">Dean</option>
                            <option value="deputy_director">Deputy Director</option>
                            <option value="registrar">Registrar</option>
                        </select>
                    </div>
                )}

                {/* Action Filter */}
                {filters.hasOwnProperty('action') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action
                        </label>
                        <select
                            value={filters.action || 'all'}
                            onChange={(e) => handleChange('action', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Actions</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                )}

                {/* Date Range Filter */}
                {filters.hasOwnProperty('dateRange') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                        </label>
                        <select
                            value={filters.dateRange || 'all'}
                            onChange={(e) => handleChange('dateRange', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Time</option>
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                        </select>
                    </div>
                )}

                {/* Status Filter (for other pages) */}
                {filters.hasOwnProperty('status') && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || 'all'}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending_head">Pending Head</option>
                            <option value="pending_admin">Pending Admin</option>
                            <option value="pending_authority">Pending Authority</option>
                            <option value="pending_vehicle">Pending Vehicle</option>
                            <option value="vehicle_assigned">Vehicle Assigned</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FilterBar;
