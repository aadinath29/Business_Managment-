import React from 'react';
import { cn } from '../../utils/cn';

export const Select = React.forwardRef(({ className, label, options, error, ...props }, ref) => {
  // Callers that supply their own empty-value option (e.g. "All Branches",
  // "All Departments" filter defaults) keep their label — only inject the
  // generic placeholder when no empty option exists.
  const hasEmptyOption = options.some((opt) => opt.value === '');

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-lg border-gray-300 border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {!hasEmptyOption && <option value="" disabled>Select an option</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});
