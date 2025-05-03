'use client';

import { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

export default function ChartGrid({ chartData }) {
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      }
    }
  }), []);

  const barChartOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
        }
      },
      x: {
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        },
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
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

  const transactionSourcesData = useMemo(() => ({
    labels: chartData.transactionSources.labels,
    datasets: [{
      data: chartData.transactionSources.data,
      backgroundColor: [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0'
      ]
    }]
  }), [chartData.transactionSources.labels, chartData.transactionSources.data]);

  return (
    <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
      <div className="chart-card bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 col-span-2 lg:col-span-1">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Spending by Category</h3>
        <div className="h-80">
          {chartData.categoryDistribution.data.length > 0 ? (
            <Pie data={categoryChartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-8">No category data available</p>
          )}
        </div>
      </div>

      <div className="chart-card bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 col-span-2 lg:col-span-1">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Spending by Source</h3>
        <div className="h-80">
          {chartData.transactionSources.data.length > 0 ? (
            <Pie data={transactionSourcesData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-8">No source data available</p>
          )}
        </div>
      </div>

      <div className="chart-card bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 col-span-2">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Income vs Expenses</h3>
        <div className="h-80">
          {chartData.monthlyTrends.labels.length > 0 ? (
            <Bar data={monthlyTrendsData} options={barChartOptions} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-8">No monthly trend data available</p>
          )}
        </div>
      </div>
    </div>
  );
}