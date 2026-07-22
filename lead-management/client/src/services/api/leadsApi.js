import apiClient from './apiClient';

export const leadsApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status)     params.append('status', filters.status);
    if (filters.branchId)   params.append('branch', filters.branchId);   // backend query param is 'branch'
    if (filters.teamId)     params.append('team', filters.teamId);        // backend query param is 'team'
    if (filters.assignedTo) params.append('team', filters.assignedTo);
    if (filters.search)     params.append('search', filters.search);
    params.append('limit', '100');

    const response = await apiClient.get(`/leads?${params.toString()}`);
    return response.data?.data || [];
  },

  getAccountingDashboard: async (params = {}) => {
    let url = `/accounting/dashboard`;
    const searchParams = new URLSearchParams();
    if (params.branchId) {
      searchParams.append('branchId', params.branchId);
    }
    const queryStr = searchParams.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }
    const response = await apiClient.get(url);
    return response.data?.data || [];
  },

  getById: async (id) => {
    const response = await apiClient.get(`/leads/${id}`);
    return response.data?.data;
  },

  create: async (leadData) => {
    // Map frontend camelCase to backend snake_case.
    // NOTE: backend schema is .strict() — only send recognised fields, no unknowns.
    const payload = {
      name: leadData.name,
      branch_id: leadData.branchId,
      ...(leadData.teamId || leadData.assignedTo
        ? { team_id: leadData.teamId || leadData.assignedTo }
        : {}),
      ...(leadData.companyName       ? { company_name:       leadData.companyName }                   : {}),
      ...(leadData.contactPerson     ? { contact_person:     leadData.contactPerson }                 : {}),
      ...(leadData.email             ? { email:              leadData.email }                         : {}),
      ...(leadData.mobile            ? { mobile:             leadData.mobile }                        : {}),
      ...(leadData.industry          ? { industry:           leadData.industry }                      : {}),
      ...(leadData.address           ? { address:            leadData.address }                       : {}),
      ...(leadData.city              ? { city:               leadData.city }                          : {}),
      ...(leadData.country           ? { country:            leadData.country }                       : {}),
      ...(leadData.leadSource        ? { lead_source:        leadData.leadSource }                    : {}),
      ...(leadData.campaign          ? { campaign:           leadData.campaign }                      : {}),
      ...(leadData.referralName      ? { referral_name:      leadData.referralName }                  : {}),
      ...(leadData.advertisement     ? { advertisement:      leadData.advertisement }                 : {}),
      ...(leadData.socialMedia       ? { social_media:       leadData.socialMedia }                   : {}),
      website_inquiry: leadData.websiteInquiry === 'Yes' || leadData.websiteInquiry === true,
      ...(leadData.budget            ? { budget:             parseFloat(leadData.budget) }            : {}),
      ...(leadData.decisionMaker     ? { decision_maker:     leadData.decisionMaker }                 : {}),
      ...(leadData.expectedStartDate ? { expected_start_date: leadData.expectedStartDate }            : {}),
      ...(leadData.businessNeed      ? { business_need:      leadData.businessNeed }                  : {}),
      ...(leadData.projectType       ? { project_type:       leadData.projectType }                   : {}),
      ...(leadData.leadScore         ? { lead_score:         parseInt(leadData.leadScore, 10) }       : {}),
      priority: leadData.priority || 'Medium',
      ...(leadData.expectedRevenue   ? { expected_revenue:   parseFloat(leadData.expectedRevenue) }   : {}),
      status: leadData.status || 'New'
    };

    const response = await apiClient.post('/leads', payload);
    return response.data?.data;
  },

  update: async (id, updates) => {
    const payload = {};
    const mapping = {
      name: 'name',
      companyName: 'company_name',
      contactPerson: 'contact_person',
      email: 'email',
      mobile: 'mobile',
      industry: 'industry',
      address: 'address',
      city: 'city',
      country: 'country',
      leadSource: 'lead_source',
      campaign: 'campaign',
      referralName: 'referral_name',
      advertisement: 'advertisement',
      socialMedia: 'social_media',
      websiteInquiry: 'website_inquiry',
      budget: 'budget',
      decisionMaker: 'decision_maker',
      expectedStartDate: 'expected_start_date',
      businessNeed: 'business_need',
      projectType: 'project_type',
      leadScore: 'lead_score',
      priority: 'priority',
      expectedRevenue: 'expected_revenue',
      status: 'status',
      branchId: 'branch_id',
      teamId: 'team_id'
    };

    Object.entries(updates).forEach(([key, val]) => {
      const backendKey = mapping[key];
      if (!backendKey) return; // skip keys not in schema — backend is .strict()
      if (key === 'websiteInquiry') {
        payload[backendKey] = val === 'Yes' || val === true;
      } else {
        payload[backendKey] = val;
      }
    });

    const response = await apiClient.patch(`/leads/${id}`, payload);
    return response.data?.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/leads/${id}`);
  },

  getJourney: async (id) => {
    const [commRes, reqRes, propRes, projRes, delRes, csRes, timelineRes, assignRes, historyRes, tasksRes] = await Promise.all([
      apiClient.get(`/leads/${id}/communications`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/leads/${id}/requirements`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/leads/${id}/proposals`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/projects?lead=${id}`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/leads/${id}/delivery`).catch(() => ({ data: { data: null } })),
      apiClient.get(`/leads/${id}/customer-success`).catch(() => ({ data: { data: null } })),
      apiClient.get(`/leads/${id}/timeline`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/leads/${id}/assignment`).catch(() => ({ data: { data: null } })),
      apiClient.get(`/leads/${id}/assignment-history`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/tasks/lead/${id}`).catch(() => ({ data: { data: [] } }))
    ]);

    const proposals = propRes.data?.data || [];
    const approvedProp = proposals.find(p => p.is_approved) || null;

    const projects = projRes.data?.data || [];
    const project = projects.length ? projects[0] : null;

    // Map backend project (snake_case) to the camelCase shape ProjectSection expects
    const mapProjectExec = (p) => p ? ({
      id: p.id,
      leadId: p.lead_id,
      projectId: p.id ? `PRJ-${p.id.slice(0, 6).toUpperCase()}` : '',
      projectName: p.project_name || '',
      startDate: p.start_date ? String(p.start_date).split('T')[0] : '',
      deadline: p.deadline ? String(p.deadline).split('T')[0] : '',
      technology: p.technology || '',
      status: p.status || 'Not Started',
      progressPct: Number(p.progress_pct) || 0,
      totalCost: Number(p.total_cost) || 0,
      priority: p.priority || 'Medium',
      riskLevel: p.risk_level || 'Low',
      currentSprint: p.current_sprint || '',
      expectedHours: Number(p.expected_hours) || 0,
      teamLeaderId: p.team_id || null, // matched against tl.teamId in the UI
      developerId: p.developer_id || null,
      remarks: p.remarks || ''
    }) : null;

    // Map backend task rows to the shape ProjectSection renders
    const mapTask = (t) => {
      const statusMap = { 'Done': 'Completed', 'In Progress': 'InProgress' };
      return {
        id: t.id,
        leadId: t.lead_id,
        devId: t.assigned_to_name || 'Unassigned',
        assignedToId: t.assigned_to_id || null,
        description: t.description || t.title || '',
        startDate: t.assigned_date ? String(t.assigned_date).split('T')[0] : (t.created_at ? String(t.created_at).split('T')[0] : ''),
        endDate: t.due_date ? String(t.due_date).split('T')[0] : '',
        hoursWorked: Number(t.hours_worked) || 0,
        estHours: Number(t.est_hours) || 0,
        status: t.blocker_reason ? 'Blocked' : (statusMap[t.status] || t.status || 'Open'),
        blocker: t.blocker_reason || '',
        codeReviewStatus: 'Pending',
        testingStatus: 'Pending'
      };
    };

    const backendTasks = (tasksRes.data?.data || []).map(mapTask);
    // Actual logged effort = sum of hours worked across the lead's tasks
    const actualHours = backendTasks.reduce((acc, t) => acc + (Number(t.hoursWorked) || 0), 0);
    const projectExecution = mapProjectExec(project);
    if (projectExecution) projectExecution.actualHours = actualHours;

    // Format fields for frontend compability
    const formattedTimeline = (timelineRes.data?.data || []).map(item => ({
      id: item.id,
      leadId: item.lead_id,
      timestamp: item.created_at,
      userId: item.user_name || 'System',
      action: item.activity_type,
      details: item.details ? (typeof item.details === 'string' ? item.details : JSON.stringify(item.details)) : ''
    }));

    // Map backend snake_case proposal fields to camelCase for frontend components
    const mapProposal = (p) => p ? ({
      id: p.id,
      leadId: p.lead_id,
      proposalNumber: p.proposal_number,
      proposalVersion: p.proposal_version,
      proposalDate: p.created_at ? p.created_at.split('T')[0] : '',
      businessAnalysis: p.business_analysis,
      technicalAnalysis: p.technical_analysis,
      riskAnalysis: p.risk_analysis,
      scope: p.scope,
      timeline: p.timeline,
      estHours: p.est_hours,
      quotationAmount: p.quotation_amount,
      discount: p.discount,
      finalCost: p.final_cost,
      currency: p.currency,
      status: p.status,
      proposalApproved: p.is_approved,
      contractSigned: p.contract_signed,
      advanceReceived: p.advance_received,
      advanceAmount: p.advance_amount
    }) : null;

    // Map backend snake_case communications to camelCase for DiscoverySection / timeline
    const mapComm = (c) => c ? ({
      id: c.id,
      leadId: c.lead_id,
      type: c.type,
      date: c.comm_date ? (typeof c.comm_date === 'string' ? c.comm_date.split('T')[0] : c.comm_date) : '',
      time: c.comm_time,
      subject: c.subject,
      discussionSummary: c.discussion_summary,
      clientProblem: c.client_problem,
      suggestedSolution: c.suggested_solution
    }) : null;

    // Map backend snake_case requirements to camelCase for DiscoverySection / timeline
    const mapReq = (r) => r ? ({
      id: r.id,
      leadId: r.lead_id,
      description: r.requirement,
      requirement: r.requirement,
      notes: r.notes,
      priority: r.priority,
      complexity: r.complexity,
      estHours: r.estimated_hours,
      assignedTeam: r.assigned_team || 'CRM Development',
      assignedDeveloperId: r.assigned_developer_id || null,
      assignedDeveloper: r.assigned_developer_name || null,
      status: r.approval_status || 'Open',
      approved: r.approved
    }) : null;

    const rawProp = approvedProp || (proposals.length ? proposals[0] : null);

    return {
      communications: (commRes.data?.data || []).map(mapComm),
      requirements: (reqRes.data?.data || []).map(mapReq),
      proposal: mapProposal(rawProp),
      proposals: proposals.map(mapProposal),
      projectExecution,
      tasks: backendTasks,
      delivery: delRes.data?.data,
      customerSuccess: csRes.data?.data,
      auditLog: formattedTimeline,
      currentAssignment: assignRes.data?.data,
      assignmentHistory: historyRes.data?.data
    };
  },

  updateJourneyStage: async (id, stage) => {
    const response = await apiClient.patch(`/leads/${id}/journey`, { stage });
    return response.data?.data;
  },

  // Sub-resources APIs
  createNote: async (leadId, noteData) => {
    const response = await apiClient.post(`/leads/${leadId}/notes`, {
      content: noteData.content || noteData.text
    });
    return response.data?.data;
  },

  createCommunication: async (leadId, commData) => {
    // Map to backend createCommunicationSchema (strict)
    const response = await apiClient.post(`/leads/${leadId}/communications`, {
      type: commData.type || 'Call',
      comm_date: commData.date || commData.comm_date || new Date().toISOString().split('T')[0],
      comm_time: commData.time || commData.comm_time || null,
      subject: commData.subject || `${commData.type || 'Call'} — ${commData.date || new Date().toISOString().split('T')[0]}`,
      discussion_summary: commData.discussionSummary || commData.discussion_summary || null,
      client_problem: commData.clientProblem || commData.client_problem || null,
      suggested_solution: commData.suggestedSolution || commData.suggested_solution || null
    });
    return response.data?.data;
  },

  createRequirement: async (leadId, reqData) => {
    // Map to backend createRequirementSchema — field is 'requirement', not 'description'
    const response = await apiClient.post(`/leads/${leadId}/requirements`, {
      requirement: reqData.requirement || reqData.description || reqData.title || '',
      notes: reqData.notes || reqData.description || null,
      priority: reqData.priority || 'Medium',
      complexity: reqData.complexity || 'Medium',
      ...(reqData.estHours ? { estimated_hours: parseInt(reqData.estHours, 10) } : {}),
      ...(reqData.assignedDeveloperId ? { assigned_developer_id: reqData.assignedDeveloperId } : {}),
      ...(reqData.assignedTeam ? { assigned_team: reqData.assignedTeam } : {}),
      ...(reqData.remarks  ? { remarks: reqData.remarks } : {})
    });
    return response.data?.data;
  },

  updateRequirement: async (id, updates) => {
    const payload = {};
    // 'requirement' is the backend field name (not 'description')
    if (updates.requirement !== undefined) payload.requirement = updates.requirement;
    if (updates.description !== undefined) payload.requirement = updates.description; // alias
    if (updates.notes       !== undefined) payload.notes = updates.notes;
    if (updates.priority    !== undefined) payload.priority = updates.priority;
    if (updates.complexity  !== undefined) payload.complexity = updates.complexity;
    if (updates.estHours    !== undefined) payload.estimated_hours = parseInt(updates.estHours, 10);
    if (updates.approved    !== undefined) payload.approved = updates.approved;
    if (updates.remarks     !== undefined) payload.remarks = updates.remarks;
    const response = await apiClient.patch(`/requirements/${id}`, payload);
    return response.data?.data;
  },

  deleteRequirement: async (id) => {
    await apiClient.delete(`/requirements/${id}`);
  },

  createProposal: async (leadId, propData) => {
    const response = await apiClient.post(`/leads/${leadId}/proposals`, {
      proposal_version: propData.proposalVersion || 'v1.0',
      business_analysis: propData.businessAnalysis || '',
      technical_analysis: propData.technicalAnalysis || '',
      risk_analysis: propData.riskAnalysis || '',
      scope: propData.scope || '',
      timeline: propData.timeline || '',
      est_hours: propData.estHours ? parseInt(propData.estHours, 10) : 0,
      quotation_amount: propData.quotationAmount ? parseFloat(propData.quotationAmount) : 0,
      discount: propData.discount ? parseFloat(propData.discount) : 0,
      currency: propData.currency || 'INR',
      status: propData.status || 'Draft'
    });
    return response.data?.data;
  },

  approveProposal: async (id, remarks) => {
    const response = await apiClient.post(`/proposals/${id}/approve`, { remarks });
    return response.data?.data;
  },

  signContract: async (id) => {
    const response = await apiClient.post(`/proposals/${id}/sign-contract`);
    return response.data?.data;
  },

  receiveAdvance: async (id, amount) => {
    const response = await apiClient.post(`/proposals/${id}/receive-advance`, { advance_amount: parseFloat(amount) });
    return response.data?.data;
  },

  assignLead: async (leadId, data) => {
    const response = await apiClient.post(`/leads/${leadId}/assign`, {
      assigned_team_id: data.assignedTeamId,
      assigned_to_user_id: data.assignedToUserId,
      reason: data.reason,
      assignment_type: data.assignmentType
    });
    return response.data?.data;
  },

  reassignLead: async (leadId, data) => {
    const response = await apiClient.post(`/leads/${leadId}/reassign`, {
      assigned_team_id: data.assignedTeamId,
      assigned_to_user_id: data.assignedToUserId,
      reason: data.reason,
      assignment_type: data.assignmentType
    });
    return response.data?.data;
  },

  createProject: async (leadId, projData) => {
    const response = await apiClient.post(`/leads/${leadId}/project`, {
      project_name: projData.projectName,
      ...(projData.technology ? { technology: projData.technology } : {}),
      ...(projData.totalCost ? { total_cost: parseFloat(projData.totalCost) } : {}),
      ...(projData.startDate ? { start_date: projData.startDate } : {}),
      ...(projData.deadline ? { deadline: projData.deadline } : {}),
      ...(projData.remarks ? { remarks: projData.remarks } : {}),
      ...(projData.priority ? { priority: projData.priority } : {}),
      ...(projData.riskLevel ? { risk_level: projData.riskLevel } : {}),
      ...(projData.currentSprint ? { current_sprint: projData.currentSprint } : {}),
      ...(projData.expectedHours ? { expected_hours: parseInt(projData.expectedHours, 10) } : {})
    });
    return response.data?.data;
  },

  updateProjectProgress: async (projectId, data) => {
    const response = await apiClient.patch(`/projects/${projectId}/progress`, {
      progress_pct: parseInt(data.progressPct || data.progress_pct, 10),
      remarks: data.remarks
    });
    return response.data?.data;
  },

  updateProject: async (projectId, data) => {
    // Send every editable field the Configure Project form owns
    const payload = {};
    if (data.projectName) payload.project_name = data.projectName;
    if (data.technology !== undefined && data.technology !== '') payload.technology = data.technology;
    if (data.status) payload.status = data.status;
    if (data.progressPct !== undefined) payload.progress_pct = parseInt(data.progressPct, 10) || 0;
    if (data.startDate) payload.start_date = data.startDate;
    if (data.deadline) payload.deadline = data.deadline;
    if (data.remarks) payload.remarks = data.remarks;
    if (data.priority) payload.priority = data.priority;
    if (data.riskLevel) payload.risk_level = data.riskLevel;
    if (data.currentSprint !== undefined && data.currentSprint !== '') payload.current_sprint = data.currentSprint;
    if (data.expectedHours !== undefined) payload.expected_hours = parseInt(data.expectedHours, 10) || 0;

    const response = await apiClient.patch(`/projects/${projectId}`, payload);
    return response.data?.data;
  },

  // === Developer Task Logs (Phase 4) — backed by the tasks module ===
  createLeadTask: async (leadId, taskData) => {
    // 1. Create with the fields the create schema accepts
    const uiToBackendStatus = { Open: 'Open', InProgress: 'In Progress', Blocked: 'Pending', Completed: 'Done' };
    const createRes = await apiClient.post(`/tasks/lead/${leadId}`, {
      title: (taskData.description || 'Developer Task').slice(0, 120),
      description: taskData.description || null,
      category: taskData.category || 'Development',
      priority: taskData.priority || 'Medium',
      assigned_to_id: taskData.devId || null,
      ...(taskData.endDate ? { due_date: taskData.endDate } : {}),
      ...(taskData.estHours ? { est_hours: Number(taskData.estHours) } : {})
    });
    const task = createRes.data?.data;

    // 2. Apply status / hours / blocker via update (not part of the create schema)
    const updates = {};
    const backendStatus = uiToBackendStatus[taskData.status];
    if (backendStatus && backendStatus !== 'Open') updates.status = backendStatus;
    if (taskData.hoursWorked) updates.hours_worked = Number(taskData.hoursWorked);
    if (taskData.blocker) updates.blocker_reason = taskData.blocker;
    if (task?.id && Object.keys(updates).length > 0) {
      await apiClient.patch(`/tasks/${task.id}`, updates);
    }
    return task;
  },

  updateDelivery: async (leadId, data) => {
    const journey = await leadsApi.getJourney(leadId);
    if (journey.delivery) {
      const response = await apiClient.patch(`/delivery/${journey.delivery.id}`, {
        go_live_date: data.goLiveDate || data.go_live_date,
        uat_status: data.uatStatus || data.uat_status,
        documentation_status: data.documentationStatus || data.documentation_status,
        acceptance_status: data.acceptanceStatus || data.acceptance_status,
        handover_completed: data.handoverCompleted || data.handover_completed,
        deployment_date: data.deploymentDate || data.deployment_date,
        remarks: data.remarks,
        
        deployment_status: data.deploymentStatus || data.deployment_status,
        uat_remarks: data.uatRemarks || data.uat_remarks,
        documentation_delivered: data.documentationDelivered || data.documentation_delivered,
        training_completed: data.trainingCompleted || data.training_completed,
        client_acceptance: data.clientAcceptance || data.client_acceptance,
        acceptance_date: data.acceptanceDate || data.acceptance_date,
        warranty_start: data.warrantyStart || data.warranty_start,
        warranty_end: data.warrantyEnd || data.warranty_end,
        delivery_remarks: data.deliveryRemarks || data.delivery_remarks
      });
      return response.data?.data;
    } else {
      const response = await apiClient.post(`/leads/${leadId}/delivery`, {
        go_live_date: data.goLiveDate || data.go_live_date,
        uat_status: data.uatStatus || data.uat_status,
        documentation_status: data.documentationStatus || data.documentation_status,
        acceptance_status: data.acceptanceStatus || data.acceptance_status,
        handover_completed: data.handoverCompleted || data.handover_completed,
        deployment_date: data.deploymentDate || data.deployment_date,
        remarks: data.remarks,
        
        deployment_status: data.deploymentStatus || data.deployment_status,
        uat_remarks: data.uatRemarks || data.uat_remarks,
        documentation_delivered: data.documentationDelivered || data.documentation_delivered,
        training_completed: data.trainingCompleted || data.training_completed,
        client_acceptance: data.clientAcceptance || data.client_acceptance,
        acceptance_date: data.acceptanceDate || data.acceptance_date,
        warranty_start: data.warrantyStart || data.warranty_start,
        warranty_end: data.warrantyEnd || data.warranty_end,
        delivery_remarks: data.deliveryRemarks || data.delivery_remarks
      });
      return response.data?.data;
    }
  },

  updateCustomerSuccess: async (leadId, data) => {
    const journey = await leadsApi.getJourney(leadId);
    if (journey.customerSuccess) {
      const response = await apiClient.patch(`/customer-success/${journey.customerSuccess.id}`, {
        support_status: data.supportStatus || data.support_status,
        renewal_date: data.renewalDate || data.renewal_date,
        health_score: data.healthScore !== undefined ? parseInt(data.healthScore || data.health_score, 10) : undefined,
        nps: data.nps !== undefined ? parseInt(data.nps, 10) : undefined,
        feedback: data.feedback,
        upsell_opportunity: data.upsellOpportunity || data.upsell_opportunity,
        renewal_status: data.renewalStatus || data.renewal_status,
        
        amc_status: data.amcStatus || data.amc_status,
        support_plan: data.supportPlan || data.support_plan,
        cross_sell_opportunity: data.crossSellOpportunity || data.cross_sell_opportunity,
        last_review_date: data.lastReviewDate || data.last_review_date,
        next_review_date: data.nextReviewDate || data.next_review_date,
        success_manager: data.successManager || data.success_manager,
        customer_status: data.customerStatus || data.customer_status,
        amc_details_text: data.amcDetailsText || data.amc_details_text
      });
      return response.data?.data;
    } else {
      const response = await apiClient.post(`/leads/${leadId}/customer-success`, {
        support_status: data.supportStatus || data.support_status || 'Pending',
        renewal_date: data.renewalDate || data.renewal_date,
        health_score: data.healthScore !== undefined ? parseInt(data.healthScore || data.health_score, 10) : undefined,
        nps: data.nps !== undefined ? parseInt(data.nps, 10) : undefined,
        feedback: data.feedback,
        upsell_opportunity: data.upsellOpportunity || data.upsell_opportunity || false,
        renewal_status: data.renewalStatus || data.renewal_status || 'Pending',
        
        amc_status: data.amcStatus || data.amc_status,
        support_plan: data.supportPlan || data.support_plan,
        cross_sell_opportunity: data.crossSellOpportunity || data.cross_sell_opportunity,
        last_review_date: data.lastReviewDate || data.last_review_date,
        next_review_date: data.nextReviewDate || data.next_review_date,
        success_manager: data.successManager || data.success_manager,
        customer_status: data.customerStatus || data.customer_status,
        amc_details_text: data.amcDetailsText || data.amc_details_text
      });
      return response.data?.data;
    }
  }
};
