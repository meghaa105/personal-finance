import React from "react";

const CREDIT_CARD_OPTIONS = [
  { label: "Swiggy HDFC", value: "swiggy_hdfc" },
  { label: "SBI Cashback", value: "sbi_cashback" },
  { label: "Amazon ICICI", value: "amazon_icici" },
  { label: "ICICI Rubyx VISA", value: "icici_rubyx_visa" },
  { label: "ICICI Rubyx Amex", value: "icici_rubyx_amex" }
];

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
              className="w-full px-4 py-2 rounded-md border border-gray-300 hover:bg-primary hover:text-white transition-all text-gray-700 text-left"
              onClick={() => {
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