'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';
import { AiOutlinePlus, AiOutlineClose, AiOutlineFilter } from 'react-icons/ai';
import FilterModal from './FilterModal';
import Transaction from './Transaction';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { categories } = useCategories();
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'food',
    source: 'cash',
    date: new Date().toISOString().split('T')[0],
  });

  const { transactions: contextTransactions, addTransactions, deleteTransaction, updateTransaction } = useTransactions();
  console.log({contextTransactions})

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

    if (isEditing) {
      updateTransaction(transaction.id, transaction);
    } else {
      addTransactions([transaction]);
    }

    // Reset form
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      category: 'food',
      source: 'cash'
    });
    setShowAddForm(false);
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    deleteTransaction(id);
  };

  const handleEdit = (transaction) => {
    setNewTransaction({
      ...transaction,
      date: new Date(transaction.date).toISOString().split('T')[0],
      amount: transaction.amount.toString(),
      category: transaction.category || 'food',
      source: transaction.paymentMethod || 'cash'
    });
    setIsEditing(true);
    setShowAddForm(true);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    paymentMethod: 'all'
  });
  
  const [tempFilters, setTempFilters] = useState({
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    paymentMethod: 'all'
  });
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filters.type === 'all' || transaction.type === filters.type;
    const matchesCategory = filters.category === 'all' || transaction.category === filters.category;
    const matchesPaymentMethod = filters.paymentMethod === 'all' || transaction.source === filters.paymentMethod;
    
    const transactionDate = new Date(transaction.date);
    const matchesStartDate = !filters.startDate || transactionDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || transactionDate <= new Date(filters.endDate);
  
    return matchesSearch && matchesType && matchesCategory && matchesPaymentMethod && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="transactions-container relative">
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out]">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 relative animate-[slideUp_0.3s_ease-out]">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">{isEditing ? 'Edit Transaction' : 'Add Transaction'}</h3>
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
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.label}
                      </option>
                    ))}
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">Source *</label>
                  <select
                    name="source"
                    value={newTransaction.source}
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
                    setIsEditing(false);
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

      <div className="filters bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            <AiOutlineFilter size={20} />
            Filters
          </button>
        </div>
      </div>

      <FilterModal
        show={showFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
        onApply={applyFilters}
        onReset={() => {
          const defaultFilters = {
            type: 'all',
            category: 'all',
            startDate: '',
            endDate: '',
            paymentMethod: 'all'
          };
          setFilters(defaultFilters);
          setTempFilters(defaultFilters);
          setShowFilters(false);
        }}
        onClose={() => setShowFilters(false)}
      />
      <div className="transactions-list bg-white rounded-lg shadow-sm p-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found 😢</p>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Transaction
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark hover:scale-110 hover:shadow-xl transition-all duration-300 ease-in-out flex items-center justify-center"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        {showAddForm ? <AiOutlineClose size={24} /> : <AiOutlinePlus size={24} />}
      </button>
    </div>
  );
}