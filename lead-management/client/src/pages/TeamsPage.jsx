import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/UI/Card';
import { Badge } from '../components/UI/Badge';
import { Button } from '../components/UI/Button';
import { Select } from '../components/UI/Select';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import {
  Users, User, MapPin, Briefcase, Mail, Phone,
  X, Check, AlertCircle, TrendingUp, Layers, CheckSquare,
  Award, Search, Filter, MoreVertical, SlidersHorizontal, Plus, ShieldCheck,
  Edit, Trash2
} from 'lucide-react';
import { teamsApi } from '../services/api/teamsApi';
import { branchApi } from '../services/api/branchApi';

import { useAuth } from '../context/AuthContext';

export function TeamsPage() {
  const { role, branch: authBranch } = useAuth();
  const navigate = useNavigate();
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPerformance, setFilterPerformance] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // UI views & Modals
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newLeader, setNewLeader] = useState({
    name: '',
    employeeId: '',
    designation: 'Team Leader',
    branchId: '',
    department: 'CRM Development',
    email: '',
    mobile: '',
    teamName: '',
    developers: '',
    status: 'Active',
    password: '',
    confirmPassword: ''
  });

  const [editingLeader, setEditingLeader] = useState(null);
  const [editFields, setEditFields] = useState({
    teamName: '',
    department: 'CRM Development',
    designation: 'Team Leader',
    employeeId: '',
    performance: 90
  });

  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchQuery(searchVal);
      setPage(1);
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);



  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchQuery || undefined,
        branch_id: filterBranch || undefined,
        department: filterDept || undefined,
        has_leader: 'true' // hide teams whose leader was deleted (no "N/A" rows)
      };

      const [teamsRes, branchesRes, statsRes] = await Promise.all([
        teamsApi.getTeams(params),
        branchApi.getBranches({ limit: 100 }),
        teamsApi.getTeamStatistics()
      ]);

      setTeamLeaders(teamsRes.data || []);
      setAllBranches(branchesRes.data || []);
      setStats(statsRes.data || statsRes);

      if (teamsRes.pagination) {
        setTotal(teamsRes.pagination.total || 0);
        setTotalPages(teamsRes.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, searchQuery, filterBranch, filterDept]);

  // Derived dashboard stats
  const totalTeamLeaders = stats ? stats.total_team_leaders : teamLeaders.length;
  const totalTeams = stats ? stats.total_teams : teamLeaders.filter(tl => tl.teamName).length;
  const activeDevelopers = stats ? stats.total_developers : teamLeaders.reduce((acc, tl) => acc + (tl.developers?.length || 0), 0);
  const avgTeamSize = totalTeams ? Math.round(activeDevelopers / totalTeams) : 0;

  const busyTeams = teamLeaders.filter(tl => tl.status === 'On Leave' || tl.pendingTasks > 8).length;
  const availableTeams = teamLeaders.filter(tl => tl.status === 'Active' && tl.pendingTasks <= 8).length;

  const highestPerformingTeam = teamLeaders.length
    ? [...teamLeaders].sort((a, b) => b.performance - a.performance)[0]
    : null;

  const lowestWorkloadTeam = teamLeaders.length
    ? [...teamLeaders].sort((a, b) => (a.activeLeads + a.pendingTasks) - (b.activeLeads + b.pendingTasks))[0]
    : null;

  // Local Dropdown Filter Logic for status, performance, and availability
  const filteredTeamLeaders = teamLeaders.filter(tl => {
    const matchesStatus = !filterStatus || tl.status === filterStatus;

    const matchesPerformance = !filterPerformance || (
      filterPerformance === 'High' ? tl.performance >= 90 :
        filterPerformance === 'Medium' ? (tl.performance >= 80 && tl.performance < 90) :
          tl.performance < 80
    );

    const matchesAvailability = !filterAvailability || (
      filterAvailability === 'Available' ? tl.status === 'Active' :
        filterAvailability === 'Busy' ? tl.status === 'On Leave' :
          tl.status === 'Inactive'
    );

    return matchesStatus && matchesPerformance && matchesAvailability;
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  const handleSaveLeader = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!newLeader.name || !newLeader.email || !newLeader.password) {
      setValidationError('Name, Email, and Password are required');
      return;
    }

    if (newLeader.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (newLeader.password !== newLeader.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    let targetBranchId = newLeader.branchId;
    if (role === 'branch_manager' || role === 'team_leader') {
      targetBranchId = authBranch;
    }

    try {
      await teamsApi.createTeam({
        ...newLeader,
        branchId: targetBranchId
      });

      setIsAddModalOpen(false);
      setValidationError('');
      showSuccess('Team Leader created successfully');
      setNewLeader({
        name: '',
        employeeId: '',
        designation: 'Team Leader',
        branchId: '',
        department: 'CRM Development',
        email: '',
        mobile: '',
        teamName: '',
        developers: '',
        status: 'Active',
        password: '',
        confirmPassword: ''
      });
      fetchData();
    } catch (err) {
      setValidationError(err.response?.data?.error?.message || err.message || 'Failed to save team leader');
    }
  };

  const handleEditLeader = (tl) => {
    setEditingLeader(tl);
    setEditFields({
      teamName: tl.teamName || '',
      department: tl.department || 'CRM Development',
      designation: tl.designation || 'Team Leader',
      employeeId: tl.employeeId || '',
      performance: tl.performance || 90
    });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateLeader = async (e) => {
    e.preventDefault();
    setValidationError('');

    try {
      // 1. Update Team details if teamId exists and fields changed
      if (editingLeader.teamId && (editFields.teamName !== editingLeader.teamName || editFields.department !== editingLeader.department)) {
        await teamsApi.updateTeam(editingLeader.teamId, {
          teamName: editFields.teamName,
          department: editFields.department,
          branchId: editingLeader.branchId
        });
      }

      // 2. Update Leader Profile details (PATCH /api/v1/team-leaders/:id)
      await teamsApi.updateTeamLeader(editingLeader.id, {
        designation: editFields.designation,
        employeeId: editFields.employeeId,
        performance: editFields.performance
      });

      setIsEditModalOpen(false);
      setEditingLeader(null);
      showSuccess('Team Leader details updated successfully');
      fetchData();
    } catch (err) {
      setValidationError(err.response?.data?.error?.message || err.message || 'Failed to update team details');
    }
  };

  const handleDeleteLeader = async (tl) => {
    if (window.confirm('Are you sure you want to delete this Team Leader?')) {
      try {
        await teamsApi.deleteTeamLeader(tl.id);
        showSuccess('Team Leader deleted successfully');
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error?.message || err.message || 'Failed to delete team leader');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active': return <Badge variant="success">Active</Badge>;
      case 'On Leave': return <Badge variant="warning">On Leave</Badge>;
      default: return <Badge variant="danger">Inactive</Badge>;
    }
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">★ {score}%</span>;
    if (score >= 80) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">★ {score}%</span>;
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">★ {score}%</span>;
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-400 text-emerald-700 text-xs font-semibold rounded-md flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Headings */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Leaders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Team Leaders and their Development Teams.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto justify-center cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Add Team Leader
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Leaders / Teams</p>
              <h4 className="text-2xl font-bold text-gray-900">{totalTeamLeaders} / {totalTeams}</h4>
              <p className="text-xs text-gray-500 mt-1">Avg size: {avgTeamSize} Devs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Developers</p>
              <h4 className="text-2xl font-bold text-gray-900">{activeDevelopers}</h4>
              <p className="text-xs text-gray-500 mt-1">{availableTeams} Teams available</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Performance Score</p>
              <h4 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                ★ {stats?.average_performance || '0.0'}%
              </h4>
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                {highestPerformingTeam ? `Top: ${highestPerformingTeam.name}` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lowest Workload Team</p>
              <h4 className="text-lg font-bold text-gray-900 truncate max-w-[180px]">
                {lowestWorkloadTeam ? lowestWorkloadTeam.name : 'N/A'}
              </h4>
              <p className="text-xs text-orange-600 mt-1">
                {lowestWorkloadTeam ? `${lowestWorkloadTeam.activeLeads + lowestWorkloadTeam.pendingTasks} open items` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search by Leader Name, Employee ID, Department, Team name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => {
                setSearchVal('');
                setSearchQuery('');
                setFilterBranch('');
                setFilterDept('');
                setFilterStatus('');
                setFilterPerformance('');
                setFilterAvailability('');
                setPage(1);
              }} className="text-xs cursor-pointer">
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2 border-t border-gray-100">
            {(role === 'admin' || role === 'SUPER_ADMIN') && (
              <Select
                options={[{ label: 'All Branches', value: '' }, ...allBranches.map(b => ({ label: b.name, value: b.id }))]}
                value={filterBranch}
                onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }}
              />
            )}
            <Select
              options={[
                { label: 'All Departments', value: '' },
                { label: 'CRM Development', value: 'CRM Development' },
                { label: 'Cloud Solutions', value: 'Cloud Solutions' },
                { label: 'Enterprise Integrations', value: 'Enterprise Integrations' },
                { label: 'Data Platforms', value: 'Data Platforms' },
                { label: 'Business Automation', value: 'Business Automation' }
              ]}
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            />
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'Active' },
                { label: 'On Leave', value: 'On Leave' },
                { label: 'Inactive', value: 'Inactive' }
              ]}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
            <Select
              options={[
                { label: 'All Performance', value: '' },
                { label: 'High (>=90%)', value: 'High' },
                { label: 'Medium (80%-90%)', value: 'Medium' },
                { label: 'Low (<80%)', value: 'Low' }
              ]}
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
            />
            <Select
              options={[
                { label: 'All Availability', value: '' },
                { label: 'Available (Active)', value: 'Available' },
                { label: 'Busy (On Leave)', value: 'Busy' }
              ]}
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Desktop Table view */}
      <Card className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Leader</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department / Team</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Developers</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Leads</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Tasks</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeamLeaders.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-medium">No Team Leaders match the selected filters.</td>
              </tr>
            ) : filteredTeamLeaders.map((tl) => (
              <tr
                key={tl.id}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/teams/${tl.id}`)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                      {tl.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{tl.name}</div>
                      <div className="text-xs text-gray-400 font-medium">{tl.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                  {allBranches.find(b => b.id === tl.branchId)?.branchName || tl.branchId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-800 font-medium">{tl.department}</div>
                  <div className="text-xs text-gray-400 font-bold">{tl.teamName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">
                      {tl.developers?.length || 0} Assigned
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-semibold">
                  {tl.activeLeads}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  {tl.completedTasks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-500 font-semibold">
                  {tl.pendingTasks}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getPerformanceBadge(tl.performance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(tl.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  {(role === 'admin' || role === 'branch_manager') && (
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditLeader(tl)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                        title="Edit Team Leader"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLeader(tl)}
                        className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                        title="Delete Team Leader"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Tablet & Mobile Card view */}
      <div className="block lg:hidden space-y-4">
        {filteredTeamLeaders.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">No Team Leaders match the selected filters.</Card>
        ) : (
          filteredTeamLeaders.map((tl) => (
            <Card
              key={tl.id}
              className="p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow relative border border-gray-100"
              onClick={() => navigate(`/teams/${tl.id}`)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                    {tl.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{tl.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {tl.employeeId} • {allBranches.find(b => b.id === tl.branchId)?.branchName || tl.branchId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  {getStatusBadge(tl.status)}
                  {(role === 'admin' || role === 'branch_manager') && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditLeader(tl)}
                        className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLeader(tl)}
                        className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 flex justify-between">
                <div>
                  <span className="font-semibold text-gray-400">Dept / Team</span>
                  <p className="text-gray-800 font-medium mt-0.5">{tl.department}</p>
                  <p className="text-gray-500 mt-0.5">{tl.teamName}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-400">Performance</span>
                  <div className="mt-1">{getPerformanceBadge(tl.performance)}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center bg-gray-50 p-2 rounded-lg text-xs">
                <div>
                  <span className="text-gray-400 block">Devs</span>
                  <span className="font-bold text-gray-700">{tl.developers?.length || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Leads</span>
                  <span className="font-bold text-gray-700">{tl.activeLeads}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Done</span>
                  <span className="font-bold text-emerald-600">{tl.completedTasks}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Pend</span>
                  <span className="font-bold text-red-500">{tl.pendingTasks}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 border border-gray-200 rounded-lg shrink-0">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="text-xs"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-700">
                Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> (<span className="font-semibold">{total}</span> total teams)
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="rounded-l-md text-xs py-1 px-2.5 cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="rounded-r-md text-xs py-1 px-2.5 cursor-pointer"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Leader Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setValidationError(''); }} title="Add Team Leader">
        <form onSubmit={handleSaveLeader} className="space-y-6">
          {validationError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs font-semibold rounded-md">
              {validationError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Leader Name"
              name="name"
              value={newLeader.name}
              onChange={(e) => setNewLeader({ ...newLeader, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              required
            />
            <Input
              label="Employee ID"
              name="employeeId"
              value={newLeader.employeeId}
              onChange={(e) => setNewLeader({ ...newLeader, employeeId: e.target.value })}
              placeholder="e.g. EMP107"
              required
            />
            <Input
              label="Designation"
              name="designation"
              value={newLeader.designation}
              onChange={(e) => setNewLeader({ ...newLeader, designation: e.target.value })}
              placeholder="e.g. Team Leader"
            />
            <Input
              label="Department"
              name="department"
              value={newLeader.department}
              onChange={(e) => setNewLeader({ ...newLeader, department: e.target.value })}
              placeholder="e.g. CRM Development"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={newLeader.email}
              onChange={(e) => setNewLeader({ ...newLeader, email: e.target.value })}
              placeholder="e.g. rahul.s@kosqu.com"
              required
            />
            <Input
              label="Mobile"
              name="mobile"
              value={newLeader.mobile}
              onChange={(e) => setNewLeader({ ...newLeader, mobile: e.target.value })}
              placeholder="e.g. +91 98765 43210"
            />
            <Input
              label="Password *"
              name="password"
              type="password"
              value={newLeader.password}
              onChange={(e) => setNewLeader({ ...newLeader, password: e.target.value })}
              placeholder="Min 8 characters"
              required
            />
            <Input
              label="Confirm Password *"
              name="confirmPassword"
              type="password"
              value={newLeader.confirmPassword}
              onChange={(e) => setNewLeader({ ...newLeader, confirmPassword: e.target.value })}
              placeholder="Confirm password"
              required
            />
            <Input
              label="Team Name"
              name="teamName"
              value={newLeader.teamName}
              onChange={(e) => setNewLeader({ ...newLeader, teamName: e.target.value })}
              placeholder="e.g. Mumbai Spartans"
            />
            {(role === 'admin' || role === 'SUPER_ADMIN') && (
              <Select
                label="Branch"
                name="branchId"
                value={newLeader.branchId}
                onChange={(e) => setNewLeader({ ...newLeader, branchId: e.target.value })}
                options={allBranches.map(b => ({ label: b.name, value: b.id }))}
                required
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => { setIsAddModalOpen(false); setValidationError(''); }}>Cancel</Button>
            <Button type="submit">Save Team Leader</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Team Leader Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setValidationError(''); setEditingLeader(null); }} title="Edit Team Details">
        {editingLeader && (
          <form onSubmit={handleUpdateLeader} className="space-y-6">
            {validationError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-xs font-semibold rounded-md">
                {validationError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Team Name"
                name="teamName"
                value={editFields.teamName}
                onChange={(e) => setEditFields({ ...editFields, teamName: e.target.value })}
                placeholder="e.g. Mumbai Spartans"
                required
              />
              <Input
                label="Department"
                name="department"
                value={editFields.department}
                onChange={(e) => setEditFields({ ...editFields, department: e.target.value })}
                placeholder="e.g. CRM Development"
                required
              />
              <Input
                label="Designation"
                name="designation"
                value={editFields.designation}
                onChange={(e) => setEditFields({ ...editFields, designation: e.target.value })}
                placeholder="e.g. Team Leader"
                required
              />
              <Input
                label="Employee ID"
                name="employeeId"
                value={editFields.employeeId}
                onChange={(e) => setEditFields({ ...editFields, employeeId: e.target.value })}
                placeholder="e.g. EMP107"
                required
              />
              <Input
                label="Performance Score (%)"
                name="performance"
                type="number"
                min="0"
                max="100"
                value={editFields.performance}
                onChange={(e) => setEditFields({ ...editFields, performance: parseInt(e.target.value, 10) })}
                placeholder="e.g. 90"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => { setIsEditModalOpen(false); setValidationError(''); setEditingLeader(null); }}>Cancel</Button>
              <Button type="submit">Update Details</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
