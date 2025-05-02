"use client";

import { createContext, useContext, useState } from "react";

const MultiSelectContext = createContext();

export function MultiSelectProvider({ children }) {
  const [dropdownOpen, setDropdownOpen] = useState(null);

  const openMultiSelect = (id) => {
    setDropdownOpen(id);
  };

  const closeMultiSelect = () => {
    setDropdownOpen(null);
  };

  return (
    <MultiSelectContext.Provider
      value={{
        dropdownOpen,
        openMultiSelect,
        closeMultiSelect,
      }}
    >
      {children}
    </MultiSelectContext.Provider>
  );
}

export function useMultiSelect() {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error("useMultiSelect must be used within a MultiSelectProvider");
  }
  return context;
}