'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
// import { format } from 'date-fns';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import Transaction from './Transaction';
import BudgetProgress from './BudgetProgress';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
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
        '#FFB6C1',  // Light pink
        '#87CEEB',  // Sky blue
        '#F0E68C',  // Khaki
        '#98FB98',  // Pale green
        '#DDA0DD',  // Plum
        '#FFE4B5',  // Moccasin
        '#B0E0E6',  // Powder blue
        '#F5DEB3',  // Wheat
        '#E6E6FA',  // Lavender
      ],
      borderColor: [
        '#FF99B0',  // Darker Light pink
        '#6CB6D9',  // Darker Sky blue
        '#D6CC6E',  // Darker Khaki
        '#7AD97A',  // Darker Pale green
        '#C682C6',  // Darker Plum
        '#E6CC97',  // Darker Moccasin
        '#92C8D9',  // Darker Powder blue
        '#D7C095',  // Darker Wheat
        '#C8C8DC',  // Darker Lavender
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

    // Update pie chart data
    setCategoryData({
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: [
          '#FFB6C1',  // Light pink
          '#87CEEB',  // Sky blue
          '#F0E68C',  // Khaki
          '#98FB98',  // Pale green
          '#DDA0DD',  // Plum
          '#FFE4B5',  // Moccasin
          '#B0E0E6',  // Powder blue
          '#F5DEB3',  // Wheat
          '#E6E6FA',  // Lavender
        ],
        borderColor: [
          '#FF99B0',  // Darker Light pink
          '#6CB6D9',  // Darker Sky blue
          '#D6CC6E',  // Darker Khaki
          '#7AD97A',  // Darker Pale green
          '#C682C6',  // Darker Plum
          '#E6CC97',  // Darker Moccasin
          '#92C8D9',  // Darker Powder blue
          '#D7C095',  // Darker Wheat
          '#C8C8DC',  // Darker Lavender
        ],
        borderWidth: 1
      }]
    });
  }, [transactions, categories]);

  return (
    <div className="dashboard pt-2">
      <div className="summary-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="card bg-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Balance</h3>
          <p className="total-balance text-3xl font-bold text-primary mt-2">
            {formatCurrency(summary.balance)}
          </p>
        </div>

        <div className="card bg-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Income</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(summary.income)}
          </p>
        </div>

        <div className="card bg-gray-100 border border-gray-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Expenses</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {formatCurrency(summary.expenses)}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-lg shadow-sm bg-gray-100 border border-gray-300 p-2">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Top Expense Categories</h2>
        <div className="bg-gray-50 rounded-lg">
          {categoryData.labels.length > 0 ? (
            <div className="w-1/3 h-[25rem] mx-auto py-4 flex justify-center">
              <Doughnut
                data={categoryData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    }
                  },
                }}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No expense data available</p>
          )}
        </div>
      </div>

      <BudgetProgress
        transactions={transactions}
        categories={categories}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <Transaction key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No transactions available</p>
          )}
        </div>
      </div>
    </div>
  );
}