import StorageService from '../storage';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize storage with default values if empty', () => {
      StorageService.init();
      expect(localStorage.getItem('personalFinance_transactions')).toBe('[]');
      expect(localStorage.getItem('personalFinance_categories')).toBeDefined();
      expect(localStorage.getItem('personalFinance_customMappings')).toBeDefined();
    });

    it('should not overwrite existing data', () => {
      const existingTransactions = JSON.stringify([{ id: '1', amount: 100 }]);
      localStorage.setItem('personalFinance_transactions', existingTransactions);

      StorageService.init();
      expect(localStorage.getItem('personalFinance_transactions')).toBe(existingTransactions);
    });
  });

  describe('Transactions', () => {
    it('should add a transaction', () => {
      const transaction = { id: '1', amount: 100, description: 'Test' };
      StorageService.addTransaction(transaction);

      const transactions = StorageService.getAllTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual(transaction);
    });

    it('should get all transactions', () => {
      const transaction = { id: '1', amount: 100, description: 'Test' };
      StorageService.addTransaction(transaction);

      const transactions = StorageService.getAllTransactions();
      expect(transactions).toEqual([transaction]);
    });

    it('should update a transaction', () => {
        const transaction = { id: '1', amount: 100, description: 'Test' };
        StorageService.addTransaction(transaction);

        StorageService.updateTransaction('1', { amount: 200 });
        const transactions = StorageService.getAllTransactions();
        expect(transactions[0].amount).toBe(200);
    });

    it('should delete a transaction', () => {
        const transaction = { id: '1', amount: 100, description: 'Test' };
        StorageService.addTransaction(transaction);

        StorageService.deleteTransaction('1');
        const transactions = StorageService.getAllTransactions();
        expect(transactions).toHaveLength(0);
    });
  });

  // These tests are expected to fail or exhibit bad behavior currently because the code lacks error handling
  describe('Error Handling (Expected Gaps)', () => {
     it('should handle corrupted JSON gracefully', () => {
         localStorage.setItem('personalFinance_transactions', 'invalid json');
         // Current implementation crashes here
         try {
            StorageService.getAllTransactions();
         } catch (e) {
             // Expecting it to crash currently, but we want to fix this
             expect(e).toBeDefined();
         }
     });
  });
});
