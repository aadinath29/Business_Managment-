import React from 'react';
import { Button } from '../UI/Button';
import { AlertTriangle, X } from 'lucide-react';

export function DeleteBranchDialog({ isOpen, branch, onClose, onConfirm }) {
  if (!isOpen || !branch) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-zoom-in">
        
        {/* Warning Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-rose-50/50">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2 bg-rose-100 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Archive Company Branch</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Details Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to archive the branch <strong className="text-gray-900">"{branch.branchName}"</strong>?
          </p>
          
          <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-2">
            <p className="font-semibold text-gray-700">Relational Summary Details:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Active Leads pool: <strong className="text-gray-800 font-mono">{branch.activeLeads || 0}</strong></li>
              <li>Undergoing Projects: <strong className="text-gray-800 font-mono">{branch.activeProjects || 0}</strong></li>
              <li>Branch Employee staff: <strong className="text-gray-800 font-mono">{branch.employees || 0}</strong></li>
            </ul>
          </div>
          
          <p className="text-xs font-semibold text-rose-600">
            * This branch contains leads, projects, and employees. Archiving it will hide it from the active branches dashboard. This is a soft-delete operation.
          </p>
        </div>

        {/* Dialog Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose} 
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
          >
            Archive Branch
          </Button>
        </div>

      </div>
    </div>
  );
}
