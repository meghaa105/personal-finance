'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTransactions = async () => {
      try {
        console.log('Initializing TransactionContext...');
        StorageService.init(); // This will force initialize with sample transaction
        const storedTransactions = StorageService.getAllTransactions();
        console.log('Loaded transactions:', storedTransactions);
        
        if (!Array.isArray(storedTransactions)) {
          console.error('Stored transactions is not an array:', storedTransactions);
          setTransactions([]);
        } else {
          setTransactions(storedTransactions);
        }
      } catch (error) {
        console.error('Error initializing transactions:', error);
        setTransactions([]);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeTransactions();
  }, []);

  const addTransactions = (newTransactions) => {
    try {
      console.log('Adding new transactions:', newTransactions);
      
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
      setTransactions(prevTransactions => {
        const updatedTransactions = [...prevTransactions, ...transactionsWithIds];
        console.log('Updated transactions state:', updatedTransactions);
        return updatedTransactions;
      });
    } catch (error) {
      console.error('Error adding transactions:', error);
    }
  };

  const updateTransaction = (id, updatedTransaction) => {
    try {
      console.log('Updating transaction:', id, updatedTransaction);
      StorageService.updateTransaction(id, updatedTransaction);
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === id ? { ...transaction, ...updatedTransaction } : transaction
        )
      );
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = (id) => {
    try {
      console.log('Deleting transaction:', id);
      StorageService.deleteTransaction(id);
      setTransactions(prevTransactions =>
        prevTransactions.filter(transaction => transaction.id !== id)
      );
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const clearTransactions = () => {
    try {
      console.log('Clearing all transactions');
      StorageService.clearTransactions();
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        clearTransactions,
        isInitialized
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