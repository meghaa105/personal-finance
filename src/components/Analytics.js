'use client';

import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatters';
import { useTransactions } from '../contexts/TransactionContext';
import LoadingSpinner from './LoadingSpinner';
import { useCategories } from '../contexts/CategoryContext';
import MultiSelect from './MultiSelect';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Analytics() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const [metrics, setMetrics] = useState({
    totalSpending: 0,
    totalIncome: 0,
    avgDailyExpense: 0,
    maxExpenseDay: 'None',
    monthlySavingsRate: 0
  });

  const [filters, setFilters] = useState({
    timePeriod: 'current_month',
    customStartDate: null,
    customEndDate: null,
    categories: categories.map(cat => cat.id),
    transactionSources: ['manual', 'csv', 'pdf', 'splitwise']
  });

  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const [chartData, setChartData] = useState({
    categoryDistribution: { labels: [], data: [] },
    monthlyTrends: { labels: [], income: [], expenses: [] },
    paymentMethods: { labels: [], data: [] }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalyticsData = () => {
    try {
      if (!Array.isArray(transactions)) {
        throw new Error('Transactions data is not properly initialized');
      }

      if (transactions.length === 0) {
        console.log('No transactions available');
        return;
      }

      console.log('Loading analytics data...');
      // Calculate metrics
      const now = new Date();
      let startDate, endDate;

      // Set date range based on selected time period
      switch (filters.timePeriod) {
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'current_quarter':
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterMonth, 1);
          endDate = new Date(now.getFullYear(), quarterMonth + 3, 0);
          break;
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        case 'custom':
          startDate = filters.customStartDate ? new Date(filters.customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = filters.customEndDate ? new Date(filters.customEndDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      // Filter transactions based on selected criteria
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate >= startDate &&
          transactionDate <= endDate &&
          filters.categories.includes(transaction.category) &&
          filters.transactionSources.includes(["csv", "pdf", "splitwise"].includes(transaction.source) ? transaction.source : 'manual')
        );
      });

      const monthlyMetrics = filteredTransactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'expense') {
          acc.totalSpending += amount;
          // Track max expense day
          if (amount > (acc.maxExpenseAmount || 0)) {
            acc.maxExpenseAmount = amount;
            acc.maxExpenseDay = transaction.date;
          }
        } else {
          acc.totalIncome += amount;
        }
        return acc;
      }, { totalSpending: 0, totalIncome: 0, maxExpenseAmount: 0, maxExpenseDay: 'None' });

      // Calculate average daily expense
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const avgDailyExpense = monthlyMetrics.totalSpending / daysDiff;

      // Calculate savings rate
      const monthlySavingsRate = monthlyMetrics.totalIncome > 0
        ? ((monthlyMetrics.totalIncome - monthlyMetrics.totalSpending) / monthlyMetrics.totalIncome) * 100
        : 0;

      setMetrics({
        ...monthlyMetrics,
        avgDailyExpense,
        monthlySavingsRate
      });

      // Process chart data
      // Category Distribution
      const categoryData = filteredTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense' && transaction.categoryId) {
          const category = categories.find(cat => cat.id === transaction.categoryId);
          const categoryLabel = category ? `${category.icon} ${category.label}` : transaction.categoryId;
          acc[categoryLabel] = (acc[categoryLabel] || 0) + parseFloat(transaction.amount);
        }
        return acc;
      }, {});

      // Monthly Trends - Last 6 months or within selected date range
      const monthlyData = filteredTransactions.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });

        if (!acc[monthYear]) {
          acc[monthYear] = { income: 0, expenses: 0 };
        }

        const amount = parseFloat(transaction.amount);
        if (transaction.type === 'income') {
          acc[monthYear].income += amount;
        } else {
          acc[monthYear].expenses += amount;
        }
        return acc;
      }, {});

      // Payment Methods
      const paymentData = filteredTransactions.reduce((acc, transaction) => {
        if (transaction.paymentMethod) {
          acc[transaction.paymentMethod] = (acc[transaction.paymentMethod] || 0) + parseFloat(transaction.amount);
        }
        return acc;
      }, {});

      // Sort monthly data chronologically
      const sortedMonthlyLabels = Object.keys(monthlyData).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
      });

      setChartData({
        categoryDistribution: {
          labels: Object.keys(categoryData),
          data: Object.values(categoryData)
        },
        monthlyTrends: {
          labels: sortedMonthlyLabels,
          income: sortedMonthlyLabels.map(month => monthlyData[month].income),
          expenses: sortedMonthlyLabels.map(month => monthlyData[month].expenses)
        },
        paymentMethods: {
          labels: Object.keys(paymentData),
          data: Object.values(paymentData)
        }
      });
    } catch (error) {
      console.error('Error in loadAnalyticsData:', error);
      setError(error.message);
    }
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  }), []);

  const barChartOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  }), [chartOptions]);

  const categoryChartData = useMemo(() => ({
    labels: chartData.categoryDistribution.labels,
    datasets: [{
      data: chartData.categoryDistribution.data,
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40'
      ]
    }]
  }), [chartData.categoryDistribution.labels, chartData.categoryDistribution.data]);

  const monthlyTrendsData = useMemo(() => ({
    labels: chartData.monthlyTrends.labels,
    datasets: [
      {
        label: 'Income',
        data: chartData.monthlyTrends.income,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'Expenses',
        data: chartData.monthlyTrends.expenses,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ]
  }), [chartData.monthlyTrends.labels, chartData.monthlyTrends.income, chartData.monthlyTrends.expenses]);

  const paymentMethodsData = useMemo(() => ({
    labels: chartData.paymentMethods.labels,
    datasets: [{
      data: chartData.paymentMethods.data,
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0'
      ]
    }]
  }), [chartData.paymentMethods.labels, chartData.paymentMethods.data]);

  useEffect(() => {
    try {
      console.log('Loading analytics with filters:', filters);
      loadAnalyticsData();
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [transactions, filters, categories]);

  if (error) {
    return <div className="text-center p-4 text-red-600">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4"><LoadingSpinner /></div>;
  }

  return (
    <div className="analytics-container space-y-6">
      {/* Filters Section */}
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

      <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="chart-card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Spending by Category</h3>
          <div className="h-80">
            {chartData.categoryDistribution.data.length > 0 ? (
              <Pie data={categoryChartData} options={chartOptions} />
            ) : (
              <p className="text-gray-500 text-center mt-8">No category data available</p>
            )}
          </div>
        </div>

        <div className="chart-card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Payment Methods</h3>
          <div className="h-80">
            {chartData.paymentMethods.data.length > 0 ? (
              <Pie data={paymentMethodsData} options={chartOptions} />
            ) : (
              <p className="text-gray-500 text-center mt-8">No payment method data available</p>
            )}
          </div>
        </div>

        <div className="chart-card bg-white rounded-lg p-6 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Income vs Expenses</h3>
          <div className="h-80">
            {chartData.monthlyTrends.labels.length > 0 ? (
              <Bar data={monthlyTrendsData} options={barChartOptions} />
            ) : (
              <p className="text-gray-500 text-center mt-8">No monthly trend data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}