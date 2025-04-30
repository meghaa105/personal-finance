'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savings: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const loadDashboardData = () => {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
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
      }, { balance: 0, income: 0, expenses: 0, savings: 0 });

      // Calculate savings
      calculatedSummary.savings = calculatedSummary.income - calculatedSummary.expenses;
      setSummary(calculatedSummary);

      // Get recent transactions (last 5)
      const recent = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      setRecentTransactions(recent);
    };

    loadDashboardData();

    // Add event listener for storage changes
    window.addEventListener('storage', loadDashboardData);
    return () => window.removeEventListener('storage', loadDashboardData);
  }, []);

  return (
    <div className="dashboard">
      <div className="summary-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Balance</h3>
          <p className="total-balance text-3xl font-bold text-primary mt-2">
            {formatCurrency(summary.balance)}
          </p>
        </div>

        <div className="card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Income</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(summary.income)}
          </p>
        </div>

        <div className="card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Expenses</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {formatCurrency(summary.expenses)}
          </p>
        </div>

        <div className="card bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Savings</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {formatCurrency(summary.savings)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                  <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
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