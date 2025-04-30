'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { useTransactions } from '../contexts/TransactionContext';
import { AiOutlinePlus, AiOutlineClose } from 'react-icons/ai';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
  });

  const { transactions: contextTransactions, addTransactions, deleteTransaction } = useTransactions();

  useEffect(() => {
    setTransactions(contextTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, [contextTransactions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount) return;

    const transaction = {
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    };

    // Add transaction using context which handles storage
    addTransactions([transaction]);

    // Reset form
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      date: new Date().toLocaleDateString('en-IN'),
      category: '',
      paymentMethod: 'cash'
    });
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="transactions-container relative">
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 relative animate-[slideUp_0.3s_ease-out]">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Add Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Type *</label>
                <select
                  name="type"
                  value={newTransaction.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category *</label>
                <select
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-[80px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={newTransaction.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="net_banking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setNewTransaction({
                    description: '',
                    amount: '',
                    type: 'expense',
                    date: new Date().toISOString().split('T')[0],
                    category: '',
                    paymentMethod: 'cash'
                  });
                  setShowAddForm(false);
                }}
                className="px-6 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      <div className="filters bg-white rounded-lg p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="utilities">Utilities</option>
            <option value="entertainment">Entertainment</option>
            <option value="others">Others</option>
          </select>
        </div>
      </div>

      <div className="transactions-list bg-white rounded-lg shadow-sm p-4">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found 😢</p>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm">
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-800">{transaction.description}</p>
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                      <span>{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
                      {transaction.category && (
                        <span className="mx-2 px-2 py-1 bg-gray-200 rounded-full">{transaction.category}</span>
                      )}
                      {transaction.paymentMethod && (
                        <span className="px-2 py-1 bg-gray-200 rounded-full">{transaction.paymentMethod}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? <AiOutlineClose size={24} /> : <AiOutlinePlus size={24} />}
      </button>
    </div>
  );
}