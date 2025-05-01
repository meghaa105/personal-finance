'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImportOption from './ImportOption';
import { FaFileCsv, FaUsers, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { MdPictureAsPdf, MdAutoAwesome } from 'react-icons/md';
import { importTransactions } from '../utils/import';
import { formatDate } from '../utils/formatters';
import { useTransactions } from '../contexts/TransactionContext';
import { useCategories } from '../contexts/CategoryContext';

const IMPORT_OPTIONS = [
  {
    title: 'Import PDF (Credit Card Statement)',
    type: 'pdf',
    icon: MdPictureAsPdf,
    accept: '.pdf',
    color: 'red-600',
    parser: async (file, customMappings) => importTransactions(file, 'pdf', customMappings)
  },
  {
    title: 'Import CSV (Bank Statement)',
    type: 'csv',
    icon: FaFileCsv,
    accept: '.csv',
    color: 'green-600',
    parser: async (file, customMappings) => importTransactions(file, 'csv', customMappings)
  },
  {
    title: 'Import Splitwise CSV',
    type: 'splitwise',
    icon: FaUsers,
    accept: '.csv',
    color: 'teal-500',
    parser: async (file, customMappings) => importTransactions(file, 'splitwise', customMappings)
  },
  {
    title: 'Smart Import',
    type: 'smart',
    icon: MdAutoAwesome,
    accept: '.csv,.pdf,.xlsx,.xls',
    color: 'primary',
    parser: async (file) => {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['csv', 'pdf', 'xlsx', 'xls'].includes(extension)) {
        throw new Error('Unsupported file format');
      }
      return importTransactions(file, extension, customMappings);
    }
  }
];

export default function Import() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState(null);
  const [isCompactView, setIsCompactView] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const { addTransactions } = useTransactions();
  const { categories } = useCategories();

  const onImport = async () => {
    if (!previewData) return;

    try {
      // Add transactions to storage through context
      addTransactions(previewData);
      setImportStatus('success');
      alert('Transactions imported successfully!');
      setPreviewData(null); // Clear the preview after successful import
      router.push('/transactions'); // Navigate to transactions page
    } catch (err) {
      console.error('Error importing transactions:', err);
      setImportStatus('error');
      alert('Error importing transactions. Please try again.');
    } finally {
      setUploadStatus(null)
    }
  };

  const displayData = isCompactView ? previewData?.slice(0, 10) : previewData;

  return (
    <div className="import-container p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {IMPORT_OPTIONS.map(option => (
          <ImportOption
            key={option.type}
            setPreviewData={setPreviewData}
            setError={setError}
            error={error?.[option?.type]}
            setUploadStatus={setUploadStatus}
            uploadStatus={uploadStatus}
            {...option}
          />
        ))}
      </div>

      {previewData && (
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Import Preview</h3>
            <p className="text-gray-600">{previewData.length} transactions found</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className={`px-4 py-2 rounded-md transform transition-all duration-300 ease-in-out hover:scale-105 ${isCompactView ? 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-primary hover:text-white shadow hover:shadow-md'}`}
              onClick={() => setIsCompactView(true)}
            >
              Compact View
            </button>
            <button
              className={`px-4 py-2 rounded-md transform transition-all duration-300 ease-in-out hover:scale-105 ${!isCompactView ? 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-primary hover:text-white shadow hover:shadow-md'}`}
              onClick={() => setIsCompactView(false)}
            >
              View All Transactions
            </button>
          </div>

          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((transaction, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === index ? (
                        <input
                          type="date"
                          defaultValue={transaction.date instanceof Date ? transaction.date.toISOString().split('T')[0] : transaction.date}
                          className="border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedData = [...previewData];
                            updatedData[index] = { ...updatedData[index], date: e.target.value };
                            setPreviewData(updatedData);
                          }}
                        />
                      ) : formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === index ? (
                        <input
                          type="text"
                          defaultValue={transaction.description}
                          className="border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedData = [...previewData];
                            updatedData[index] = { ...updatedData[index], description: e.target.value };
                            setPreviewData(updatedData);
                          }}
                        />
                      ) : transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === index ? (
                        <input
                          type="number"
                          defaultValue={transaction.amount}
                          className="border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedData = [...previewData];
                            updatedData[index] = { ...updatedData[index], amount: parseFloat(e.target.value) };
                            setPreviewData(updatedData);
                          }}
                        />
                      ) : transaction.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {
                        editingId === index ? (
                          <select
                            defaultValue={transaction.type || 'expense'}
                            className="border rounded px-2 py-1"
                            onChange={(e) => {
                              const updatedData = [...previewData];
                              updatedData[index] = { ...updatedData[index], type: e.target.value };
                              setPreviewData(updatedData);
                            }}
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                          </select>
                        ) : (transaction.type)
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === index ? (
                        <select
                          defaultValue={transaction.category || 'other'}
                          className="border rounded px-2 py-1"
                          onChange={(e) => {
                            const updatedData = [...previewData];
                            updatedData[index] = { ...updatedData[index], category: e.target.value };
                            setPreviewData(updatedData);
                          }}
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.icon} {category.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{categories.find(c => c.id === (transaction.category || 'other'))?.icon || '⛓️'}</span>
                          <span>{categories.find(c => c.id === (transaction.category || 'other'))?.label || 'Other'}</span>
                        </div>
                      )}
                    </td>
                    {!isCompactView && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex gap-2">
                          {editingId === index ? (
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-green-600 hover:text-green-800 p-1"
                            >
                              <FaCheck size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingId(index)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <FaEdit size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const updatedData = previewData.filter((_, i) => i !== index);
                              setPreviewData(updatedData);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-start gap-4">
            <button onClick={onImport} className="bg-primary text-white px-6 py-2 rounded-md transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-primary-hover shadow-md hover:shadow-lg">
              Import Transactions
            </button>
            <button
              onClick={() => {
                setPreviewData(null);
                setIsCompactView(true);
                setEditingId(null);
                setImportStatus(null);
                setError({});
                setUploadStatus({});
              }}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-gray-300 shadow hover:shadow-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}