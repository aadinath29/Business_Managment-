import { branchApi } from './api/branchApi';
import { teamsApi } from './api/teamsApi';
import { developersApi } from './api/developersApi';
import { leadsApi } from './api/leadsApi';
import apiClient from './api/apiClient';

// --- IN-MEMORY/LOCAL STORAGE FOR TASK MODULE (PHASE 8 TASK MODULE IS NOT BUILT ON BACKEND YET) ---
const initialTasks = [
  {
    id: 'TASK001',
    leadId: 'l1',
    devId: 'Aarav Mehta',
    description: 'Setup initial repository structure, tsconfig parameters, and tailwind.config',
    startDate: '2023-10-16',
    endDate: '2023-10-20',
    hoursWorked: 40,
    estHours: 40,
    status: 'Completed',
    progressPct: 100,
    delayReason: '',
    blocker: '',
    codeReviewStatus: 'Approved',
    testingStatus: 'Passed',
    lastUpdated: '2023-10-20'
  },
  {
    id: 'TASK002',
    leadId: 'l1',
    devId: 'Isha Patel',
    description: 'Build layout structures and integrate scrollspy secondary phase navigation',
    startDate: '2023-10-21',
    endDate: '2023-11-05',
    hoursWorked: 80,
    estHours: 60,
    status: 'InProgress',
    progressPct: 80,
    delayReason: 'Delay due to CSS alignments',
    blocker: 'Awaiting visual style guidelines',
    codeReviewStatus: 'Pending',
    testingStatus: 'InProgress',
    lastUpdated: '2023-10-26'
  }
];

let tasks = localStorage.getItem('kosqu_tasks') ? JSON.parse(localStorage.getItem('kosqu_tasks')) : initialTasks;
const saveTasks = () => localStorage.setItem('kosqu_tasks', JSON.stringify(tasks));

// --- EXPORTED SERVICE WRAPPERS FOR DIRECT API CALLING ---

export const branchService = {
  getAll: async () => {
    const res = await branchApi.getBranches();
    return res.data;
  },
  getById: async (id) => {
    const res = await branchApi.getBranch(id);
    return res.data;
  },
  create: async (data) => {
    const res = await branchApi.createBranch(data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await branchApi.updateBranch(id, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await branchApi.deleteBranch(id);
    return res.success;
  },
  getLeads: async (id) => {
    return leadsApi.getAll({ branchId: id });
  },
  getProjects: async (id) => {
    const res = await apiClient.get(`/projects?branchId=${id}`).catch(() => ({ data: { data: [] } }));
    return res.data?.data || [];
  },
  getTeams: async (id) => {
    const res = await teamsApi.getTeams({ branchId: id });
    return res.data;
  }
};

export const teamsService = {
  getAll: async () => {
    const res = await teamsApi.getTeamLeaders({ limit: '100' });
    return res.data;
  },
  create: async (tlData) => {
    const res = await teamsApi.createTeam(tlData);
    return res.data;
  }
};

export const developersService = {
  getAll: async () => {
    return developersApi.getAll({ limit: 100 });
  },
  getById: async (id) => {
    return developersApi.getById(id);
  },
  getByTeamLeader: async (tlId) => {
    return developersApi.getByTeamLeader(tlId);
  },
  getByLead: async (leadId) => {
    return developersApi.getByLead(leadId);
  },
  create: async (devData) => {
    return developersApi.create(devData);
  }
};

export const tasksService = {
  getAll: () => Promise.resolve([...tasks]),
  create: (task) => {
    const newTask = {
      ...task,
      id: 't' + (tasks.length + 1)
    };
    tasks.push(newTask);
    saveTasks();
    return Promise.resolve(newTask);
  },
  update: (id, updates) => {
    tasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTasks();
    return Promise.resolve({ success: true });
  },
  delete: (id) => {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    return Promise.resolve({ success: true });
  }
};

export const leadsService = {
  getAll: async (filters = {}) => {
    const list = await leadsApi.getAll(filters);
    // Format to match frontend expected fields
    return list.map(item => ({
      id: item.id,
      branchId: item.branch_id,
      name: item.name,
      companyName: item.company_name,
      contactPerson: item.contact_person,
      mobile: item.mobile,
      email: item.email,
      industry: item.industry,
      address: item.address,
      city: item.city,
      country: item.country,
      leadSource: item.lead_source,
      campaign: item.campaign,
      referralName: item.referral_name,
      advertisement: item.advertisement,
      socialMedia: item.social_media,
      websiteInquiry: item.website_inquiry ? 'Yes' : 'No',
      budget: item.budget,
      decisionMaker: item.decision_maker,
      expectedStartDate: item.expected_start_date,
      businessNeed: item.business_need,
      projectType: item.project_type,
      priority: item.priority,
      expectedRevenue: item.expected_revenue,
      status: item.status,
      stage: item.status,
      value: item.expected_revenue || item.budget || 0,
      lastActivityDate: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '',
      assignedTo: item.team_id || item.assigned_sales_user_id
    }));
  },

  getById: async (id) => {
    const item = await leadsApi.getById(id);
    if (!item) return null;
    return {
      id: item.id,
      branchId: item.branch_id,
      branchName: item.branch_name,
      name: item.name,
      companyName: item.company_name,
      contactPerson: item.contact_person,
      mobile: item.mobile,
      email: item.email,
      industry: item.industry,
      address: item.address,
      city: item.city,
      country: item.country,
      leadSource: item.lead_source,
      campaign: item.campaign,
      referralName: item.referral_name,
      advertisement: item.advertisement,
      socialMedia: item.social_media,
      websiteInquiry: item.website_inquiry ? 'Yes' : 'No',
      budget: item.budget,
      decisionMaker: item.decision_maker,
      expectedStartDate: item.expected_start_date,
      businessNeed: item.business_need,
      projectType: item.project_type,
      priority: item.priority,
      expectedRevenue: item.expected_revenue,
      status: item.status,
      stage: item.status,
      value: item.expected_revenue || item.budget || 0,
      assignedTo: item.team_id || item.assigned_sales_user_id
    };
  },

  getJourney: async (id) => {
    const journey = await leadsApi.getJourney(id);
    // Backend tasks are authoritative; legacy local (pre-backend) tasks are appended
    const localTasks = tasks.filter(t => t.leadId === id);
    return {
      ...journey,
      tasks: [...(journey.tasks || []), ...localTasks]
    };
  },

  create: async (leadData) => {
    const item = await leadsApi.create(leadData);
    return {
      id: item.id,
      branchId: item.branch_id,
      name: item.name,
      companyName: item.company_name,
      status: item.status
    };
  },

  update: async (id, data) => {
    return leadsApi.update(id, data);
  },

  delete: async (id) => {
    await leadsApi.delete(id);
  },

  updateJourneyStage: async (id, stage) => {
    return leadsApi.updateJourneyStage(id, stage);
  },

  createNote: async (leadId, noteData) => {
    return leadsApi.createNote(leadId, noteData);
  },

  deleteNote: async (id) => {
    await apiClient.delete(`/notes/${id}`);
  },

  createCommunication: async (leadId, commData) => {
    return leadsApi.createCommunication(leadId, commData);
  },

  createRequirement: async (leadId, reqData) => {
    return leadsApi.createRequirement(leadId, reqData);
  },

  updateRequirement: async (id, updates) => {
    return leadsApi.updateRequirement(id, updates);
  },

  deleteRequirement: async (id) => {
    await leadsApi.deleteRequirement(id);
  },

  createTask: async (leadId, taskData) => {
    // Persist developer task logs through the backend tasks module
    return leadsApi.createLeadTask(leadId, taskData);
  },

  updateTask: (id, updates) => {
    tasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTasks();
    return Promise.resolve({ success: true });
  },

  updateStatus: async (leadId, status, details = {}) => {
    // Only pass fields recognised by the backend updateLeadSchema (which is .strict())
    const allowed = ['name','companyName','contactPerson','email','mobile','industry',
      'address','city','country','leadSource','campaign','referralName','advertisement',
      'socialMedia','websiteInquiry','budget','decisionMaker','expectedStartDate','businessNeed',
      'projectType','priority','expectedRevenue','branchId','teamId','assignedTo'];
    const safeDetails = {};
    allowed.forEach(k => { if (details[k] !== undefined) safeDetails[k] = details[k]; });
    return leadsApi.update(leadId, { status, ...safeDetails });
  },

  updateProposal: async (leadId, proposalData) => {
    const journey = await leadsApi.getJourney(leadId);
    let proposal;
    if (journey.proposal) {
      proposal = await apiClient.patch(`/proposals/${journey.proposal.id}`, {
        business_analysis: proposalData.businessAnalysis,
        technical_analysis: proposalData.technicalAnalysis,
        risk_analysis: proposalData.riskAnalysis,
        scope: proposalData.scope,
        timeline: proposalData.timeline,
        est_hours: proposalData.estHours ? parseInt(proposalData.estHours, 10) : undefined,
        quotation_amount: proposalData.quotationAmount ? parseFloat(proposalData.quotationAmount) : undefined,
        discount: proposalData.discount ? parseFloat(proposalData.discount) : undefined,
        currency: proposalData.currency,
        status: proposalData.status
      }).then(res => res.data?.data);
    } else {
      proposal = await leadsApi.createProposal(leadId, proposalData);
    }

    if (proposalData.proposalApproved && proposal) {
      await leadsApi.approveProposal(proposal.id, 'Approved via workspace');
    }
    if (proposalData.contractSigned && proposal) {
      await leadsApi.signContract(proposal.id);
    }
    if (proposalData.advanceReceived && proposal) {
      await leadsApi.receiveAdvance(proposal.id, proposalData.advanceAmount || 0);
    }

    return proposal;
  },

  updateProjectExecution: async (leadId, projData) => {
    const journey = await leadsApi.getJourney(leadId);
    let project;
    if (journey.projectExecution) {
      // Single PATCH carries every Configure Project field
      project = await leadsApi.updateProject(journey.projectExecution.id, projData);
    } else {
      project = await leadsApi.createProject(leadId, projData);
      // Status/progress are not part of the create schema — apply them after creation
      const needsPatch = (projData.status && projData.status !== 'Not Started') ||
                         (Number(projData.progressPct) > 0);
      if (project?.id && needsPatch) {
        project = await leadsApi.updateProject(project.id, {
          status: projData.status,
          progressPct: projData.progressPct
        });
      }
    }
    return project;
  },

  updateDelivery: async (leadId, delData) => {
    return leadsApi.updateDelivery(leadId, delData);
  },

  updateCustomerSuccess: async (leadId, csData) => {
    return leadsApi.updateCustomerSuccess(leadId, csData);
  }
};
