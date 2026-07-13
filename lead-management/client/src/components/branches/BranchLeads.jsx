import React, { useState, useEffect } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { useNavigate } from 'react-router-dom';
import { leadsService } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';

export function BranchLeads({ branch }) {
  const navigate = useNavigate();
  const { role, branch: authBranch, leaderId, teamId } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    leadsService.getAll().then((allLeads) => {
      if (!active) return;
      
      let filteredLeads = allLeads;

      if (role === 'admin') {
        filteredLeads = allLeads.filter(l => l.branchId === branch.id);
      } else if (role === 'branch_manager') {
        filteredLeads = allLeads.filter(l => l.branchId === authBranch);
      } else if (role === 'team_leader') {
        filteredLeads = allLeads.filter(l => l.branchId === authBranch && (l.assignedTo === leaderId || (teamId && l.assignedTo === teamId)));
      }

      setLeads(filteredLeads.slice(0, 5));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [branch.id, role, authBranch, leaderId]);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex items-center justify-center text-xs text-gray-400">
        Loading recent leads...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3 select-none">
      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b">Recent Leads</h4>
      
      <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
        {leads.length > 0 ? (
          leads.map(lead => (
            <div 
              key={lead.id} 
              onClick={() => navigate(`/leads/${lead.id}`, {
                state: {
                  source: "branches",
                  branchId: branch.id
                }
              })}
              className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-1 rounded-lg cursor-pointer group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-500">
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{lead.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">{lead.status}</p>
                </div>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <span className="font-bold text-gray-800 font-mono">{formatCurrency(lead.value)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-gray-400">
            No recent leads
          </div>
        )}
      </div>
    </div>
  );
}
