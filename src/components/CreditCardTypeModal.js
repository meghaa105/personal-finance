import React from "react";
import { CREDIT_CARD_OPTIONS } from "@/constants/creditCardOptions";
import { useTheme } from "@/contexts/ThemeContext";

export default function CreditCardTypeModal({ open, onClose, onSelect }) {
    const { theme } = useTheme();
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 dark:bg-black dark:bg-opacity-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md transition-colors duration-200">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Select Credit Card Type</h2>
                <div className="flex flex-col gap-3 mb-6">
                    {CREDIT_CARD_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            className={`w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 transition-all text-gray-700 dark:text-gray-200 text-left ${option.disabled ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white'}`}
                            //   disabled={option.disabled}
                            onClick={() => {
                                if (option.disabled) {
                                    alert('This option is not implemented yet.');
                                    return;
                                }
                                onSelect(option.value);
                                onClose();
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <button
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-105 transition-all duration-300 ml-auto w-full"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}