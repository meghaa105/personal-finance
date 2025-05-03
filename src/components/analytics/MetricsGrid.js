'use client';

import { formatCurrency } from '../../utils/formatters';

export default function MetricsGrid({ metrics }) {
  return (
    <div className="metrics-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="metric-card bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700">Total Spending</h4>
        <p className="text-3xl font-bold text-red-600 mt-2">
          {formatCurrency(metrics.totalSpending)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700">Total Income</h4>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {formatCurrency(metrics.totalIncome)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700">Average Daily Expense</h4>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          {formatCurrency(metrics.avgDailyExpense)}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700">Most Expensive Day</h4>
        <p className="text-3xl font-bold text-purple-600 mt-2">
          {new Date(metrics.maxExpenseDay).toLocaleDateString()}
        </p>
      </div>

      <div className="metric-card bg-white rounded-lg p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-gray-700">Monthly Savings Rate</h4>
        <p className="text-3xl font-bold text-indigo-600 mt-2">
          {metrics.monthlySavingsRate.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}