import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PageBranchSelector({ currentBranchId, setCurrentBranchId, branches, currentBranch }) {
  const { backendRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSuperAdmin = backendRole === 'SUPER_ADMIN';

  // The requirement says: "The top branch selector dropdown must NOT be visible for Branch Managers (ADMIN role)."
  // So only SUPER_ADMIN sees this.
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <div className="flex flex-col items-end">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-1">
          Select Branch
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-100 cursor-pointer"
        >
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>{currentBranch.name}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 z-50 py-1 transition-all">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
            Switch Branch
          </div>
          <button
            onClick={() => {
              setCurrentBranchId('all');
              setIsOpen(false);
            }}
            className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
              currentBranchId === 'all'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPin className={`h-4 w-4 ${currentBranchId === 'all' ? 'text-blue-500' : 'text-gray-400'}`} />
              <span>All Branches</span>
            </div>
            {currentBranchId === 'all' && <Check className="h-4 w-4" />}
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setCurrentBranchId(b.id);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
                currentBranchId === b.id
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MapPin className={`h-4 w-4 ${currentBranchId === b.id ? 'text-blue-500' : 'text-gray-400'}`} />
                <span>{b.name}</span>
              </div>
              {currentBranchId === b.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
