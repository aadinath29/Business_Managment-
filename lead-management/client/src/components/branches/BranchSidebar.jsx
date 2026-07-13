import React, { useRef, useEffect } from 'react';
import { Search, Building2 } from 'lucide-react';
import { BranchCard } from './BranchCard';

export function BranchSidebar({ branches, selectedBranchId, onSelectBranch, searchQuery, onSearchChange }) {
  const containerRef = useRef(null);

  // Restore scroll position when selected branch changes or component mounts
  useEffect(() => {
    if (containerRef.current) {
      const savedScrollTop = sessionStorage.getItem('branch_sidebar_scroll_top');
      if (savedScrollTop) {
        containerRef.current.scrollTop = parseInt(savedScrollTop, 10);
      }
    }
  }, [selectedBranchId]);

  const handleScroll = (e) => {
    sessionStorage.setItem('branch_sidebar_scroll_top', e.target.scrollTop);
  };

  return (
    <div className="w-full lg:w-80 bg-white border border-gray-200 rounded-xl flex flex-col h-full overflow-hidden shrink-0 shadow-xs">
      
      {/* Search Input Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50/50">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Search branches..."
          />
        </div>
      </div>

      {/* Branches List Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1"
      >
        {branches.length === 0 ? (
          <div className="py-8 text-center text-gray-400 font-medium text-xs">
            No branches found.
          </div>
        ) : (
          branches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              isSelected={b.id === selectedBranchId}
              onClick={() => onSelectBranch(b.id)}
            />
          ))
        )}
      </div>

    </div>
  );
}
