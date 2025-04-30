'use client';

import { formatCurrency } from '../utils/formatters';
import { AiOutlineCalendar, AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { FaArrowTrendDown, FaArrowTrendUp } from 'react-icons/fa6';

export default function Transaction({ transaction, onEdit, onDelete }) {
  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md border border-gray-300 hover:border-gray-400 group">
      <div className="flex-grow flex items-center gap-4">
        {transaction.type === 'income' ?
          <FaArrowTrendUp size={24} className="text-green-500 flex-shrink-0" /> :
          <FaArrowTrendDown size={24} className="text-red-500 flex-shrink-0" />
        }
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-gray-800">{transaction.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-full">
              <AiOutlineCalendar className="text-gray-500" />
              {new Date(transaction.date).toLocaleDateString('en-IN')}
            </span>
            {transaction.category && (
              <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                {transaction.category}
              </span>
            )}
            {transaction.source && (
              <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full capitalize">
                Source: {transaction.source}
              </span>
            )}
          </div>
        </div>
        <p className={`text-lg font-semibold px-4 py-2 rounded-lg ${transaction.type === 'income' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
          {formatCurrency(transaction.amount)}
        </p>
        <div className="flex gap-2 transition-opacity duration-200">
          <button
            onClick={() => onEdit(transaction)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-300"
          >
            <AiOutlineEdit size={25} />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-300"
          >
            <AiOutlineDelete size={25} />
          </button>
        </div>
      </div>
    </div>
  );
}