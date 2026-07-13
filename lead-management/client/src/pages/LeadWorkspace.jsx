import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ArrowLeft, User, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { leadsService, teamsService, tasksService } from '../services/mockData';
import { developersApi } from '../services/api/developersApi';
import { formatCurrency } from '../utils/currency';
import { AddDeveloperModal } from '../components/AddDeveloperModal';
import { AddTaskModal } from '../components/AddTaskModal';

export function LeadWorkspace() {
  const { teamLeaderId, leadId } = useParams();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [leader, setLeader] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    const [fetchedLead, allLeaders, allDevelopers, allTasks] = await Promise.all([
      leadsService.getById(leadId),
      teamsService.getAll(),
      developersApi.getAll({ limit: 100 }),
      tasksService.getAll()
    ]);
    
    setLead(fetchedLead);
    const foundLeader = allLeaders.find(tl => tl.id === teamLeaderId);
    setLeader(foundLeader);
    
    // Filter developers to those belonging to the leader's team
    const teamDevs = foundLeader ? allDevelopers.filter(d => d.teamId === foundLeader.teamId) : [];
    
    // Calculate stats for developers based on tasks
    const leadTasks = allTasks.filter(t => t.leadId === leadId);
    setTasks(leadTasks);
    
    const devsWithStats = teamDevs.map(dev => {
      const devTasks = leadTasks.filter(t => t.assignedDeveloper === dev.id);
      const completed = devTasks.filter(t => t.status === 'Done').length;
      const pending = devTasks.filter(t => t.status !== 'Done').length;
      const total = devTasks.length;
      const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        ...dev,
        currentTasks: pending,
        completedTasks: completed,
        pendingTasks: pending,
        totalAssigned: total,
        completionPct,
        workload: pending > 3 ? 'High' : pending > 0 ? 'Medium' : 'Low',
        performance: completionPct > 80 ? 'Excellent' : completionPct > 50 ? 'Good' : 'Needs Improvement',
        status: 'Active',
        lastActivity: new Date().toISOString().split('T')[0]
      };
    });
    
    setDevelopers(devsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [teamLeaderId, leadId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Lead Workspace...</div>;
  if (!lead) return <div className="p-8 text-center text-gray-500">Lead not found.</div>;

  const getWorkloadBadge = (workload) => {
    switch (workload) {
      case 'High': return <Badge variant="danger">High</Badge>;
      case 'Medium': return <Badge variant="warning">Medium</Badge>;
      case 'Low': return <Badge variant="success">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Button variant="ghost" onClick={() => navigate(`/teams/${teamLeaderId}`)} className="p-2 cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Lead Workspace under {leader?.name}</p>
        </div>
      </div>

      {/* Lead Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Company</p>
                <p className="font-medium text-gray-900">{lead.name || lead.companyName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Contact Person</p>
                <p className="font-medium text-gray-900">{lead.contactPerson}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Stage</p>
                <Badge variant="primary" className="mt-1">{lead.stage}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Expected Value</p>
                <p className="font-bold text-gray-900">{formatCurrency(lead.value)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Developer Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Developers</span>
                <span className="font-bold text-gray-900">{developers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Tasks</span>
                <span className="font-bold text-gray-900">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Pending Tasks</span>
                <span className="font-bold text-red-600">{tasks.filter(t => t.status !== 'Done').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Completed Tasks</span>
                <span className="font-bold text-emerald-600">{tasks.filter(t => t.status === 'Done').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Developers */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-gray-900">Assigned Developers ({developers.length})</h3>
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <Button variant="outline" className="flex items-center justify-center text-xs" onClick={() => setShowTaskModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Task
            </Button>
            <Button className="flex items-center justify-center text-xs" onClick={() => setShowDeveloperModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Developer
            </Button>
          </div>
        </div>

        {/* Desktop Table View */}
        <Card className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks (Pending / Total)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workload</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {developers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No developers assigned.</td>
                </tr>
              ) : developers.map((dev) => (
                <tr key={dev.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/teams/${teamLeaderId}/leads/${leadId}/developers/${dev.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                        {dev.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-blue-600 hover:underline">{dev.name}</div>
                        <div className="text-xs text-gray-500">{dev.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-505">
                    <span className="font-bold text-red-500">{dev.pendingTasks}</span> / {dev.totalAssigned}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${dev.completionPct}%` }}></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{dev.completionPct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getWorkloadBadge(dev.workload)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dev.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-4">
          {developers.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">No developers assigned.</Card>
          ) : (
            developers.map((dev) => (
              <Card 
                key={dev.id} 
                className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow relative border border-gray-100"
                onClick={() => navigate(`/teams/${teamLeaderId}/leads/${leadId}/developers/${dev.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                      {dev.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-600 hover:underline">{dev.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{dev.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{dev.status}</span>
                </div>
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 flex justify-between">
                  <div>
                    <span className="font-semibold text-gray-400">Tasks</span>
                    <p className="text-gray-900 font-bold mt-0.5">
                      <span className="text-red-500">{dev.pendingTasks}</span> / {dev.totalAssigned}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-400">Workload</span>
                    <div className="mt-1">{getWorkloadBadge(dev.workload)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-505 border-t border-gray-50 pt-2">
                  <span className="font-semibold text-gray-400 block mb-1">Completion</span>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${dev.completionPct}%` }}></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600 shrink-0">{dev.completionPct}%</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AddDeveloperModal 
        isOpen={showDeveloperModal} 
        onClose={() => setShowDeveloperModal(false)} 
        teamLeaderId={teamLeaderId}
        teamId={leader?.teamId || leader?.id} 
        leadId={leadId} 
        onSuccess={fetchWorkspaceData} 
      />

      <AddTaskModal 
        isOpen={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
        developers={developers} 
        leadId={leadId} 
        onSuccess={fetchWorkspaceData} 
      />
    </div>
  );
}
