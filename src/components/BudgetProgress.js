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
    <div className="mt-8 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Budget Progress</h2>
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Month End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 transform hover:scale-105"
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
            let progressColor;
            if (progress >= 75) {
              progressColor = 'bg-red-500';
            } else if (progress >= 50) {
              progressColor = 'bg-amber-600';
            } else if (progress >= 25) {
              progressColor = 'bg-yellow-500';
            } else {
              progressColor = 'bg-green-500';
            }

            // Section to get the appropriate GIF based on progress percentage
            let progressGif = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZW1udm5zbGc1NmV4NDRxOTY4dGpnbnp1ajZycnJ1NXpkZjZtbGI3cSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7abKhOpu0NwenH3O/giphy.gif';
            if (progress >= 75) {
              // Danger/Overspending GIF
              progressGif = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3djaDNkaWZhbzd4aWplMDQyd3hwNWx1OHYweGtoaDh3ZnY3cG42NCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/kcaDGr9vkTcN6JHw8d/giphy.gif";
            } else if (progress >= 50) {
              // Warning/Caution GIF
              progressGif = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcTVxcjhsb25maGU5Y285ZXFla3VuN29uemR0NGU3azB3NmJjbDc5ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/55itGuoAJiZEEen9gg/giphy.gif";
            } else if (progress >= 25) {
              // Moderate spending GIF
              progressGif = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzJiMjZkNzRlZTRkNDNmMDZiMzA3ZDRiNzA0YzA1YTJlMDRiMDZlZiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/3o6gDWzmAzrpi5DQU8/giphy.gif";
            }

            return (
              <div key={category.id} className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <h3 className="font-medium dark:text-gray-200">{category.label}</h3>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(spent)} / {formatCurrency(category.budget)}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">

                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={progressGif}
                      alt="Budget status"
                      className="w-full h-full object-center rounded"
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {progress?.toFixed(2)}% of the Budget reached!
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden flex-grow">
                      <div
                        className={`h-full ${progressColor} transition-all duration-300`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}