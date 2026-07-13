import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { ArrowLeft, Briefcase, Mail, Phone, TrendingUp, ShieldCheck, CheckCircle2, Clock, Calendar, Activity } from 'lucide-react';
import { leadsService, branchService } from '../services/mockData';
import { teamsApi } from '../services/api/teamsApi';
import { formatCurrency } from '../utils/currency';
import { useAuth } from '../context/AuthContext';

export function TeamLeaderDetails() {
  const { teamLeaderId } = useParams();
  const navigate = useNavigate();
  const { role, leaderId, branch: authBranch } = useAuth();
  const [leader, setLeader] = useState(null);
  const [leads, setLeads] = useState([]);
  const [branchesMap, setBranchesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [developers, setDevelopers] = useState([]);
  const [perfMetrics, setPerfMetrics] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const leaderResponse = await teamsApi.getTeamLeader(teamLeaderId);
        const foundLeader = leaderResponse.data;

        if (foundLeader) {
          if (role === 'branch_manager' && foundLeader.branchId !== authBranch) {
            navigate('/unauthorized');
            return;
          }
          if (role === 'team_leader' && foundLeader.id !== leaderId) {
            navigate('/unauthorized');
            return;
          }
          setLeader(foundLeader);

          // Fetch secondary data independently so failures don't crash the page
          Promise.allSettled([
            teamsApi.getAssignedDevelopers(teamLeaderId),
            teamsApi.getPerformance(teamLeaderId),
            teamsApi.getDashboardStats(teamLeaderId),
            leadsService.getAll(),
            branchService.getAll()
          ]).then(([devRes, perfRes, dashRes, leadsRes, branchesRes]) => {
            if (devRes.status === 'fulfilled') setDevelopers(devRes.value.data || []);
            if (perfRes.status === 'fulfilled') setPerfMetrics(perfRes.value.data || null);
            if (dashRes.status === 'fulfilled') setDashboardStats(dashRes.value.data || null);
            
            if (leadsRes.status === 'fulfilled') {
              setLeads(leadsRes.value.filter(l => l.assignedTo === foundLeader.teamId));
            }
            
            if (branchesRes.status === 'fulfilled') {
              const bMap = {};
              branchesRes.value.forEach(b => bMap[b.id] = b.name);
              setBranchesMap(bMap);
            }
          });
        } else {
          setLeader(null);
        }
      } catch (err) {
        console.error('Error fetching team leader details:', err);
        setLeader(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teamLeaderId]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Team Leader Details...</div>;
  if (!leader) return <div className="p-8 text-center text-gray-500">Team Leader not found.</div>;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'On Leave': return <Badge variant="warning">On Leave</Badge>;
      default: return <Badge variant="danger">Inactive</Badge>;
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

  const todaysTasks = dashboardStats ? dashboardStats.todayTasks : '--';
  const pendingTasks = dashboardStats ? dashboardStats.pendingTasks : '--';
  const completedTasks = dashboardStats ? dashboardStats.completedTasks : '--';
  const recentActivity = dashboardStats ? dashboardStats.recentActivity : '--';
  const performance = perfMetrics ? perfMetrics.performance_score : leader.performance;
  const teamHealth = perfMetrics ? perfMetrics.team_health : 'Good';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        {role !== 'team_leader' && (
          <Button variant="ghost" onClick={() => navigate('/teams')} className="p-2 cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{role === 'team_leader' ? 'My Team' : `${leader.name}'s Profile`}</h1>
          <p className="text-sm text-gray-500 mt-1">Detailed performance and assigned leads.</p>
        </div>
      </div>

      {/* Profile card summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex-1">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-2xl mr-4 shadow-sm">
                {leader.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">{leader.name}</h4>
                <p className="text-sm text-gray-500 font-medium">{leader.designation}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-600 capitalize">ID: {leader.employeeId}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 capitalize">{branchesMap[leader.branchId] || leader.branchId}</span>
                  {getStatusBadge(leader.status)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="p-3 border border-gray-100 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Department</span>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{leader.department}</p>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Team Name</span>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">{leader.teamName || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Developers Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Development Team ({developers.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {developers.map((dev) => (
            <Card key={dev.id} className="hover:shadow-md transition-shadow bg-white border border-gray-100">
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm shadow-2xs">
                  {dev.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{dev.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Developer</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leads Table (Desktop) */}
      <div className="mt-8 hidden md:block">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Assigned Leads ({leads.length})</h3>
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No leads assigned.</td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/teams/${teamLeaderId}/leads/${lead.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900 hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{lead.companyName}</div>
                    <div className="text-xs text-gray-400">{branchesMap[lead.branchId]}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getStageBadgeVariant(lead.stage)}>{lead.stage}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {formatCurrency(lead.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.lastActivityDate || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Leads Cards (Mobile) */}
      <div className="mt-8 block md:hidden">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Assigned Leads ({leads.length})</h3>
        <div className="space-y-4">
          {leads.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">No leads assigned.</Card>
          ) : (
            leads.map((lead) => (
              <Card key={lead.id} className="p-4 space-y-3 relative border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/teams/${teamLeaderId}/leads/${lead.id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{lead.companyName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{branchesMap[lead.branchId]}</p>
                  </div>
                  <Badge variant={getStageBadgeVariant(lead.stage)}>{lead.stage}</Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                  <span>Last Activity: {lead.lastActivityDate || 'N/A'}</span>
                  <span className="font-bold text-gray-900">{formatCurrency(lead.value)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
