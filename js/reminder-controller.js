/**
 * Credit Card Reminder Controller module
 * Manages the credit card payment reminders functionality
 */
const ReminderController = (function() {
    // DOM Elements
    let reminderModal = null;
    let reminderForm = null;
    let addReminderBtn = null;
    let upcomingRemindersEl = null;
    let overdueRemindersEl = null;
    let completedRemindersEl = null;

    // Current reminder being edited
    let currentReminderId = null;

    function init() {
        // Cache DOM elements
        reminderModal = document.getElementById('reminder-modal');
        reminderForm = document.getElementById('reminder-form');
        addReminderBtn = document.getElementById('add-reminder-btn');
        upcomingRemindersEl = document.getElementById('upcoming-reminders');
        overdueRemindersEl = document.getElementById('overdue-reminders');
        completedRemindersEl = document.getElementById('completed-reminders');

        // Set up event listeners
        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', showAddReminderModal);
        }

        if (reminderForm) {
            reminderForm.addEventListener('submit', handleReminderFormSubmit);
        }

        document.getElementById('cancel-reminder').addEventListener('click', hideReminderModal);
        document.querySelector('#reminder-modal .close-modal').addEventListener('click', hideReminderModal);

        // Refresh the reminder lists
        refreshReminders();

        // Set up notification check (every hour)
        setInterval(checkForNotifications, 60 * 60 * 1000);
        // Also check immediately on page load
        checkForNotifications();
    }

    function refreshReminders() {
        // Fetch and display reminders
        displayUpcomingReminders();
        displayOverdueReminders();
        displayCompletedReminders();
    }

    function displayUpcomingReminders() {
        const upcomingReminders = Database.getUpcomingCreditCardReminders();
        renderRemindersList(upcomingRemindersEl, upcomingReminders, 'upcoming');
    }

    function displayOverdueReminders() {
        const overdueReminders = Database.getOverdueCreditCardReminders();
        renderRemindersList(overdueRemindersEl, overdueReminders, 'overdue');
    }

    function displayCompletedReminders() {
        const allReminders = Database.getAllCreditCardReminders();
        const completedReminders = allReminders.filter(reminder => reminder.isPaid);
        renderRemindersList(completedRemindersEl, completedReminders, 'completed');
    }

    function renderRemindersList(containerEl, reminders, type) {
        if (!containerEl) return;
        
        // Clear container
        containerEl.innerHTML = '';
        
        if (reminders.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            
            switch (type) {
                case 'upcoming':
                    emptyState.textContent = 'No upcoming credit card payments';
                    break;
                case 'overdue':
                    emptyState.textContent = 'No overdue credit card payments';
                    break;
                case 'completed':
                    emptyState.textContent = 'No completed credit card payments';
                    break;
            }
            
            containerEl.appendChild(emptyState);
            return;
        }
        
        // Sort reminders by due date
        reminders.sort((a, b) => {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            return dateA - dateB;
        });
        
        // Add each reminder to the container
        reminders.forEach(reminder => {
            const reminderEl = createReminderElement(reminder, type);
            containerEl.appendChild(reminderEl);
        });
    }

    function createReminderElement(reminder, type) {
        const reminderEl = document.createElement('div');
        reminderEl.className = 'reminder-item';
        reminderEl.dataset.id = reminder.id;
        
        // Due date in Indian format
        const dueDate = new Date(reminder.dueDate);
        const formattedDate = dueDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        // Format amount in Indian Rupees
        const formattedAmount = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(reminder.amount);
        
        // Calculate days remaining or overdue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusText = '';
        if (type === 'upcoming') {
            statusText = diffDays === 0 ? 
                '<span class="status urgent">Due today</span>' : 
                `<span class="status">${diffDays} days left</span>`;
        } else if (type === 'overdue') {
            statusText = `<span class="status overdue">${Math.abs(diffDays)} days overdue</span>`;
        } else if (type === 'completed') {
            statusText = `<span class="status completed">Paid</span>`;
        }
        
        // Create HTML structure for the reminder
        reminderEl.innerHTML = `
            <div class="reminder-details">
                <h4>${reminder.cardName}</h4>
                <div class="reminder-meta">
                    <div class="due-date">Due: ${formattedDate}</div>
                    <div class="amount">${formattedAmount}</div>
                    ${statusText}
                </div>
                ${reminder.notes ? `<div class="notes">${reminder.notes}</div>` : ''}
            </div>
            <div class="reminder-actions">
                ${type !== 'completed' ? 
                    `<button class="btn mark-paid-btn" data-id="${reminder.id}">
                        <span class="material-icons">check_circle</span>
                    </button>` : ''}
                <button class="btn edit-reminder-btn" data-id="${reminder.id}">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn delete-reminder-btn" data-id="${reminder.id}">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
        
        // Add event listeners to buttons
        const markPaidBtn = reminderEl.querySelector('.mark-paid-btn');
        if (markPaidBtn) {
            markPaidBtn.addEventListener('click', function() {
                markReminderAsPaid(reminder.id);
            });
        }
        
        reminderEl.querySelector('.edit-reminder-btn').addEventListener('click', function() {
            showEditReminderModal(reminder.id);
        });
        
        reminderEl.querySelector('.delete-reminder-btn').addEventListener('click', function() {
            deleteReminder(reminder.id);
        });
        
        return reminderEl;
    }

    function showAddReminderModal() {
        currentReminderId = null;
        document.getElementById('reminder-modal-title').textContent = 'Add Credit Card Payment Reminder';
        
        // Clear form
        reminderForm.reset();
        
        // Set default due date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('due-date').value = today;
        
        // Show modal
        reminderModal.style.display = 'block';
    }

    function showEditReminderModal(reminderId) {
        const reminder = Database.getAllCreditCardReminders().find(r => r.id === reminderId);
        if (!reminder) return;
        
        currentReminderId = reminderId;
        document.getElementById('reminder-modal-title').textContent = 'Edit Credit Card Payment Reminder';
        
        // Fill form with reminder data
        document.getElementById('reminder-id').value = reminder.id;
        document.getElementById('card-name').value = reminder.cardName;
        document.getElementById('payment-amount').value = reminder.amount;
        document.getElementById('due-date').value = new Date(reminder.dueDate).toISOString().split('T')[0];
        document.getElementById('reminder-days').value = reminder.reminderDays;
        document.getElementById('reminder-notes').value = reminder.notes || '';
        
        // Show modal
        reminderModal.style.display = 'block';
    }

    function hideReminderModal() {
        reminderModal.style.display = 'none';
    }

    function handleReminderFormSubmit(event) {
        event.preventDefault();

        const cardNameInput = document.getElementById('card-name');
        const billAmountInput = document.getElementById('bill-amount');
        const dueDateInput = document.getElementById('due-date');

        if (!cardNameInput || !billAmountInput || !dueDateInput) {
            console.error("One or more required elements are missing in the DOM.");
            return;
        }

        const reminderData = {
            cardName: cardNameInput.value,
            amount: parseFloat(billAmountInput.value),
            dueDate: dueDateInput.value,
            notes: document.getElementById('reminder-notes')?.value.trim() || '',
            isPaid: false
        };

        if (currentReminderId) {
            Database.updateCreditCardReminder(currentReminderId, reminderData);
        } else {
            Database.addCreditCardReminder(reminderData);
        }

        refreshReminders();
        hideReminderModal();
        UIController.showToast(`Reminder ${currentReminderId ? 'updated' : 'added'} successfully!`);
    }

    function markReminderAsPaid(reminderId) {
        // Display confirmation dialog
        if (confirm('Mark this payment as completed?')) {
            Database.markCreditCardReminderAsPaid(reminderId);
            refreshReminders();
            UIController.showToast('Payment marked as completed!');
        }
    }

    function deleteReminder(reminderId) {
        // Display confirmation dialog
        if (confirm('Are you sure you want to delete this reminder?')) {
            Database.deleteCreditCardReminder(reminderId);
            refreshReminders();
            UIController.showToast('Reminder deleted successfully!');
        }
    }

    function checkForNotifications() {
        const dueReminders = Database.getRemindersDueForNotification();
        
        if (dueReminders.length > 0 && 'Notification' in window) {
            // Request permission for notifications
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
            
            // If permission granted, show notifications
            if (Notification.permission === 'granted') {
                dueReminders.forEach(reminder => {
                    const dueDate = new Date(reminder.dueDate);
                    const formattedDate = dueDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    
                    const notification = new Notification('Credit Card Payment Reminder', {
                        body: `Your payment of ₹${reminder.amount} for ${reminder.cardName} is due on ${formattedDate}`,
                        icon: '/icons/credit-card.png'
                    });
                    
                    // Close notification after 10 seconds
                    setTimeout(() => {
                        notification.close();
                    }, 10000);
                });
            }
        }
    }

    // Return public API
    return {
        init,
        refreshReminders
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the module if we're on the reminders tab
    ReminderController.init();
});