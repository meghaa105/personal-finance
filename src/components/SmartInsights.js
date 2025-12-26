'use client';

import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { HiLightningBolt, HiExclamationTriangle, HiTrendingUp, HiTrendingDown } from 'react-icons/hi2';

export default function SmartInsights({ transactions, categories }) {
  const insights = useMemo(() => {
    const list = [];
    if (!transactions.length) return list;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Spending Trend Analysis (This week vs Last week)
    const thisWeekExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const lastWeekExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (lastWeekExpenses > 0) {
      const diff = thisWeekExpenses - lastWeekExpenses;
      const percent = Math.abs((diff / lastWeekExpenses) * 100).toFixed(0);
      
      if (diff > 0 && percent > 10) {
        list.push({
          id: 'trend-up',
          type: 'warning',
          icon: <HiTrendingUp className="text-red-500" />,
          title: 'Spending Spike',
          message: `You've spent ${percent}% more this week compared to last week (${formatCurrency(thisWeekExpenses)} vs ${formatCurrency(lastWeekExpenses)}).`
        });
      } else if (diff < 0 && percent > 10) {
        list.push({
          id: 'trend-down',
          type: 'success',
          icon: <HiTrendingDown className="text-green-500" />,
          title: 'Great Progress!',
          message: `Your spending is down ${percent}% compared to last week. Keep it up!`
        });
      }
    }

    // 2. Budget Predictions
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    categories.forEach(cat => {
      if (cat.id === 'income' || !cat.budget) return;

      const catExpenses = transactions
        .filter(t => t.category === cat.id && t.type === 'expense' && 
                new Date(t.date).getMonth() === currentMonth && 
                new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const usagePercent = (catExpenses / cat.budget) * 100;
      
      // If used more than 80% and we are early in the month
      if (usagePercent > 80 && usagePercent < 100 && dayOfMonth < daysInMonth * 0.75) {
        list.push({
          id: `budget-warn-${cat.id}`,
          type: 'warning',
          icon: <HiExclamationTriangle className="text-yellow-500" />,
          title: `${cat.label} Alert`,
          message: `You've used ${usagePercent.toFixed(0)}% of your ${cat.label} budget with ${daysInMonth - dayOfMonth} days left in the month.`
        });
      } else if (usagePercent >= 100) {
        list.push({
          id: `budget-exceeded-${cat.id}`,
          type: 'danger',
          icon: <HiExclamationTriangle className="text-red-500" />,
          title: 'Budget Exceeded',
          message: `You've exceeded your ${cat.label} budget by ${formatCurrency(catExpenses - cat.budget)}.`
        });
      }

      // Prediction: likely to exceed
      const dailyAverage = catExpenses / dayOfMonth;
      const projectedTotal = dailyAverage * daysInMonth;
      if (projectedTotal > cat.budget && usagePercent < 80) {
        list.push({
          id: `prediction-${cat.id}`,
          type: 'info',
          icon: <HiLightningBolt className="text-blue-500" />,
          title: 'Smart Prediction',
          message: `At your current spending rate, you're likely to exceed your ${cat.label} budget by the end of the month.`
        });
      }
    });

    return list;
  }, [transactions, categories]);

  if (insights.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <HiLightningBolt className="text-primary text-xl" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Smart Insights</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <div 
            key={insight.id}
            className={`flex items-start gap-4 p-4 rounded-xl border bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md
              ${insight.type === 'warning' ? 'border-yellow-200 dark:border-yellow-900/50' : 
                insight.type === 'danger' ? 'border-red-200 dark:border-red-900/50' :
                insight.type === 'success' ? 'border-green-200 dark:border-green-900/50' :
                'border-blue-200 dark:border-blue-900/50'}`}
          >
            <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xl shrink-0`}>
              {insight.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                {insight.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {insight.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
