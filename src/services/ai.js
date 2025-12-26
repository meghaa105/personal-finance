/**
 * AI Service for Personal Finance Assistant
 * Provides rule-based analysis and suggestions based on transaction data.
 */

export const analyzeRequest = async (query, transactions, categories) => {
  const lowerQuery = query.toLowerCase();

  // Artificial delay to simulate "thinking"
  await new Promise(resolve => setTimeout(resolve, 600));

  try {
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi ')) {
      return {
        text: "Hello! I'm your personal finance assistant. Ask me about your spending, budget, or for some saving tips!",
        type: 'text'
      };
    }

    // Check habits first to avoid "spending habits" falling into "spend"
    if (lowerQuery.includes('habit') || lowerQuery.includes('trend')) {
      return handleHabitsQuery(transactions, categories);
    }

    if (lowerQuery.includes('suggestion') || lowerQuery.includes('tip') || lowerQuery.includes('advice')) {
      return handleSuggestionsQuery(transactions, categories);
    }

    if (lowerQuery.includes('spend') || lowerQuery.includes('spent') || lowerQuery.includes('cost')) {
      return handleSpendingQuery(lowerQuery, transactions, categories);
    }

    return {
      text: "I'm not sure I understand. Try asking 'How much did I spend on food?' or 'Give me a saving tip'.",
      type: 'text'
    };
  } catch (error) {
    console.error('AI Error:', error);
    return {
      text: "I encountered an error analyzing your data. Please try again.",
      type: 'text'
    };
  }
};

const handleSpendingQuery = (query, transactions, categories) => {
  // Check for specific categories
  const matchedCategory = categories.find(c =>
    query.includes(c.label.toLowerCase()) ||
    query.includes(c.id.toLowerCase())
  );

  if (matchedCategory) {
    const total = transactions
      .filter(t => t.category === matchedCategory.id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      text: `You have spent a total of ₹${total.toLocaleString()} on ${matchedCategory.label}.`,
      type: 'text'
    };
  }

  // Total spending
  const total = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    text: `Your total spending across all categories is ₹${total.toLocaleString()}.`,
    type: 'text'
  };
};

const handleHabitsQuery = (transactions, categories) => {
  // Find top spending category
  const expensesByCategory = {};
  let totalExpense = 0;

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
      totalExpense += Number(t.amount);
    });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length === 0) {
    return { text: "You don't have enough transaction data for me to analyze your habits yet.", type: 'text' };
  }

  const topCategory = categories.find(c => c.id === sortedCategories[0][0]) || { label: 'Unknown' };
  const topAmount = sortedCategories[0][1];
  const percentage = totalExpense > 0 ? Math.round((topAmount / totalExpense) * 100) : 0;

  return {
    text: `Your biggest spending habit is **${topCategory.label}** with ₹${topAmount.toLocaleString()} spent.
           This accounts for ${percentage}% of your total expenses.`,
    type: 'text'
  };
};

const handleSuggestionsQuery = (transactions, categories) => {
  const suggestions = [
    "Try using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.",
    "Review your subscription services. Cancel any you haven't used in the last month.",
    "Cooking at home can save you significantly compared to dining out.",
    "Set a specific budget for your top spending category to reduce expenses.",
    "Track your daily expenses immediately to stay aware of your spending flow."
  ];

  // Tailored suggestion based on data
  const expensesByCategory = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
  });

  const foodSpend = (expensesByCategory['food_dining'] || 0) + (expensesByCategory['groceries'] || 0);
  const totalSpend = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);

  if (totalSpend > 0 && (foodSpend / totalSpend) > 0.4) {
    return {
      text: `I noticed you spend ${Math.round((foodSpend / totalSpend) * 100)}% of your income on food. You might want to try meal prepping to save some money!`,
      type: 'text'
    };
  }

  return {
    text: suggestions[Math.floor(Math.random() * suggestions.length)],
    type: 'text'
  };
};
