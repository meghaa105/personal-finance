'use client';

import { useState } from 'react';
import { DocumentIcon, TableRowsIcon, UsersIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PDFDocument } from 'pdf-lib';
import { formatDate } from '../utils/formatters';

export default function Import() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile({
      file,
      type
    });
    setError(null);
    setImportPreview(null);

    try {
      let transactions = [];

      switch (type) {
        case 'pdf':
          const pdfData = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(pdfData);
          // Extract text from PDF and parse it
          const pages = pdfDoc.getPages();
          const text = pages.map(page => page.getText()).join('\n');
          // Parse the text into transactions (implement based on PDF format)
          transactions = parsePDFText(text);
          break;

        case 'csv':
        case 'splitwise':
          const csvResult = await new Promise((resolve) => {
            Papa.parse(file, {
              complete: (result) => resolve(result),
              header: true,
              skipEmptyLines: true
            });
          });
          transactions = type === 'splitwise' ? 
            parseSplitwiseCSV(csvResult.data) : 
            parseRegularCSV(csvResult.data);
          break;

        case 'smart':
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            transactions = XLSX.utils.sheet_to_json(worksheet);
          } else {
            throw new Error('Unsupported file format');
          }
          break;

        default:
          throw new Error('Unsupported file type');
      }

      setImportPreview(transactions);
    } catch (err) {
      console.error('Error parsing file:', err);
      setError('Error parsing file. Please check the file format and try again.');
    }
  };

  const parsePDFText = (text) => {
    // Implement PDF parsing logic based on your statement format
    // This is a placeholder implementation
    const lines = text.split('\n');
    return lines
      .filter(line => line.match(/\d+\/\d+\/\d+/))
      .map(line => ({
        date: line.match(/\d+\/\d+\/\d+/)[0],
        description: line.match(/[A-Za-z\s]+/)[0].trim(),
        amount: parseFloat(line.match(/\d+\.\d{2}/)[0])
      }));
  };

  const parseRegularCSV = (data) => {
    return data.map(row => ({
      date: row.Date || row.date,
      description: row.Description || row.description,
      amount: parseFloat(row.Amount || row.amount)
    }));
  };

  const parseSplitwiseCSV = (data) => {
    return data.map(row => ({
      date: row['Date'],
      description: row['Description'],
      amount: parseFloat(row['Cost']),
      category: row['Category'],
      group: row['Group'],
      splitWith: row['Users on split']
    }));
  };

  const handleImport = async () => {
    if (!selectedFile || !importPreview) return;

    try {
      // Here you would typically send the data to your backend
      // For now, we'll just simulate saving to localStorage
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const newTransactions = importPreview.map(transaction => ({
        ...transaction,
        id: Date.now() + Math.random(),
        importedAt: new Date().toISOString(),
        source: selectedFile.type
      }));

      localStorage.setItem('transactions', JSON.stringify([...existingTransactions, ...newTransactions]));
      
      // Reset the form
      setSelectedFile(null);
      setImportPreview(null);
      setError(null);

      // Show success message (you might want to add a toast notification here)
      alert('Transactions imported successfully!');
    } catch (err) {
      console.error('Error importing transactions:', err);
      setError('Error importing transactions. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Import Transactions</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PDF Import Option */}
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-all duration-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">Import PDF (Credit Card Statement)</h3>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 transition-all duration-200 cursor-pointer bg-gray-50">
            <DocumentIcon className="h-8 w-8 text-indigo-500 mb-3" />
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e, 'pdf')}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer text-center">
              <span className="text-sm text-indigo-600 hover:text-indigo-700">Select PDF File</span>
            </label>
          </div>
        </div>

        {/* CSV Import Option */}
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-all duration-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">Import CSV (Bank Statement)</h3>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 transition-all duration-200 cursor-pointer bg-gray-50">
            <TableRowsIcon className="h-8 w-8 text-indigo-500 mb-3" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e, 'csv')}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer text-center">
              <span className="text-sm text-indigo-600 hover:text-indigo-700">Select CSV File</span>
            </label>
          </div>
        </div>

        {/* Splitwise Import Option */}
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-all duration-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">Import Splitwise CSV</h3>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 transition-all duration-200 cursor-pointer bg-gray-50">
            <UsersIcon className="h-8 w-8 text-indigo-500 mb-3" />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e, 'splitwise')}
              className="hidden"
              id="splitwise-upload"
            />
            <label htmlFor="splitwise-upload" className="cursor-pointer text-center">
              <span className="text-sm text-indigo-600 hover:text-indigo-700">Select Splitwise Export</span>
            </label>
          </div>
        </div>

        {/* Smart Import Option */}
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-all duration-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">Smart Import</h3>
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-lg hover:border-indigo-500 transition-all duration-200 cursor-pointer bg-gray-50">
            <SparklesIcon className="h-8 w-8 text-indigo-500 mb-3" />
            <input
              type="file"
              onChange={(e) => handleFileSelect(e, 'smart')}
              className="hidden"
              id="smart-upload"
            />
            <label htmlFor="smart-upload" className="cursor-pointer text-center">
              <span className="text-sm text-indigo-600 hover:text-indigo-700">Select Any File</span>
            </label>
          </div>
        </div>
      </div>

      {/* Import Preview Section */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Import Preview</h2>
        {error ? (
          <p className="text-red-500 text-center py-4">{error}</p>
        ) : importPreview ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  {selectedFile?.type === 'splitwise' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Split With</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importPreview.map((transaction, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount}</td>
                    {selectedFile?.type === 'splitwise' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.group}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.splitWith}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No import data to preview</p>
        )}
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={!selectedFile}
        className={`mt-6 px-6 py-2 rounded-lg text-sm font-medium ${selectedFile ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
      >
        Import Transactions
      </button>
    </div>
  );
}