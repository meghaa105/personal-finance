'use client';

import { AiOutlineFilter, AiOutlineClose } from 'react-icons/ai';

export default function FilterModal({ show, onReset, onClose, filters, onFilterChange, onApplyFilters, categories }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-in-out] p-4">
      <div className="bg-white dark:bg-gray-800/95 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md sm:max-w-lg mx-auto animate-[slideUp_0.3s_ease-out]">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100">Filter Transactions</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <AiOutlineClose size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
        <form className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={onFilterChange}
                className="w-full p-2 text-sm sm:text-base border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={onFilterChange}
                className="w-full p-2 text-sm sm:text-base border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
              >
                <option value="all">All</option>
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={onFilterChange}
                className="w-full p-2 text-sm sm:text-base border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={onFilterChange}
                className="w-full p-2 text-sm sm:text-base border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={onFilterChange}
              className="w-full p-2 text-sm sm:text-base border dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary/70"
            >
              <option value="all">All</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="upi">UPI</option>
              <option value="net_banking">Net Banking</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2  text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg hover:scale-105 hover:shadow-sm transition-all duration-200 ease-in-out"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onApplyFilters}
              className="px-4 py-2 text-sm sm:text-base text-white bg-primary hover:bg-primary-hover hover:scale-105 hover:shadow-md rounded-lg transition-all duration-200 ease-in-out"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}