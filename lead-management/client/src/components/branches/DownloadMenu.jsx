import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, Printer, ChevronDown } from 'lucide-react';
import { Button } from '../UI/Button';

export function DownloadMenu({ branchName }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerDownload = (format) => {
    alert(`Generating mock ${format} export for ${branchName}... (Feature ready for future PostgreSQL API payload integration)`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 text-xs font-semibold cursor-pointer py-1.5 px-3 border border-gray-200"
      >
        <Download className="w-4 h-4 mr-1.5" /> Download <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 z-50 py-1 transition-all text-left">
          <button
            onClick={() => triggerDownload('PDF')}
            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 mr-2 text-red-500" /> Export PDF
          </button>
          <button
            onClick={() => triggerDownload('Excel')}
            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 mr-2 text-green-600" /> Export Excel
          </button>
          <button
            onClick={() => triggerDownload('CSV')}
            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 mr-2 text-blue-500" /> Export CSV
          </button>
          <button
            onClick={() => { alert('Opening browser print dialogue...'); window.print(); setIsOpen(false); }}
            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer border-t border-gray-50 mt-1"
          >
            <Printer className="w-3.5 h-3.5 mr-2 text-gray-500" /> Print Summary
          </button>
        </div>
      )}
    </div>
  );
}
