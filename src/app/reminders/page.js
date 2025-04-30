'use client';

import { useState, useEffect } from 'react';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState({
    title: '',
    amount: '',
    date: '',
    type: 'expense',
    recurring: 'none'
  });

  useEffect(() => {
    const savedReminders = localStorage.getItem('reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  const saveReminders = (updatedReminders) => {
    localStorage.setItem('reminders', JSON.stringify(updatedReminders));
    setReminders(updatedReminders);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReminder.title || !newReminder.amount || !newReminder.date) return;

    const reminder = {
      ...newReminder,
      id: Date.now(),
      amount: parseFloat(newReminder.amount)
    };

    saveReminders([...reminders, reminder]);
    setNewReminder({
      title: '',
      amount: '',
      date: '',
      type: 'expense',
      recurring: 'none'
    });
  };

  const deleteReminder = (id) => {
    const updatedReminders = reminders.filter(reminder => reminder.id !== id);
    saveReminders(updatedReminders);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reminders</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add New Reminder</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Rent Payment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={newReminder.amount}
                  onChange={(e) => setNewReminder({...newReminder, amount: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Recurring</label>
                <select
                  value={newReminder.recurring}
                  onChange={(e) => setNewReminder({...newReminder, recurring: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
              >
                Add Reminder
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Reminders</h2>
          <div className="space-y-4">
            {reminders.length === 0 ? (
              <p className="text-gray-500 text-center">No reminders set</p>
            ) : (
              reminders.map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BellIcon className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h3 className="font-medium">{reminder.title}</h3>
                      <p className="text-sm text-gray-500">
                        ₹{reminder.amount.toFixed(2)} - {reminder.date}
                      </p>
                      <p className="text-xs text-gray-400">
                        {reminder.type} - {reminder.recurring !== 'none' ? `Recurring ${reminder.recurring}` : 'One-time'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}