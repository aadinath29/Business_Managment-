import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit2, Trash2, ShieldAlert, Award, MoreVertical, Building2, User, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Badge } from '../UI/Badge';
import { formatCurrency } from '../../utils/currency';
import { calculateAchievementPercentage } from '../../utils/branchCalculations';

export function BranchTable({ branches, onEdit, onDelete, onStatusToggle, sorting, onSort }) {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState(null);

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

  const getHealthBadgeColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getProgressBarColor = (pct) => {
    if (pct >= 90) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const toggleActionMenu = (id, e) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on click outside
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs relative">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-500">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
            <tr>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => onSort('branchName')}>
                <span className="flex items-center gap-1">Branch Name <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Manager</th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => onSort('assignedTarget')}>
                <span className="flex items-center gap-1">Targets (INR) <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-6 py-4 cursor-pointer hover:bg-gray-100" onClick={() => onSort('achievementPercentage')}>
                <span className="flex items-center gap-1">Achievement % <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="px-4 py-4 text-center">Leads/Projects</th>
              <th className="px-6 py-4 text-center">Health</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-semibold">
                  No active company branches matching the selected filter criteria.
                </td>
              </tr>
            ) : (
              branches.map((b) => {
                const achievement = calculateAchievementPercentage(b.achievedTarget, b.assignedTarget);
                const progressColor = getProgressBarColor(achievement);

                return (
                  <tr 
                    key={b.id} 
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/branches/${b.id}`)}
                  >
                    {/* Branch Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{b.branchName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">{b.id.toUpperCase()}-01</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium">{b.city}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{b.state}, {b.country}</p>
                    </td>

                    {/* Manager */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 text-[10px] font-bold">
                          {b.manager.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-700">{b.manager}</span>
                      </div>
                    </td>

                    {/* Target Numbers */}
                    <td className="px-6 py-4 font-mono font-semibold">
                      <p className="text-gray-900">{formatCurrency(b.achievedTarget)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Goal: {formatCurrency(b.assignedTarget)}</p>
                    </td>

                    {/* Target Progress Bar */}
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-extrabold text-gray-900 font-mono text-[10px]">{achievement}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${Math.min(achievement, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Active Metrics */}
                    <td className="px-4 py-4 text-center">
                      <p className="font-bold text-gray-900 font-mono">{b.activeLeads || 0}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                        {b.activeProjects || 0} Projs
                      </p>
                    </td>

                    {/* Health Score */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${getHealthBadgeColor(b.healthScore || 50)}`}>
                        {b.healthScore || 50}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">{getStatusBadge(b.status)}</td>

                    {/* Actions dropdown */}
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => toggleActionMenu(b.id, e)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
                        aria-label="More actions menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Floating actions menu */}
                      {activeMenuId === b.id && (
                        <div className="absolute right-6 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 z-50 py-1 transition-all text-left">
                          <button
                            onClick={() => navigate(`/branches/${b.id}`)}
                            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 mr-2 text-blue-500" /> View Analytics
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Edit Parameters
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStatusToggle(b.id, b.status === 'Active' ? 'Inactive' : 'Active'); }}
                            className="flex items-center w-full px-3 py-1.5 text-gray-700 hover:bg-gray-50 text-xs cursor-pointer"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 mr-2 text-amber-500" /> 
                            {b.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(b); }}
                            className="flex items-center w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer border-t border-gray-50 mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-500" /> Archive Branch
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
