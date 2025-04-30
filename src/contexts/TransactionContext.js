'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    // Initialize storage and load initial transactions
    StorageService.init();
    const storedTransactions = StorageService.getAllTransactions();
    setTransactions(storedTransactions);
  }, []);

  const addTransactions = (newTransactions) => {
    // Add IDs to transactions if they don't have one
    const transactionsWithIds = newTransactions.map(transaction => ({
      ...transaction,
      id: transaction.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));

    // Add each transaction to storage
    transactionsWithIds.forEach(transaction => {
      StorageService.addTransaction(transaction);
    });

    // Update state by appending new transactions
    setTransactions(prevTransactions => [...prevTransactions, ...transactionsWithIds]);
  };

  const updateTransaction = (id, updatedTransaction) => {
    StorageService.updateTransaction(id, updatedTransaction);
    setTransactions(prevTransactions =>
      prevTransactions.map(transaction =>
        transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
      )
    );
  };

  const deleteTransaction = (id) => {
    StorageService.deleteTransaction(id);
    setTransactions(prevTransactions =>
      prevTransactions.filter(transaction => transaction.id !== id)
    );
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransactions,
        updateTransaction,
        deleteTransaction,

      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}