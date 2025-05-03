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
            default: // Default to current month dat
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    }, [filters.timePeriod]);

    const handleDateChange = (type, value) => {
        setDateRange(prev => ({
            ...prev,
            [type]: value
        }));
        setFilters(prev => ({
            ...prev,
            customStartDate: type === 'start'? value : prev.customStartDate,
            customEndDate: type === 'end'? value : prev.customEndDate
        }));
    };

    return (
        <div className="filters-container bg-white rounded-lg p-6 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Time Period Filter */}
                <div className="filter-group bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                    <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_month' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-700 hover:bg-blue-200'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_month' }));
                                }}
                            >
                                Current Month
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_quarter' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-700 hover:bg-green-200'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_quarter' }));
                                }}
                            >
                                Current Quarter
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'current_year' ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-100 text-gray-700 hover:bg-purple-200'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'current_year' }));
                                }}
                            >
                                Current Year
                            </button>
                            <button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer duration-200 transform hover:scale-105 hover:shadow-md ${filters.timePeriod === 'custom' ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-100 text-gray-700 hover:bg-orange-200'}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, timePeriod: 'custom' }));
                                }}
                            >
                                Custom
                            </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => handleDateChange('start', e.target.value)}
                                className={`border rounded px-2 py-1 ${filters.timePeriod !== 'custom' ? 'bg-gray-50' : 'bg-white'}`}
                                disabled={filters.timePeriod !== 'custom'}
                            />
                            <span>to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => handleDateChange('end', e.target.value)}
                                className={`border rounded px-2 py-1 ${filters.timePeriod !== 'custom' ? 'bg-gray-50' : 'bg-white'}`}
                                disabled={filters.timePeriod !== 'custom'}
                            />
                        </div>
                    </div>
                </div>

                {/* Rest of the filters */}
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