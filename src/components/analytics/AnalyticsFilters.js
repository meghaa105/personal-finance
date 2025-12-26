'use client';

import MultiSelect from '../MultiSelect';
import { useState, useEffect } from 'react';

export default function AnalyticsFilters({ filters, setFilters, categories }) {
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        let start, end;
        const today = new Date();

        switch (filters.timePeriod) {
            case 'current_quarter':
                const quarter = Math.floor(today.getMonth() / 3);
                start = new Date(today.getFullYear(), quarter * 3, 1);
                end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
                break;
            case 'current_year':
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
                break;
            case 'current_month':
            case 'custom':
            default: // Default to current month data
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
        }
        // Update internal dateRange state only if it's not a custom period or if custom dates are not yet set
        if (filters.timePeriod !== 'custom' || (!filters.customStartDate && !filters.customEndDate)) {
            setDateRange({
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            });
        } else if (filters.timePeriod === 'custom') {
            // If custom, ensure internal state reflects the filter's custom dates
            setDateRange({
                start: filters.customStartDate || start.toISOString().split('T')[0],
                end: filters.customEndDate || end.toISOString().split('T')[0]
            });
        }
    }, [filters.timePeriod, filters.customStartDate, filters.customEndDate]);

    const handleDateChange = (type, value) => {
        const newDateRange = {
            ...dateRange,
            [type]: value
        };
        setDateRange(newDateRange);
        setFilters(prev => ({
            ...prev,
            customStartDate: newDateRange.start,
            customEndDate: newDateRange.end,
            timePeriod: 'custom' // Switch to custom if dates are manually changed
        }));
    };

    return (
        <div className="filters-container bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 mb-6 sm:mb-8">
            <h3 className="text-md sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">Filters</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Time Period Filter */}
                <div className="filter-group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 sm:p-4 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Period</label>
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            <button
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_month' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-200 dark:hover:bg-blue-600/50'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_month', customStartDate: null, customEndDate: null }));
                                }}
                            >
                                Current Month
                            </button>
                            <button
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_quarter' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-200 dark:hover:bg-green-600/50'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_quarter', customStartDate: null, customEndDate: null }));
                                }}
                            >
                                Current Quarter
                            </button>
                            <button
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_year' ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-200 dark:hover:bg-purple-600/50'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_year', customStartDate: null, customEndDate: null }));
                                }}
                            >
                                Current Year
                            </button>
                            <button
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'custom' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-200 dark:hover:bg-orange-600/50'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'custom' }));
                                }}
                            >
                                Custom
                            </button>
                        </div>
                        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 ${filters.timePeriod !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                                className={`w-full sm:w-auto border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${filters.timePeriod !== 'custom' ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}`}
                                disabled={filters.timePeriod !== 'custom'}
                            />
                            <span className="text-center sm:text-left">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                                className={`w-full sm:w-auto border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${filters.timePeriod !== 'custom' ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}`}
                                disabled={filters.timePeriod !== 'custom'}
                            />
                        </div>
                    </div>
                </div>

                {/* Categories Filter */}
                <div className="filter-group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 sm:p-4 shadow-sm">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
                    <MultiSelect
                        options={categories.map(cat => ({ value: cat.id, label: `${cat.icon} ${cat.label}` }))}
                        onChange={(selected) => setFilters(prev => ({ ...prev, categories: selected.map(s => s.value) }))}
                        prompt="Select categories"
                        defaultValues={categories.map(cat => cat.id)}
                    />
                </div>

                {/* Transaction Source Filter */}
                <div className="filter-group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 sm:p-4 shadow-sm">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transaction Source</label>
                    <MultiSelect
                        options={[
                            { value: 'manual', label: 'Manual Entry' },
                            { value: 'csv', label: 'CSV Import' },
                            { value: 'pdf', label: 'PDF Import' },
                            { value: 'splitwise', label: 'Splitwise Import' }
                        ]}
                        onChange={(selected) => setFilters(prev => ({ ...prev, transactionSources: selected.map(s => s.value) }))}
                        prompt="Select sources"
                        defaultValues={['manual', 'csv', 'pdf', 'splitwise']}
                    />
                </div>
            </div>
        </div>
    );
}