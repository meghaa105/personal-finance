'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function BudgetProgress({ 
  transactions,
  categories,
}) {
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);

  useEffect(() => {
    setFilteredTransactions(transactions);
    onFilter();
  }, [transactions]);

  const onFilter = (date) => {
    const filterDate = date ?? endDate;

    if (!filterDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const end = new Date(filterDate);
    end.setHours(23, 59, 59, 999); // Include the entire end date

    const start = new Date(end.getFullYear(), end.getMonth(), 1); // First day of the month

    const filtered = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });

    setFilteredTransactions(filtered);
  };

  const onClear = () => {
    const today = new Date().toISOString().split('T')[0];
    setEndDate(today);
    onFilter(today);
  };

  return (
    <div className="mt-8 rounded-lg shadow-sm bg-gray-100 border border-gray-300 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Budget Progress</h2>
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Month End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={() => onFilter(endDate)}
          className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/90 transition-colors duration-200 transform hover:scale-105"
        >
          Apply
        </button>
        <button
          onClick={onClear}
          className="bg-gray-500 text-white px-4 py-1 rounded hover:bg-gray-600 transition-colors duration-200 transform hover:scale-105"
        >
          Clear
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[50vh]">
        {categories
          .map(category => {
            const spent = filteredTransactions
              .filter(t => t.category === category.id)
              .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const progress = (spent / category.budget) * 100;
            const progressColor = progress > 100 ? 'bg-red-500' : 'bg-primary';
            
            return (
              <div key={category.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <h3 className="font-medium">{category.label}</h3>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(spent)} / {formatCurrency(category.budget)}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-300`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}