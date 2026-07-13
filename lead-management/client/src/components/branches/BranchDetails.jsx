import React from 'react';
import { Card, CardContent } from '../UI/Card';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Edit, Trash2, Building2, MapPin } from 'lucide-react';
import { BranchOverview } from './BranchOverview';
import { BranchPerformance } from './BranchPerformance';
import { BranchLeads } from './BranchLeads';
import { useAuth } from '../../context/AuthContext';

export function BranchDetails({ branch, onEdit, onDelete }) {
  const { role } = useAuth();
  if (!branch) {
    return (
      <div className="flex-1 bg-white border border-gray-200 rounded-xl p-8 shadow-xs flex flex-col items-center justify-center text-center h-full">
        <Building2 className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="font-bold text-gray-700 text-sm">No Branch Selected</h3>
        <p className="text-xs text-gray-400 mt-1">Select a branch from the left-side list to view detailed ERP operational parameters.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <Badge variant="success">Active</Badge>;
      case 'Inactive':
        return <Badge variant="default">Inactive</Badge>;
      case 'Under Maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      case 'Temporarily Closed':
        return <Badge variant="danger">Closed Temp</Badge>;
      case 'Merged':
        return <Badge variant="info">Merged</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 border border-gray-200 rounded-xl overflow-hidden shadow-xs">
      
      {/* 1. Header Profile & Quick Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-gray-900 leading-tight">{branch.branchName}</h2>
              {getStatusBadge(branch.status)}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider flex items-center gap-1">
              Code: {branch.branchCode} • <MapPin className="w-3 h-3 text-gray-400" /> {branch.city}, {branch.state}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(role === 'admin' || role === 'branch_manager') && (
            <Button
              variant="ghost"
              onClick={() => onEdit(branch)}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs font-semibold cursor-pointer py-1.5 px-3 border border-indigo-200"
            >
              <Edit className="w-4 h-4 mr-1.5" /> Edit Parameters
            </Button>
          )}
          {role === 'admin' && (
            <Button
              variant="ghost"
              onClick={() => onDelete(branch)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Archive Branch
            </Button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Performance charts and target trends */}
        <BranchPerformance branch={branch} />

        {/* Overview details & managers contact */}
        <BranchOverview branch={branch} />

        {/* Relational details */}
        <BranchLeads branch={branch} />

      </div>

    </div>
  );
}
