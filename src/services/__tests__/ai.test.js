import { analyzeRequest } from '../ai';

describe('AI Service', () => {
  const mockCategories = [
    { id: 'food', label: 'Food & Dining' },
    { id: 'transport', label: 'Transportation' }
  ];

  const mockTransactions = [
    { id: '1', amount: 100, category: 'food', type: 'expense' },
    { id: '2', amount: 50, category: 'transport', type: 'expense' },
    { id: '3', amount: 200, category: 'food', type: 'expense' }
  ];

  it('should handle greetings', async () => {
    const result = await analyzeRequest('Hello there', [], []);
    expect(result.text).toContain('Hello!');
  });

  it('should calculate total spending for a category', async () => {
    const result = await analyzeRequest('How much spent on Food', mockTransactions, mockCategories);
    expect(result.text).toContain('₹300');
    expect(result.text).toContain('Food & Dining');
  });

  it('should calculate total spending overall', async () => {
    const result = await analyzeRequest('Total spend', mockTransactions, mockCategories);
    expect(result.text).toContain('₹350');
  });

  it('should provide habits analysis', async () => {
    const result = await analyzeRequest('spending habits', mockTransactions, mockCategories);
    expect(result.text).toContain('Food & Dining');
    expect(result.text).toContain('₹300');
  });

  it('should handle unknown queries gracefully', async () => {
    const result = await analyzeRequest('What is the meaning of life', mockTransactions, mockCategories);
    expect(result.text).toContain('not sure I understand');
  });
});
