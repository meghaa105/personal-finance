'use client';

import { formatCurrency } from '../../utils/formatters';

export default function MetricsGrid({ metrics }) {
  const metricItems = [
    {
      title: 'Total Spending',
      value: formatCurrency(metrics.totalSpending),
      color: 'text-red-600 dark:text-red-400',
      id: 'totalSpending'
    },
    {
      title: 'Total Income',
      value: formatCurrency(metrics.totalIncome),
      color: 'text-green-600 dark:text-green-400',
      id: 'totalIncome'
    },
    {
      title: 'Avg Daily Expense',
      value: formatCurrency(metrics.avgDailyExpense),
      color: 'text-blue-600 dark:text-blue-400',
      id: 'avgDailyExpense'
    },
    {
      title: 'Most Expensive Day',
      value: metrics.maxExpenseDay && metrics.maxExpenseDay !== 'None' ? new Date(metrics.maxExpenseDay).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit'}) : 'N/A',
      color: 'text-purple-600 dark:text-purple-400',
      id: 'maxExpenseDay'
    },
    {
      title: 'Savings Rate',
      value: `${metrics.monthlySavingsRate ? metrics.monthlySavingsRate.toFixed(1) : '0.0'}%`,
      color: metrics.monthlySavingsRate >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-500 dark:text-red-400',
      id: 'monthlySavingsRate'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg mb-6 sm:mb-8">
      {metricItems.map(item => (
        <div key={item.id} className="metric-card bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 flex flex-col justify-between">
          <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300 truncate">{item.title}</h4>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold ${item.color} mt-1 sm:mt-2 truncate`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}