'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
// import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import { useTheme } from '../contexts/ThemeContext';
import Transaction from './Transaction';
import BudgetProgress from './BudgetProgress';
import SmartInsights from './SmartInsights';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { theme } = useTheme();
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryData, setCategoryData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgb(255, 99, 132)',   // Red
        'rgb(54, 162, 235)',    // Blue
        'rgb(255, 206, 86)',    // Yellow
        'rgb(75, 192, 192)',    // Teal
        'rgb(153, 102, 255)',   // Purple
        'rgb(255, 159, 64)',    // Orange
        'rgb(76, 175, 80)',     // Green
        'rgb(233, 30, 99)',     // Pink
        'rgb(156, 39, 176)',    // Deep Purple
      ],
      borderColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(233, 30, 99, 0.8)',
        'rgba(156, 39, 176, 0.8)',
      ],
      borderWidth: 1
    }]
  });

  useEffect(() => {
    // Calculate summary data
    const calculatedSummary = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        acc.income += amount;
        acc.balance += amount;
      } else if (transaction.type === 'expense') {
        acc.expenses += amount;
        acc.balance -= amount;
      }
      return acc;
    }, { balance: 0, income: 0, expenses: 0 });

    setSummary(calculatedSummary);

    // Get recent transactions (top 10)
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    setRecentTransactions(recent);

    // Calculate category totals for pie chart
    const categoryTotals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        const category = categories.find(cat => cat.id === transaction.category) || categories.find(cat => cat.id === 'other');
        const categoryLabel = category ? category.label : 'Other';
        acc[categoryLabel] = (acc[categoryLabel] || 0) + parseFloat(transaction.amount);
      }
      return acc;
    }, {});

    // Update pie chart data with theme-based colors
    setCategoryData({
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: theme === 'dark' ? [
          'rgba(255, 99, 132, 0.8)',   // Red
          'rgba(54, 162, 235, 0.8)',    // Blue
          'rgba(255, 206, 86, 0.8)',    // Yellow
          'rgba(75, 192, 192, 0.8)',    // Teal
          'rgba(153, 102, 255, 0.8)',   // Purple
          'rgba(255, 159, 64, 0.8)',    // Orange
          'rgba(76, 175, 80, 0.8)',     // Green
          'rgba(233, 30, 99, 0.8)',     // Pink
          'rgba(156, 39, 176, 0.8)',    // Deep Purple
        ] : [
          'rgb(255, 99, 132)',   // Red
          'rgb(54, 162, 235)',    // Blue
          'rgb(255, 206, 86)',    // Yellow
          'rgb(75, 192, 192)',    // Teal
          'rgb(153, 102, 255)',   // Purple
          'rgb(255, 159, 64)',    // Orange
          'rgb(76, 175, 80)',     // Green
          'rgb(233, 30, 99)',     // Pink
          'rgb(156, 39, 176)',    // Deep Purple
        ],
        borderColor: theme === 'dark' ? [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(76, 175, 80, 1)',
          'rgba(233, 30, 99, 1)',
          'rgba(156, 39, 176, 1)',
        ] : [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(233, 30, 99, 0.8)',
          'rgba(156, 39, 176, 0.8)',
        ],
        borderWidth: theme === 'dark' ? 2 : 1
      }]
    });
  }, [transactions, categories, theme]); // Added theme to dependency array

  return (
    <div className="dashboard">
      <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="card bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 dark:text-gray-300">Total Balance</h3>
          <p className="total-balance text-2xl sm:text-3xl font-bold text-primary mt-1 sm:mt-2">
            {formatCurrency(summary.balance)}
          </p>
        </div>

        <div className="card bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 dark:text-gray-300">Income</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">
            {formatCurrency(summary.income)}
          </p>
        </div>

        <div className="card bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="text-md sm:text-lg font-semibold text-gray-700 dark:text-gray-300">Expenses</h3>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 sm:p-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 text-center">Top Expense Categories</h2>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg">
          {categoryData.labels.length > 0 ? (
            <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 h-[15rem] sm:h-[25rem] mx-auto py-2 sm:py-4 flex justify-center">
              <Doughnut
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // Allow chart to resize
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 10, // Add padding to legend items
                        boxWidth: 12, // Adjust legend box width
                        font: {
                          size: 10 // Adjust legend font size for smaller screens
                        }
                      }
                    }
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expense data available</p>
          )}
        </div>
      </div>

      <BudgetProgress
        transactions={transactions}
        categories={categories}
      />

      <SmartInsights 
        transactions={transactions}
        categories={categories}
      />

      <div className="mt-6 sm:mt-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4">Recent Transactions</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
          {recentTransactions.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {recentTransactions.map((transaction) => (
                <Transaction key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transactions available</p>
          )}
        </div>
      </div>
    </div>
  );
}