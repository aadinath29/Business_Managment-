import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { BranchSelector } from './BranchSelector';

export function TopNavbar({ onSearchChange, searchPlaceholder = 'Search leads, teams, or tasks...' }) {
  const location = useLocation();
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm z-50 relative w-full">
      <div className="flex-1 max-w-lg relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="flex items-center space-x-6">
        {location.pathname.startsWith('/dashboard') && <BranchSelector />}
        
        {/* Notifications */}
        <button className="p-2 text-gray-400 hover:text-gray-500 relative transition-colors rounded-full hover:bg-gray-100 cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
      </div>
    </header>
  );
}
