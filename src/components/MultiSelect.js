"use client";

import { useState, useId } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useMultiSelect } from "@/contexts/MultiSelectContext";

export default function MultiSelectDropdown({
  formFieldName,
  options,
  onChange,
  prompt = "Select one or more options",
  defaultValues = []
}) {
  const { openMultiSelect, closeMultiSelect } = useMultiSelect();

  const dropdownId = useId();

  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (defaultValues.length === 0) return [];
    return options.filter(option => 
      defaultValues.includes(option.value ?? option.id)
    );
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (option) => {
    const isChecked = selectedOptions?.map(selectionOption => (selectionOption.value ?? selectionOption.id)).includes(option.value ?? option.id);

    const newSelectedOptions = isChecked
      ? selectedOptions.filter(selectedOption => selectedOption.value !== option.value)
      : [...selectedOptions, option];

    setSelectedOptions(newSelectedOptions);
    onChange(newSelectedOptions);
  };

  const isSelectAllEnabled = selectedOptions.length < options.length;

  const handleSelectAllClick = (e) => {
    e.preventDefault();

    setSelectedOptions([...options]);
    onChange([...options]);
  };

  const isClearSelectionEnabled = selectedOptions.length > 0;

  const handleClearSelectionClick = (e) => {
    e.preventDefault();

    setSelectedOptions([]);
    onChange([]);
  };

  const getSelectedOptionLabel = (value) => {
    const option = options.find(opt => opt.value === value || opt.id === value);
    return option ? option.label : typeof value === "string" ? value : "Unknown";
  };

  const renderSelectionDisplay = () => {
    if (selectedOptions.length === 0) {
      return prompt;
    }

    if (selectedOptions.length <= 1) {
      return (
        <div className="flex gap-2">
          {selectedOptions.map((selectedOption) => (
            <span key={selectedOption?.value ?? selectedOption?.id} className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-sm">
              {getSelectedOptionLabel(selectedOption?.value ?? selectedOption?.id)}
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        <span className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-sm">
          {getSelectedOptionLabel(selectedOptions?.[0]?.value ?? selectedOptions?.[0]?.id)}
        </span>
        <span className="bg-blue-100 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full text-sm">
          {`${selectedOptions.length}`}
        </span>
      </div>
    );
  };

  return (
    <>
      <div
        className={`z-[100] overflow-clip absolute h-screen w-full top-0 left-0 ${isOpen? "block" : "hidden"}`}
        onClick={() => {
          setIsOpen(false);
          closeMultiSelect();
        }}
      ></div>
      <label className={`relative rounded-md border border-gray-500 bg-slate-50 dark:bg-gray-800 dark:border-gray-600 block w-full ${isOpen ? "z-[101]": ""}`}>
        <input
          type="checkbox"
          className="hidden peer"
          checked={isOpen}
          onChange={() => {
            setIsOpen(!isOpen);
            if (isOpen) {
              closeMultiSelect();
            } else {
              openMultiSelect(dropdownId);
            }
          }}
        />

        <div className="w-full cursor-pointer inline-flex justify-between items-center px-2 py-1 dark:text-gray-300">
          {renderSelectionDisplay()}
          {isOpen ? <FaChevronUp className="text-gray-500 dark:text-gray-400" /> : <FaChevronDown className="text-gray-500 dark:text-gray-400" />}
        </div>

        <div className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100 peer-checked:pointer-events-auto w-full max-h-60 overflow-y-auto z-10">
          <ul className="flex gap-2 p-1 border-b border-gray-200 dark:border-gray-700">
            <li>
              <button
                onClick={handleSelectAllClick}
                disabled={!isSelectAllEnabled}
                className="w-full text-left px-2 py-1 text-blue-600 dark:text-blue-400 disabled:opacity-50 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-600/20 hover:disabled:bg-transparent disabled:pointer-events-none rounded"
              >
                {"Select All"}
              </button>
            </li>
            <li>
              <button
                onClick={handleClearSelectionClick}
                disabled={!isClearSelectionEnabled}
                className="w-full text-left px-2 py-1 text-blue-600 dark:text-blue-400 disabled:opacity-50 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-600/20 hover:disabled:bg-transparent disabled:pointer-events-none rounded"
              >
                {"Clear selection"}
              </button>
            </li>
          </ul>
          <ul className="dark:text-gray-300">
            {options.map((option) => {
              const checked = selectedOptions?.map(selectedOption => (selectedOption.value ?? selectedOption.id))?.includes(option.value ?? option.id);
              return (
                <li key={option.value ?? option.id}>
                  <label
                    className={`flex whitespace-nowrap cursor-pointer px-2 py-[0.35rem] border border-transparent hover:border-blue-600 dark:hover:border-blue-500 transition-colors [&:has(input:checked)]:bg-blue-200 dark:[&:has(input:checked)]:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/10`}
                  >
                    <input
                      type="checkbox"
                      name={formFieldName}
                      value={option.value ?? option.id}
                      className="cursor-pointer"
                      onChange={() => handleChange(option)}
                      checked={checked}
                    />
                    <span className="ml-1">{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </label>
    </>
  );
}