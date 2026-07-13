import apiClient from './apiClient';

const buildParams = (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key].toString());
    }
  });
  return params.toString();
};

export const dashboardApi = {
  getSummary: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/summary?${buildParams(filters)}`);
    return response.data?.data;
  },

  getLeadFunnel: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/lead-funnel?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getRevenueTrend: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/revenue-trend?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getBranchPerformance: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/branch-performance?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getTeamPerformance: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/team-performance?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getRecentActivities: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/recent-activities?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getUpcomingFollowups: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/upcoming-followups?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getDetailedLeadsReport: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/detailed-leads?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getDeveloperPerformance: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/developer-performance?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getMonthlyReport: async (filters = {}) => {
    const response = await apiClient.get(`/dashboard/monthly-report?${buildParams(filters)}`);
    return response.data?.data || [];
  },

  getQuarterlyPerformance: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.teamId)   params.append('teamId', filters.teamId);
    if (filters.fyOffset !== undefined) params.append('fyOffset', filters.fyOffset.toString());
    
    const response = await apiClient.get(`/dashboard/quarterly-performance?${params.toString()}`);
    return response.data?.data || [];
  }
};
export default dashboardApi;
