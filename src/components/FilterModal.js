'use client';

import { AiOutlineFilter, AiOutlineClose } from 'react-icons/ai';

export default function FilterModal({ filters, onFilterChange, onApply, onReset, show, onClose }) {
  return (
    <>
      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Filter Transactions</h3>
              <button
                onClick={onClose}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-200 rounded-full transition-all duration-200 ease-in-out"
              >
                <AiOutlineClose className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Transaction Type</label>
                <select
                  name="type"
                  value={filters.type}
                  onChange={onFilterChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={onFilterChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={onFilterChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={onFilterChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={onFilterChange}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="net_banking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={onReset}
                className="px-4 py-2 text-gray-600 border border-gray-300 hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 rounded-lg hover:scale-105 hover:shadow-sm transition-all duration-200 ease-in-out"
              >
                Reset
              </button>
              <button
                onClick={onApply}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark hover:scale-105 hover:shadow-md transition-all duration-200 ease-in-out"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}