'use client';

import { formatCurrency } from '../utils/formatters';
import { useCategories } from '../contexts/CategoryContext';
import { AiOutlineCalendar, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';

export default function Transaction({ transaction, onEdit, onDelete }) {
  const { categories } = useCategories();
  const category = categories.find(cat => cat.id === transaction.category) || categories.find(cat => cat.id === 'other');
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-start sm:items-center p-3 pt-1 sm:p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 group">
      <div className="flex-grow flex items-center gap-3 sm:gap-4 w-full">
        <div className='hidden sm:block'>
          {transaction.type === 'income' ?
            <FaArrowTrendUp size={20} className="text-green-500 flex-shrink-0" /> :
            <FaArrowTrendDown size={20} className="text-red-500 flex-shrink-0" />
          }
        </div>
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1 sm:mb-2">
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm sm:text-base break-all">{transaction.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm mt-1 sm:mt-0">
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-full">
              <AiOutlineCalendar className="text-gray-500 dark:text-gray-400" />
              {new Date(transaction.date).toLocaleDateString('en-IN')}
            </span>
            {category && (
              <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full flex items-center gap-1">
                <span className="text-sm sm:text-base">{category?.icon || '⛓️'}</span>
                {category?.label || 'Other'}
              </span>
            )}
            {transaction.source && (
              <span className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-full capitalize">
                Source: {transaction.source}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
        <div className='flex items-center gap-3'>
          <div className='sm:hidden block'>
            {transaction.type === 'income' ?
              <FaArrowTrendUp size={20} className="text-green-500 flex-shrink-0" /> :
              <FaArrowTrendDown size={20} className="text-red-500 flex-shrink-0" />
            }
          </div>
          <p className={`text-lg font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-lg ${transaction.type === 'income' ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30'}`}>
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        <div className="flex gap-1 sm:gap-2 transition-opacity duration-200">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full transition-colors duration-300"
          >
            <AiOutlineEdit size={18} className="sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors duration-300"
          >
            <AiOutlineDelete size={18} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}