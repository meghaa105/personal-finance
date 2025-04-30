'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    totalSpending: 0,
    totalIncome: 0,
    avgDailyExpense: 0,
    maxExpenseDay: 'None',
    monthlySavingsRate: 0
  });

  const [chartData, setChartData] = useState({
    categoryDistribution: { labels: [], data: [] },
    monthlyTrends: { labels: [], income: [], expenses: [] },
    paymentMethods: { labels: [], data: [] }
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Calculate metrics
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const metrics = transactions.reduce((acc, transaction) => {
      const amount = transaction.amount;
      const date = new Date(transaction.date);
      
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

    // Calculate average daily expense and savings rate
    const daysInMonth = monthEnd.getDate();
    metrics.avgDailyExpense = metrics.totalSpending / daysInMonth;
    metrics.monthlySavingsRate = metrics.totalIncome > 0 
      ? ((metrics.totalIncome - metrics.totalSpending) / metrics.totalIncome) * 100
      : 0;

    setMetrics(metrics);

    // Process chart data
    // Category Distribution
    const categoryData = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense' && transaction.category) {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    // Monthly Trends
    const monthlyData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!acc[monthYear]) {
        acc[monthYear] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[monthYear].income += transaction.amount;
      } else {
        acc[monthYear].expenses += transaction.amount;
      }
      
      return acc;
    }, {});

    // Payment Methods
    const paymentData = transactions.reduce((acc, transaction) => {
      if (transaction.paymentMethod) {
        acc[transaction.paymentMethod] = (acc[transaction.paymentMethod] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    setChartData({
      categoryDistribution: {
        labels: Object.keys(categoryData),
        data: Object.values(categoryData)
      },
      monthlyTrends: {
        labels: Object.keys(monthlyData),
        income: Object.values(monthlyData).map(m => m.income),
        expenses: Object.values(monthlyData).map(m => m.expenses)
      },
      paymentMethods: {
        labels: Object.keys(paymentData),
        data: Object.values(paymentData)
      }
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value)
        }
      }
    }
  };

  const categoryChartData = {
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
  };

  const monthlyTrendsData = {
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
  };

  const paymentMethodsData = {
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
  };

  return (
    <div className="analytics-container space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Analytics</h2>

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