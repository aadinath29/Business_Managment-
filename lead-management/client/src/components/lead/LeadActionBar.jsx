import React from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Edit, MoreVertical, MapPin, ShieldAlert, Award } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { formatCurrency } from '../../utils/currency';

export function LeadActionBar({ lead, teamLeaderName, onMarkWon, onMarkLost }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!lead) return null;

  const isFromBranches = location.state?.source === 'branches';
  const branchId = location.state?.branchId;

  return (
    <div className="bg-slate-50 border-b border-gray-200 px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between w-full min-h-[64px] gap-4">
      {/* Left side details */}
      <div className="flex items-center space-x-4">
        <Link 
          to={isFromBranches ? `/branches/${branchId || ''}` : "/leads"} 
          onClick={(e) => {
            if (isFromBranches) {
              e.preventDefault();
              navigate(-1);
            }
          }}
          className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer shrink-0"
          aria-label="Back to leads list"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-bold text-gray-900 truncate max-w-[240px] md:max-w-[360px]" title={lead.name}>
              {lead.name}
            </h1>
            <Badge variant={
              lead.status === 'Closed Won' ? 'success' :
              lead.status === 'Closed Lost' ? 'danger' :
              lead.status === 'Qualified' || lead.status === 'Negotiation' ? 'info' :
              'warning'
            }>
              {lead.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{lead.companyName}</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /> <span className="capitalize">{lead.branchId}</span></span>
            <span className="text-gray-300">|</span>
            <span>TL: <span className="font-semibold text-gray-700">{teamLeaderName || 'Unassigned'}</span></span>
            <span className="text-gray-300">|</span>
            <span>Priority: <span className="font-semibold text-gray-700">{lead.priority || 'Medium'}</span></span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-indigo-600">Value: {formatCurrency(lead.expectedRevenue || 0)}</span>
          </div>
        </div>
      </div>

      {/* Right side quick actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          variant="ghost" 
          onClick={onMarkLost}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold cursor-pointer py-1.5 px-3 border border-red-200"
        >
          <XCircle className="w-4 h-4 mr-1.5" /> Mark Lost
        </Button>
        <Button 
          onClick={onMarkWon}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer py-1.5 px-3"
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Mark Won
        </Button>
      </div>
    </div>
  );
}
