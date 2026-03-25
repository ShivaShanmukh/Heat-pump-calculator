import { useState } from 'react';

interface YearSelectorProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const years = ['Today', '2030', '2040', '2050'];

  return (
    <div className="flex justify-center mb-12">
      <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => onYearChange(year)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              selectedYear === year
                ? 'bg-[#0A4D5C] text-white'
                : 'bg-white text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
