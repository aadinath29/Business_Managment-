import apiClient from './apiClient';

const mapBackendToFrontend = (d) => {
  if (!d) return null;
  return {
    id: d.id || d.developer_id, // developer profile ID or user ID
    userId: d.user_id,
    name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'N/A',
    employeeId: d.employee_id || 'N/A',
    email: d.email || '',
    phone: d.phone || '',
    role: 'Developer',
    department: d.department || 'CRM Development',
    teamLeaderId: d.team_leader_id || d.team_leader_profile_id,
    teamId: d.team_id,
    status: d.status || 'Active',
    performance: d.performance_score || 90
  };
};

export const developersApi = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/developers', { params });
    return (response.data?.data || []).map(mapBackendToFrontend);
  },

  getById: async (id) => {
    const response = await apiClient.get(`/developers/${id}`);
    return mapBackendToFrontend(response.data?.data);
  },

  getByTeamLeader: async (tlId) => {
    // Backend supports querying developers with a filter or nested route
    const response = await apiClient.get('/developers', { params: { teamLeaderId: tlId } });
    return (response.data?.data || []).map(mapBackendToFrontend);
  },

  getByLead: async (leadId) => {
    const response = await apiClient.get('/developers', { params: { leadId } });
    return (response.data?.data || []).map(mapBackendToFrontend);
  },

  create: async (data) => {
    const nameParts = (data.name || '').trim().split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const payload = {
      teamId: data.teamId || data.team_id,
      firstName,
      lastName,
      email: data.email,
      password: data.password || 'password123',
      employeeId: data.employeeId || data.employee_id
    };
    const response = await apiClient.post('/developers', payload);
    return mapBackendToFrontend(response.data?.data);
  },

  update: async (id, data) => {
    const payload = { ...data };
    if (data.name) {
      const nameParts = data.name.trim().split(' ');
      payload.firstName = nameParts[0] || 'Unknown';
      payload.lastName = nameParts.slice(1).join(' ') || 'User';
    }
    const response = await apiClient.patch(`/developers/${id}`, payload);
    return mapBackendToFrontend(response.data?.data);
  },

  delete: async (id) => {
    await apiClient.delete(`/developers/${id}`);
  }
};
