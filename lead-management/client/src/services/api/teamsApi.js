import apiClient from './apiClient';

/**
 * Maps database team leader entity to frontend team leader model.
 */
const mapBackendToFrontend = (tl) => {
  if (!tl) return null;

  // When data comes from /teams endpoint, the row's `id` is the team ID and
  // the leader profile ID is in `team_leader_profile_id`.
  // When data comes from /team-leaders endpoint, the row's `id` IS the leader
  // profile ID and `team_id` holds the team ID.
  const hasLeaderProfileId = !!tl.team_leader_profile_id;
  const leaderProfileId = hasLeaderProfileId ? tl.team_leader_profile_id : tl.id;
  const teamId = hasLeaderProfileId ? tl.id : tl.team_id;

  return {
    id: leaderProfileId,       // always the team leader profile UUID
    teamId: teamId,            // always the team UUID
    userId: tl.user_id,
    name: tl.name || (tl.leader_name || 'N/A'),
    employeeId: tl.employee_id || (tl.leader_employee_id || 'N/A'),
    designation: tl.designation || (tl.leader_designation || 'Team Leader'),
    branchId: tl.branch_id,
    branchName: tl.branch_name || '',
    department: tl.department || 'CRM Development',
    teamName: tl.team_name || '',
    email: tl.email || (tl.leader_email || ''),
    mobile: tl.phone || '',
    status: tl.status || 'Active',
    performance: tl.performance_score || 90,
    developers: Array(Number(tl.developer_count) || 0).fill(''), // Mapped developers count placeholder
    activeLeads: Number(tl.active_leads) || 0,
    activeProjects: Number(tl.active_projects) || 0,
    completedTasks: Number(tl.completed_tasks) || 0,
    pendingTasks: Number(tl.pending_tasks) || 0
  };
};


export const teamsApi = {
  getTeams: async (params = {}) => {
    const response = await apiClient.get('/teams', { params });
    return {
      success: response.data.success,
      data: (response.data.data || []).map(mapBackendToFrontend),
      pagination: response.data.pagination
    };
  },

  getTeam: async (id) => {
    const response = await apiClient.get(`/teams/${id}`);
    return {
      success: response.data.success,
      data: mapBackendToFrontend(response.data.data)
    };
  },

  createTeam: async (data) => {
    const payload = {
      team_name: data.teamName,
      branch_id: data.branchId,
      department: data.department,
      leader_name: data.name,
      leader_email: data.email,
      leader_password: data.password,
      employee_id: data.employeeId,
      designation: data.designation
    };
    const response = await apiClient.post('/teams', payload);
    return response.data;
  },

  updateTeam: async (id, data) => {
    const payload = {
      team_name: data.teamName,
      branch_id: data.branchId,
      department: data.department
    };
    const response = await apiClient.patch(`/teams/${id}`, payload);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await apiClient.delete(`/teams/${id}`);
    return response.data;
  },

  getTeamStatistics: async () => {
    const response = await apiClient.get('/teams/statistics');
    return response.data;
  },

  getTeamLeaders: async (params = {}) => {
    const response = await apiClient.get('/team-leaders', { params });
    return {
      success: response.data.success,
      data: (response.data.data || []).map(mapBackendToFrontend),
      pagination: response.data.pagination
    };
  },

  getTeamLeader: async (id) => {
    const response = await apiClient.get(`/team-leaders/${id}`);
    return {
      success: response.data.success,
      data: mapBackendToFrontend(response.data.data)
    };
  },

  createTeamLeader: async (data) => {
    const payload = {
      team_id: data.teamId,
      name: data.name,
      email: data.email,
      password: data.password,
      employee_id: data.employeeId,
      designation: data.designation,
      performance_score: data.performance !== undefined ? Number(data.performance) : undefined
    };
    const response = await apiClient.post('/team-leaders', payload);
    return response.data;
  },

  updateTeamLeader: async (id, data) => {
    const payload = {
      designation: data.designation,
      employee_id: data.employeeId,
      performance_score: data.performance !== undefined ? Number(data.performance) : undefined
    };
    const response = await apiClient.patch(`/team-leaders/${id}`, payload);
    return response.data;
  },

  deleteTeamLeader: async (id) => {
    const response = await apiClient.delete(`/team-leaders/${id}`);
    return response.data;
  },

  assignDevelopers: async (teamLeaderId, data) => {
    const developerIds = data.developerIds || data.developer_ids || data;
    const response = await apiClient.post(`/team-leaders/${teamLeaderId}/developers`, {
      developer_ids: Array.isArray(developerIds) ? developerIds : [developerIds]
    });
    return response.data;
  },

  getAssignedDevelopers: async (teamLeaderId) => {
    const response = await apiClient.get(`/team-leaders/${teamLeaderId}/developers`);
    return response.data;
  },

  getPerformance: async (teamLeaderId) => {
    const response = await apiClient.get(`/team-leaders/${teamLeaderId}/performance`);
    return response.data;
  },

  getDashboardStats: async (teamLeaderId) => {
    const response = await apiClient.get(`/team-leaders/${teamLeaderId}/dashboard-stats`);
    return response.data;
  }
};
