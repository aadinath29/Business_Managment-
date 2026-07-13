import React from 'react';
import { Building2, User } from 'lucide-react';
import { calculateAchievementPercentage } from '../../utils/branchCalculations';
import { Badge } from '../UI/Badge';

export function BranchCard({ branch, isSelected, onClick }) {
  const achievement = calculateAchievementPercentage(branch.achievedTarget, branch.assignedTarget);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500';
      case 'Inactive': return 'bg-slate-400';
      case 'Under Maintenance': return 'bg-amber-500';
      default: return 'bg-rose-500';
    }
  };

  const getAchievementColor = (pct) => {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 70) return 'text-blue-600';
    if (pct >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col space-y-2 select-none ${
        isSelected
          ? 'bg-blue-50/80 border-blue-200 shadow-2xs'
          : 'bg-white border-transparent hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-md ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[140px]" title={branch.branchName}>
              {branch.branchName}
            </h4>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{branch.city}</p>
          </div>
        </div>
        <span className={`w-2 h-2 rounded-full mt-1 ${getStatusColor(branch.status)}`} title={branch.status} />
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100/50">
        <span className="flex items-center gap-1"><User className="w-3 h-3 text-gray-400" /> {branch.manager}</span>
        <span className={`font-bold font-mono ${getAchievementColor(achievement)}`}>{achievement}% Target</span>
      </div>
    </div>
  );
}
