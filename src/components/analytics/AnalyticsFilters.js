'use client';

import MultiSelect from '../MultiSelect';

export default function AnalyticsFilters({ filters, setFilters, categories, showCustomDatePicker, setShowCustomDatePicker }) {
  return (
    <div className="filters-section bg-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Time Period Filter */}
        <div className="filter-group bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
          <div className="flex flex-col space-y-2">
            <select
              className="form-select rounded-md border border-gray-500 focus:border-indigo-500 focus:ring-indigo-500 w-full p-1 cursor-pointer"
              value={filters.timePeriod}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, timePeriod: e.target.value }));
                setShowCustomDatePicker(e.target.value === 'custom');
              }}
            >
              <option value="current_month">Current Month</option>
              <option value="current_quarter">Current Quarter</option>
              <option value="current_year">Current Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="filter-group bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <MultiSelect
            options={categories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.label}` }))}
            onChange={(selected) => setFilters(prev => ({ ...prev, categories: selected.map(s => s.value) }))}
            prompt="Select categories"
            defaultValues={categories.map(cat => cat.id)}
          />
        </div>

        {/* Transaction Source Filter */}
        <div className="filter-group bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Source</label>
          <MultiSelect
            options={[
              { id: 'manual', label: 'Manual' },
              { id: 'csv', label: 'Bank Statement CSV Import' },
              { id: 'pdf', label: 'Credit Card PDF Import' },
              { id: 'splitwise', label: 'Splitwise Import' }
            ]}
            onChange={(selected) => setFilters(prev => ({ ...prev, transactionSources: selected.map(s => s.id) }))}
            prompt="Select sources"
            defaultValues={['manual', 'csv', 'pdf', 'splitwise']}
          />
        </div>
      </div>
    </div>
  );
}