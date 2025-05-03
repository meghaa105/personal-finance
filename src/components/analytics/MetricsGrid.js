'use client';

import { formatCurrency } from '../../utils/formatters';

export default function MetricsGrid({ metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg">
      <div className="metric-card bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700">Total Spending</h4>
        <p className="text-3xl font-bold text-red-600 mt-2">
          {formatCurrency(metrics.totalSpending)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700">Total Income</h4>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {formatCurrency(metrics.totalIncome)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700">Average Daily Expense</h4>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          {formatCurrency(metrics.avgDailyExpense)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700">Most Expensive Day</h4>
        <p className="text-3xl font-bold text-purple-600 mt-2">
          {new Date(metrics.maxExpenseDay).toLocaleDateString()}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-4 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors duration-300">
        <h4 className="text-lg font-semibold text-gray-700">Monthly Savings Rate</h4>
        <p className="text-3xl font-bold text-indigo-600 mt-2">
          {metrics.monthlySavingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}