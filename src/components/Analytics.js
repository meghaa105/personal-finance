'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import LoadingSpinner from './LoadingSpinner';
import AnalyticsFilters from './analytics/AnalyticsFilters';
import MetricsGrid from './analytics/MetricsGrid';
import ChartGrid from './analytics/ChartGrid';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Analytics() {
  // comment the transaction structure for your reference
  // const transactions = [
  //   {
  //     id: 1,
  //     date: '2023-08-20',
  //     category: 'Food',
  //     amount: 20.5,
  //     type: 'expense',
  //     source: 'manual'
  //   }
  // ]
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
          if (amount > (acc.maxExpenseAmount || 0)) {
            acc.maxExpenseAmount = amount;
            acc.maxExpenseDay = transaction.date;
          }
        } else {
          acc.totalIncome += amount;
        }
        return acc;
      }, { totalSpending: 0, totalIncome: 0, maxExpenseAmount: 0, maxExpenseDay: 'None' });

      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const avgDailyExpense = monthlyMetrics.totalSpending / daysDiff;
      const monthlySavingsRate = monthlyMetrics.totalIncome > 0
        ? ((monthlyMetrics.totalIncome - monthlyMetrics.totalSpending) / monthlyMetrics.totalIncome) * 100
        : 0;

      setMetrics({
        ...monthlyMetrics,
        avgDailyExpense,
        monthlySavingsRate
      });

      // Process chart data
      const categoryData = filteredTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense' && transaction.category) {
          const category = categories.find(cat => cat.id === transaction.category);
          const categoryLabel = category ? `${category.icon} ${category.label}` : transaction.category;
          acc[categoryLabel] = (acc[categoryLabel] || 0) + parseFloat(transaction.amount);
        }
        return acc;
      }, {});

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

      const sourceData = filteredTransactions.reduce((acc, transaction) => {
        if (transaction.type === 'expense') {
          const source = ["csv", "pdf", "splitwise"].includes(transaction.source) ? transaction.source : 'manual';
          acc[source] = (acc[source] || 0) + parseFloat(transaction.amount);
        }
        return acc;
      }, {});

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
        transactionSources: {
          labels: Object.keys(sourceData),
          data: Object.values(sourceData)
        }
      });
    } catch (error) {
      console.error('Error in loadAnalyticsData:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    try {
      loadAnalyticsData();
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [transactions, filters, categories]);

  if (error) {
    return <div className="text-center p-4 text-red-600 dark:text-red-400">{error}</div>;
  }

  if (isLoading) {
    return <div className="text-center p-4 dark:text-gray-100"><LoadingSpinner /></div>;
  }

  return (
    <div className="analytics-container p-6 space-y-8 bg-gray-50 dark:bg-gray-900">
      <AnalyticsFilters
        filters={filters}
        setFilters={setFilters}
        categories={categories}
      />
      <MetricsGrid metrics={metrics} />
      <ChartGrid chartData={chartData} />
    </div>
  );
}