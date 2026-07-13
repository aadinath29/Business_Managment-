import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Select } from '../UI/Select';

export function BranchFilters({ filters, onFilterChange }) {
  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Under Maintenance', value: 'Under Maintenance' },
    { label: 'Temporarily Closed', value: 'Temporarily Closed' },
    { label: 'Merged', value: 'Merged' }
  ];

  const cityOptions = [
    { label: 'All Locations', value: '' },
    { label: 'Mumbai', value: 'Mumbai' },
    { label: 'Pune', value: 'Pune' },
    { label: 'Nagpur', value: 'Nagpur' },
    { label: 'Nashik', value: 'Nashik' },
    { label: 'New Delhi', value: 'New Delhi' }
  ];

  const performanceOptions = [
    { label: 'All Performance Tiers', value: '' },
    { label: 'Excellent (>= 90%)', value: 'excellent' },
    { label: 'Good (70% - 89%)', value: 'good' },
    { label: 'Needs Attention (40% - 69%)', value: 'average' },
    { label: 'Critical (< 40%)', value: 'poor' }
  ];

  const handleReset = () => {
    onFilterChange({
      search: '',
      status: '',
      city: '',
      performance: ''
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.city || filters.performance;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
        <Filter className="w-4 h-4 text-blue-500" />
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Advanced Filters</h3>
        {hasActiveFilters && (
          <button 
            onClick={handleReset}
            className="ml-auto text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Search Branch / Manager
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </span>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g. Mumbai Corporate"
            />
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            City Location
          </label>
          <select
            value={filters.city}
            onChange={(e) => onFilterChange({ city: e.target.value })}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {cityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Operational Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Performance Dropdown */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Performance Level
          </label>
          <select
            value={filters.performance}
            onChange={(e) => onFilterChange({ performance: e.target.value })}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {performanceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
