'use client';

import { formatCurrency } from '../../utils/formatters';

export default function MetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
      <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Spending</h4>
        <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
          {formatCurrency(metrics.totalSpending)}
        </p>
      </div>

      <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Total Income</h4>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
          {formatCurrency(metrics.totalIncome)}
        </p>
      </div>

      <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Average Daily Expense</h4>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
          {formatCurrency(metrics.avgDailyExpense)}
        </p>
      </div>

      <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Most Expensive Day</h4>
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
          {new Date(metrics.maxExpenseDay).toLocaleDateString()}
        </p>
      </div>

      <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Monthly Savings Rate</h4>
        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
          {metrics.monthlySavingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}