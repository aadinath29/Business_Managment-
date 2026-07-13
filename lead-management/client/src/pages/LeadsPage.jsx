import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Badge } from '../components/UI/Badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { leadsService, teamsService, branchService } from '../services/mockData';
import { NewLeadModal } from '../components/Modals/NewLeadModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import { usePageBranch } from '../hooks/usePageBranch';
import { PageBranchSelector } from '../components/UI/PageBranchSelector';

export function LeadsPage() {
  const { role, leaderId, teamId } = useAuth();
  const [leads, setLeads] = useState([]);
  const [teamLeadersMap, setTeamLeadersMap] = useState({});
  const [branchesMap, setBranchesMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const { currentBranchId, setCurrentBranchId, branches, currentBranch } = usePageBranch('leads');

  const fetchData = async () => {
    const [fetchedLeads, fetchedTeamLeaders, fetchedBranches] = await Promise.all([
      leadsService.getAll(),
      teamsService.getAll(),
      branchService.getAll()
    ]);
    
    let activeLeads = fetchedLeads;
      
    if (role === 'team_leader') {
      activeLeads = activeLeads.filter(l => l.assignedTo === leaderId || (teamId && l.assignedTo === teamId));
    }

    if (currentBranchId !== 'all') {
      activeLeads = activeLeads.filter(l => l.branchId === currentBranchId);
    }
      
    setLeads(activeLeads);
    
    const tlMap = {};
    fetchedTeamLeaders.forEach(tl => {
      tlMap[tl.id] = tl.name;
      if (tl.teamId) {
        tlMap[tl.teamId] = tl.name;
      }
    });
    setTeamLeadersMap(tlMap);
    
    const bMap = {};
    fetchedBranches.forEach(b => bMap[b.id] = b.name);
    setBranchesMap(bMap);
  };

  useEffect(() => {
    fetchData();
  }, [currentBranchId]);

  const handleSaveLead = async (leadData) => {
    // Throws on failure — modal catches it and stays open
    if (editingLead) {
      await leadsService.update(editingLead.id, leadData);
    } else {
      await leadsService.create(leadData);
    }
    fetchData(); // Refresh list after successful create/update
  };

  const handleEditClick = async (id) => {
    try {
      const fullLead = await leadsService.getById(id);
      setEditingLead(fullLead);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch lead for editing", err);
      alert("Failed to load lead details.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      await leadsService.delete(id);
      fetchData();
    }
  };

  const getStageBadgeVariant = (stage) => {
    switch (stage) {
      case 'New': return 'primary';
      case 'Closed Won': return 'success';
      case 'Closed Lost': return 'danger';
      case 'Negotiation': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your potential sales.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <PageBranchSelector 
            currentBranchId={currentBranchId}
            setCurrentBranchId={setCurrentBranchId}
            branches={branches}
            currentBranch={currentBranch}
          />
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Leader</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No leads found. Create one!</td>
              </tr>
            ) : leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/leads/${lead.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline">
                    {lead.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{lead.contactPerson || lead.companyName || '—'}</div>
                  <div className="text-xs text-gray-400">{branchesMap[lead.branchId]}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStageBadgeVariant(lead.stage)}>{lead.stage}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(lead.value)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {teamLeadersMap[lead.assignedTo]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-505">
                  {lead.lastActivityDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    className="text-blue-600 hover:text-blue-900 mr-3 transition-colors p-1 rounded hover:bg-blue-50"
                    onClick={() => handleEditClick(lead.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50" onClick={() => handleDelete(lead.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {leads.length === 0 ? (
          <Card className="p-6 text-center text-gray-505">No leads found. Create one!</Card>
        ) : (
          leads.map((lead) => (
            <Card key={lead.id} className="p-4 hover:shadow-md transition-shadow relative space-y-3 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/leads/${lead.id}`} className="text-base font-semibold text-blue-600 hover:underline">
                    {lead.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-0.5">{lead.contactPerson || lead.companyName || '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{branchesMap[lead.branchId]}</p>
                </div>
                <Badge variant={getStageBadgeVariant(lead.stage)}>{lead.stage}</Badge>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px]">Value</span>
                  <span className="font-bold text-gray-900">{formatCurrency(lead.value)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase font-bold text-[9px]">Team Leader</span>
                  <span>{teamLeadersMap[lead.assignedTo]}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-55 pt-2">
                <span>Last Activity: {lead.lastActivityDate}</span>
                <div className="flex space-x-2">
                  <button 
                    className="text-blue-600 hover:text-blue-900 transition-colors p-1.5 rounded hover:bg-blue-50"
                    onClick={() => handleEditClick(lead.id)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900 transition-colors p-1.5 rounded hover:bg-red-50" onClick={() => handleDelete(lead.id)}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <NewLeadModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
        }} 
        onSave={handleSaveLead}
        leadToEdit={editingLead}
      />
    </div>
  );
}
