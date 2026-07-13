import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Target, Users, IndianRupee, Activity, CheckSquare, TrendingUp, Calendar, Clock } from 'lucide-react';
import { usePageBranch } from '../hooks/usePageBranch';
import { useAuth } from '../context/AuthContext';
import { PageBranchSelector } from '../components/UI/PageBranchSelector';
import { formatCurrency } from '../utils/currency';
import { dashboardApi } from '../services/api/dashboardApi';

export function Dashboard() {
  const { currentBranchId, setCurrentBranchId, branches, currentBranch } = usePageBranch('dashboard');
  const { role, leaderId } = useAuth();
  const [stats, setStats] = useState({ totalLeads: 0, pipelineValue: 0, closedWon: 0, conversionRate: 0 });
  const [pipelineData, setPipelineData] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Role-specific stats states
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [branchPerformance, setBranchPerformance] = useState(0);
  const [teamPerformance, setTeamPerformance] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    const filters = {
      branchId: currentBranchId !== 'all' ? currentBranchId : undefined
    };

    Promise.all([
      dashboardApi.getSummary(filters),
      dashboardApi.getLeadFunnel(filters),
      dashboardApi.getRevenueTrend(filters),
      role === 'branch_manager' ? dashboardApi.getRecentActivities({ ...filters, limit: 5 }) : Promise.resolve([])
    ])
      .then(([summary, funnel, trend, activities]) => {
        if (!summary) {
          throw new Error('Summary data is empty');
        }
        setStats({
          totalLeads: summary.totalLeads ?? 0,
          pipelineValue: summary.pipelineValue ?? 0,
          closedWon: summary.closedWon ?? 0,
          conversionRate: summary.conversionRate ?? 0
        });

        setPipelineData(funnel || []);

        setChartData((trend || []).map(item => ({
          name: item.name,
          revenue: Number(item.value) || 0
        })));

        if (role === 'team_leader') {
          setCompletedTasksCount(summary.completedTasks ?? 0);
          setPendingTasksCount(summary.pendingTasks ?? 0);
        } else if (role === 'branch_manager' || role === 'admin') {
          setBranchPerformance(summary.branchPerformance ?? 0);
          setTeamPerformance(summary.teamPerformance ?? 0);
          
          const mappedActivities = (activities || []).map(act => ({
            id: act.id,
            leadName: act.leadName || 'System',
            action: act.action,
            time: act.time ? new Date(act.time).toLocaleDateString() : 'Today'
          }));
          setRecentActivities(mappedActivities);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('Dashboard: Fetching dashboard data failed', err);
        setError(true);
        setLoading(false);
        setStats({ totalLeads: '—', pipelineValue: '—', closedWon: '—', conversionRate: '—' });
        setCompletedTasksCount('—');
        setPendingTasksCount('—');
        setBranchPerformance('—');
        setTeamPerformance('—');
        setRecentActivities([]);
        setPipelineData([]);
        setChartData([]);
      });
  }, [currentBranchId, role, leaderId]);

  const formatStat = (val, isCurrency = false) => {
    if (val === '—' || val === null || val === undefined || isNaN(Number(val))) return '—';
    return isCurrency ? formatCurrency(Number(val)) : val;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {useAuth().backendRole === 'SUPER_ADMIN' && (
          <PageBranchSelector 
            currentBranchId={currentBranchId}
            setCurrentBranchId={setCurrentBranchId}
            branches={branches}
            currentBranch={currentBranch}
          />
        )}
      </div>

      {/* 1. Team Leader Dashboard */}
      {role === 'team_leader' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <Target className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Assigned Leads</p>
                <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.totalLeads)}</h4>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Expected Revenue</p>
                <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.pipelineValue, true)}</h4>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Pending Tasks</p>
                <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(pendingTasksCount)}</h4>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6 flex items-center">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mr-4">
                <CheckSquare className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">Completed Tasks</p>
                <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(completedTasksCount)}</h4>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Branch Manager Dashboard */}
      {role === 'branch_manager' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <Target className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Active Leads</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.totalLeads)}</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Closed Revenue</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.closedWon, true)}</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Branch Performance</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">
                    {branchPerformance === '—' ? '—' : `${branchPerformance}%`}
                  </h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <Users className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Team Performance</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">
                    {teamPerformance === '—' ? '—' : `${teamPerformance}%`}
                  </h4>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>Branch Revenue (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280' }}
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${val / 10000000} Cr`;
                          if (val >= 100000) return `₹${val / 100000} L`;
                          return `₹${val}`;
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full bg-white border border-gray-200 rounded-xl">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-gray-900 font-bold text-base flex items-center">
                  <Activity className="w-5 h-5 text-indigo-500 mr-2" /> Recent Branch Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act) => (
                    <div key={act.id} className="flex items-start space-x-3 text-xs pb-3 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{act.leadName}</p>
                        <p className="text-gray-500 mt-0.5">{act.action}</p>
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {act.time}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">No recent activity</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 3. System Admin Dashboard */}
      {role === 'admin' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <Target className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Total Leads</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.totalLeads)}</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Open Pipeline</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.pipelineValue, true)}</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Closed Won (YTD)</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">{formatStat(stats.closedWon, true)}</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                  <Users className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">Conversion Rate</p>
                  <h4 className="text-xl font-bold text-gray-900 truncate">
                    {stats.conversionRate === '—' ? '—' : `${stats.conversionRate}%`}
                  </h4>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>Revenue (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280' }}
                        tickFormatter={(val) => {
                          if (val >= 10000000) return `₹${val / 10000000} Cr`;
                          if (val >= 100000) return `₹${val / 100000} L`;
                          return `₹${val}`;
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle>Leads by Stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex flex-col items-center">
                  <div className="flex-1 w-full relative -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pipelineData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pipelineData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2 flex-wrap mb-4">
                    {pipelineData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-sm text-gray-600">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        {entry.name} ({entry.value})
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
