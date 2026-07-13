import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Search } from 'lucide-react';
import { BranchSelector } from './BranchSelector';
export function TopNavbar({ onSearchChange, searchPlaceholder = 'Search...' }) {
    return (_jsxs("header", { className: "flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm z-50 sticky top-0 w-full", children: [_jsxs("div", { className: "flex-1 max-w-lg relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { type: "text", onChange: (e) => onSearchChange?.(e.target.value), className: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors", placeholder: searchPlaceholder })] }), _jsx("div", { className: "flex items-center space-x-6", children: _jsx(BranchSelector, {}) })] }));
}
