import React from "react";
import { CREDIT_CARD_OPTIONS } from "@/constants/creditCardOptions";

export default function CreditCardTypeModal({ open, onClose, onSelect }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Select Credit Card Type</h2>
                <div className="flex flex-col gap-3 mb-6">
                    {CREDIT_CARD_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            className={`w-full px-4 py-2 rounded-md border border-gray-300 transition-all text-gray-700 text-left ${option.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-primary hover:text-white'}`}
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
                    className="w-full px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}