import apiClient from './apiClient';

/**
 * Maps database columns (snake_case) to client components schema (camelCase).
 * Manager identity and operational counts come computed from the backend —
 * never entered manually and never faked client-side.
 */
const mapBackendToFrontend = (b) => {
  if (!b) return null;
  return {
    id: b.id,
    name: b.branch_name,
    branchName: b.branch_name,
    branchCode: b.branch_code,
    companyName: b.company_name || 'Kosqu Software',
    companyLocation: b.company_location || b.city || '',
    country: b.country || 'India',
    state: b.state || '',
    city: b.city || '',
    address: b.address || '',
    phone: b.phone || '',
    email: b.email || '',
    assignedTarget: Number(b.assigned_target) || 0,
    achievedTarget: Number(b.achieved_target) || 0,
    healthScore: b.health_score || 0,
    workingDays: b.working_days || '',
    timezone: b.timezone || 'IST (UTC+05:30)',
    gstNumber: b.gst_number || '',
    panNumber: b.pan_number || '',
    status: b.status || 'Active',
    description: b.description || '',
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    // Live Branch -> Manager (users) relationship
    manager: b.manager_name || 'Not Assigned',
    managerId: b.manager_id || null,
    managerEmail: b.manager_email || '',
    managerPhone: b.manager_phone || '',
    // Computed operational counts (read-only)
    employees: Number(b.employee_count) || 0,
    activeLeads: Number(b.active_leads) || 0,
    activeProjects: Number(b.active_projects) || 0
  };
};

/**
 * Maps client component inputs (camelCase) to database validation keys (snake_case).
 * Targets, status, description, and operational metrics are intentionally excluded —
 * the backend rejects them (strict schema).
 */
const mapFrontendToBackend = (data) => {
  const payload = {
    branch_name: data.branchName,
    branch_code: data.branchCode,
    company_name: data.companyName,
    company_location: data.companyLocation || data.city,
    country: data.country,
    state: data.state,
    city: data.city,
    address: data.address,
    phone: data.phone,
    email: data.email || null,
    assigned_target: Number(data.assignedTarget) || 0,
    achieved_target: Number(data.achievedTarget) || 0,
    status: data.status || 'Active',
    description: data.description || null,
    manager_name: data.manager || null,
    manager_email: data.managerEmail || null,
    manager_password: data.managerPassword || null
  };
  // Only send manager_id when the caller explicitly sets one. Sending null here
  // would DETACH the branch's manager on every edit (which locked Branch
  // Managers out of their own branch after saving the edit form).
  if (data.managerId !== undefined) {
    payload.manager_id = data.managerId || null;
  }
  return payload;
};

export const branchApi = {
  /**
   * Retrieves paginated branch lists from the backend.
   */
  getBranches: async (params = {}) => {
    const response = await apiClient.get('/branches', { params });
    return {
      success: response.data.success,
      data: (response.data.data || []).map(mapBackendToFrontend),
      pagination: response.data.pagination
    };
  },

  /**
   * Retrieves single branch details.
   */
  getBranch: async (id) => {
    const response = await apiClient.get(`/branches/${id}`);
    return {
      success: response.data.success,
      data: mapBackendToFrontend(response.data.data)
    };
  },

  /**
   * Submits a payload to create a new branch.
   */
  createBranch: async (data) => {
    const backendPayload = mapFrontendToBackend(data);
    const response = await apiClient.post('/branches', backendPayload);
    return {
      success: response.data.success,
      data: mapBackendToFrontend(response.data.data)
    };
  },

  /**
   * Triggers a patch payload to update branch details.
   */
  updateBranch: async (id, data) => {
    // The update schema is strict and has no manager-provisioning fields
    const { manager_name, manager_email, manager_password, ...backendPayload } = mapFrontendToBackend(data);
    const response = await apiClient.patch(`/branches/${id}`, backendPayload);
    return {
      success: response.data.success,
      data: mapBackendToFrontend(response.data.data)
    };
  },

  /**
   * Soft deletes a branch.
   */
  deleteBranch: async (id) => {
    const response = await apiClient.delete(`/branches/${id}`);
    return {
      success: response.data.success
    };
  },

  /**
   * Gets explicit quarterly targets for a branch
   */
  getQuarterlyTargets: async (id, financialYear) => {
    const response = await apiClient.get(`/branches/${id}/quarterly-targets`, {
      params: { financial_year: financialYear }
    });
    return {
      success: response.data.success,
      data: response.data.data
    };
  },

  /**
   * Updates explicit quarterly targets for a branch
   */
  updateQuarterlyTargets: async (id, data) => {
    const response = await apiClient.put(`/branches/${id}/quarterly-targets`, {
      financial_year: data.financialYear,
      q1_target: Number(data.q1Target),
      q2_target: Number(data.q2Target),
      q3_target: Number(data.q3Target),
      q4_target: Number(data.q4Target),
      q1_achieved: data.q1Achieved !== null ? Number(data.q1Achieved) : null,
      q2_achieved: data.q2Achieved !== null ? Number(data.q2Achieved) : null,
      q3_achieved: data.q3Achieved !== null ? Number(data.q3Achieved) : null,
      q4_achieved: data.q4Achieved !== null ? Number(data.q4Achieved) : null,
    });
    return {
      success: response.data.success,
      data: response.data.data
    };
  }
};
