'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

export default function ChartGrid({ chartData, filters: analyticsFilters }) {
  const router = useRouter();
  const isDarkMode = useMemo(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false; // Default to light mode if window is not available (SSR)
  }, []); // Re-evaluate if needed, or pass theme context

  const getLabelColor = () => isDarkMode ? '#e5e7eb' : '#374151';
  const getGridColor = () => isDarkMode ? '#4b5563' : '#d1d5db'; // Adjusted grid color for better visibility

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const label = categoryChartData.labels[index];
        // Extract just the category ID/slug if it's formatted as "Icon Label"
        const categoryId = label.includes(' ') ? label.split(' ').slice(1).join(' ').toLowerCase() : label.toLowerCase();
        
        // Calculate dates based on analytics filters
        const now = new Date();
        let startDate = '';
        let endDate = '';

        switch (analyticsFilters?.timePeriod) {
          case 'current_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
            break;
          case 'current_quarter':
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
            endDate = new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().split('T')[0];
            break;
          case 'current_year':
            startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            break;
          case 'custom':
            startDate = analyticsFilters.customStartDate ? new Date(analyticsFilters.customStartDate).toISOString().split('T')[0] : '';
            endDate = analyticsFilters.customEndDate ? new Date(analyticsFilters.customEndDate).toISOString().split('T')[0] : '';
            break;
        }

        const queryParams = new URLSearchParams({
          category: categoryId,
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        });

        router.push(`/transactions?${queryParams.toString()}`);
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: getLabelColor(),
          padding: 15,
          boxWidth: 12,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        titleColor: getLabelColor(),
        bodyColor: getLabelColor(),
        borderColor: getGridColor(),
        borderWidth: 1
      }
    }
  }), [isDarkMode]);

  const barChartOptions = useMemo(() => ({
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
          color: getLabelColor(),
          font: { size: 10 }
        },
        grid: {
          color: getGridColor()
        }
      },
      x: {
        ticks: {
          color: getLabelColor(),
          font: { size: 10 }
        },
        grid: {
          color: getGridColor()
        }
      }
    }
  }), [chartOptions, isDarkMode]);

  const categoryChartData = useMemo(() => ({
    labels: chartData?.categoryDistribution?.labels || [],
    datasets: [{
      data: chartData?.categoryDistribution?.data || [],
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
        '#FFCD56', '#C9CBCF', '#3FC23F', '#F7464A', '#46BFBD', '#FDB45C'
      ],
      hoverOffset: 4
    }]
  }), [chartData?.categoryDistribution]);

  const monthlyTrendsData = useMemo(() => ({
    labels: chartData?.monthlyTrends?.labels || [],
    datasets: [
      {
        label: 'Income',
        data: chartData?.monthlyTrends?.income || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)'
      },
      {
        label: 'Expenses',
        data: chartData?.monthlyTrends?.expenses || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(255, 99, 132, 0.8)'
      }
    ]
  }), [chartData?.monthlyTrends]);

  const paymentMethodsData = useMemo(() => ({
    labels: chartData?.paymentMethods?.labels || [], // Changed from transactionSources
    datasets: [{
      data: chartData?.paymentMethods?.data || [], // Changed from transactionSources
      backgroundColor: [
        '#FFB3BA', '#BAE1FF', '#FFFFBA', '#BAFFC9', '#E0BBE4', '#FFDFBA',
        '#F49AC2', '#A0E7E5', '#B4F8C8', '#FBE7C6', '#D291BC', '#A1C9F4'
      ],
      hoverOffset: 4
    }]
  }), [chartData?.paymentMethods]); // Changed from transactionSources

  const renderChart = (title, type, data, options, colSpan = 'lg:col-span-1') => (
    <div className={`chart-card bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 md:p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors duration-300 col-span-1 ${colSpan}`}>
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 sm:mb-4 text-center sm:text-left">{title}</h3>
      <div className="h-64 sm:h-72 md:h-80">
        {data?.datasets[0]?.data?.length > 0 ? (
          type === 'pie' ? <Pie data={data} options={options} /> : <Bar data={data} options={options} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center mt-8 text-sm sm:text-base">No data available</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="charts-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
      {renderChart('Spending by Category', 'pie', categoryChartData, chartOptions)}
      {renderChart('Spending by Payment Method', 'pie', paymentMethodsData, chartOptions)} {/* Changed title and data source */}
      {renderChart('Monthly Income vs Expenses', 'bar', monthlyTrendsData, barChartOptions, 'lg:col-span-2')}
    </div>
  );
}