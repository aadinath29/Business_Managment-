const projectRepository = require('../repositories/projectRepository');
const leadRepository = require('../repositories/leadRepository');
const { ROLES } = require('../../auth/constants/authConstants');
const { LeadNotFoundError } = require('../errors/leadErrors');
const { ValidationError, ForbiddenError } = require('../../auth/errors/authErrors');
const { withTransaction } = require('../../database/transactions');

// Helper to check user roles
const enforceNotDeveloper = (userRole) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Access Denied: Developers do not have management access');
  }
};

const checkLeadAccess = async (leadId, tenantId, userRole, userId) => {
  const lead = await leadRepository.findById(leadId, tenantId);
  if (!lead || lead.deleted_at) {
    throw new LeadNotFoundError('Lead not found or has been deleted');
  }

  if (userRole === ROLES.TEAM_LEADER) {
    const teamLeaderTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    const isAssignedSales = lead.assigned_sales_user_id === userId;
    const isAssignedTeam = teamLeaderTeamId && lead.team_id === teamLeaderTeamId;

    if (!isAssignedSales && !isAssignedTeam) {
      throw new ForbiddenError('You are only authorized to access leads assigned to your team or user account');
    }
  }

  return lead;
};

// === Lead Assignment Service ===

const assignOrReassignLead = async (leadId, tenantId, assignerId, assignerRole, data, isReassign = false) => {
  enforceNotDeveloper(assignerRole);
  const lead = await checkLeadAccess(leadId, tenantId, assignerRole, assignerId);

  // 1. Validation of target Team/Developer
  let targetTeamId = data.assigned_team_id || null;
  let targetUserId = data.assigned_to_user_id || null;

  if (targetTeamId) {
    const team = await projectRepository.findTeamById(targetTeamId, tenantId);
    if (!team || team.deleted_at) {
      throw new ValidationError('Target Team does not exist or has been deleted');
    }
    if (team.branch_id !== lead.branch_id) {
      throw new ValidationError('Target Team must belong to the same branch as the Lead');
    }
  }

  if (targetUserId) {
    const user = await projectRepository.findUserById(targetUserId, tenantId);
    if (!user || user.deleted_at) {
      throw new ValidationError('Target User does not exist or has been deleted');
    }
    if (user.status !== 'Active') {
      throw new ValidationError('Target User account is inactive');
    }

    if (data.assignment_type === 'Developer') {
      const dev = await projectRepository.findDeveloperByIdAndTeam(targetUserId, tenantId);
      if (!dev) {
        throw new ValidationError('Target Developer does not exist or has been deleted');
      }
      
      // Developer belongs to Team
      if (targetTeamId && dev.team_id !== targetTeamId) {
        throw new ValidationError('Target Developer does not belong to the selected Team');
      }
      
      // Automatically set team_id to developer's team_id if missing
      if (!targetTeamId) {
        targetTeamId = dev.team_id;
      }
    }
  }

  // Team Leader assignment boundary
  if (assignerRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(assignerId, tenantId);
    if (targetTeamId && targetTeamId !== tlTeamId) {
      throw new ForbiddenError('Team Leaders can only assign leads to members of their own team');
    }
    if (targetUserId) {
      const dev = await projectRepository.findDeveloperByIdAndTeam(targetUserId, tenantId);
      if (dev && dev.team_id !== tlTeamId) {
        throw new ForbiddenError('Team Leaders can only assign developers from their own team');
      }
    }
  }

  // 2. Lookup current assignee to populate assigned_from_user_id
  const currentAssign = await projectRepository.findCurrentAssignment(leadId, tenantId);
  const fromUserId = currentAssign ? currentAssign.assigned_to_user_id : null;

  return withTransaction(async (transactionClient) => {
    // 3. Deactivate previous assignments
    await projectRepository.deactivatePreviousAssignments(leadId, tenantId, transactionClient);

    // 4. Create new history entry
    const assignmentPayload = {
      assigned_from_user_id: fromUserId,
      assigned_to_user_id: targetUserId,
      assigned_team_id: targetTeamId,
      reason: data.reason,
      assignment_type: data.assignment_type
    };
    const newAssignment = await projectRepository.createAssignment(
      tenantId, leadId, assignerId, assignmentPayload, transactionClient
    );

    // 5. Update main Lead record
    await leadRepository.update(
      leadId, tenantId, 
      { team_id: targetTeamId, assigned_sales_user_id: targetUserId }, 
      transactionClient
    );

    // 6. Log Lead Activity
    await leadRepository.createActivity(
      tenantId, leadId, isReassign ? 'Lead Reassigned' : 'Lead Assigned', 'lead_assignments', newAssignment.id, assignerId,
      { assignment_type: data.assignment_type, reason: data.reason }, transactionClient
    );

    return newAssignment;
  });
};

const getLeadAssignment = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return projectRepository.findCurrentAssignment(leadId, tenantId);
};

const getLeadAssignmentHistory = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return projectRepository.findAssignmentHistory(leadId, tenantId);
};

// === Projects Service ===

const createProject = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  const lead = await checkLeadAccess(leadId, tenantId, userRole, userId);

  // 1. Check uniqueness
  const existing = await projectRepository.findProjectByLeadId(leadId, tenantId);
  if (existing) {
    throw new ValidationError('Project already exists for this Lead');
  }

  // 2. Use the approved proposal for defaults when one exists (no longer a hard
  //    requirement — Phase 4 execution can be configured before formal approval)
  const proposals = await leadRepository.findProposalsByLeadId(leadId, tenantId);
  const approvedProp = proposals.find(p => p.is_approved) || null;

  // 3. Populate default values
  const projectPayload = {
    project_name: data.project_name || `${lead.name} Project`,
    team_id: lead.team_id,
    developer_id: lead.assigned_sales_user_id, // assigned developer/user
    technology: data.technology || 'Unspecified',
    status: 'Not Started',
    progress_pct: 0,
    total_cost: data.total_cost || (approvedProp ? approvedProp.final_cost : 0) || 0,
    start_date: data.start_date || new Date(),
    deadline: data.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // default +90 days
    remarks: data.remarks || null,
    priority: data.priority || 'Medium',
    risk_level: data.risk_level || 'Low',
    current_sprint: data.current_sprint || null,
    expected_hours: data.expected_hours || null
  };

  if (new Date(projectPayload.deadline) < new Date(projectPayload.start_date)) {
    throw new ValidationError('Project deadline cannot be before start date');
  }

  return withTransaction(async (transactionClient) => {
    const project = await projectRepository.createProject(tenantId, leadId, projectPayload, transactionClient);
    
    // Log Lead Activity
    await leadRepository.createActivity(
      tenantId, leadId, 'Project Created', 'projects', project.id, userId,
      { project_name: project.project_name, total_cost: project.total_cost }, transactionClient
    );

    return project;
  });
};

const getProjects = async (tenantId, userRole, userId, filters) => {
  const queryFilters = { ...filters };

  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (!tlTeamId) {
      return { rows: [], total: 0 };
    }
    queryFilters.team = tlTeamId;
  } else if (userRole === ROLES.DEVELOPER) {
    queryFilters.developer = userId;
  }

  return projectRepository.findAllProjects(tenantId, queryFilters);
};

const getProjectById = async (id, tenantId, userRole, userId) => {
  const project = await projectRepository.findProjectById(id, tenantId);
  if (!project) {
    throw new LeadNotFoundError('Project not found');
  }

  // RBAC Access checks
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (project.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only view projects assigned to your team');
    }
  } else if (userRole === ROLES.DEVELOPER) {
    if (project.developer_id !== userId) {
      throw new ForbiddenError('You can only view projects assigned to you');
    }
  }

  return project;
};

const updateProject = async (id, tenantId, userRole, userId, data) => {
  enforceNotDeveloper(userRole);
  const project = await getProjectById(id, tenantId, userRole, userId);

  const updatedPayload = { ...data };

  // Date Range Checks
  const startDate = data.start_date || project.start_date;
  const deadline = data.deadline || project.deadline;
  if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
    throw new ValidationError('Project deadline cannot be before start date');
  }

  return withTransaction(async (transactionClient) => {
    const updated = await projectRepository.updateProject(id, tenantId, updatedPayload, transactionClient);
    
    // Log Lead Activity
    await leadRepository.createActivity(
      tenantId, project.lead_id, 'Project Updated', 'projects', id, userId,
      { status: updated.status, progress_pct: updated.progress_pct }, transactionClient
    );

    return updated;
  });
};

const deleteProject = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const project = await getProjectById(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await projectRepository.deleteProject(id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, project.lead_id, 'Project Deleted', 'projects', id, userId,
      { project_name: project.project_name }, transactionClient
    );
    return true;
  });
};

const updateProjectProgress = async (id, tenantId, userRole, userId, data) => {
  const project = await getProjectById(id, tenantId, userRole, userId);

  // progress cannot decrease
  if (data.progress_pct < project.progress_pct) {
    throw new ValidationError('Progress cannot decrease below completed work');
  }

  const updatedPayload = {
    progress_pct: data.progress_pct,
    remarks: data.remarks || project.remarks
  };

  // Automatically set status Completed if progress is 100%
  if (data.progress_pct === 100) {
    updatedPayload.status = 'Completed';
  } else if (data.status) {
    updatedPayload.status = data.status;
  }

  return withTransaction(async (transactionClient) => {
    const updated = await projectRepository.updateProject(id, tenantId, updatedPayload, transactionClient);
    
    // Log Activity
    await leadRepository.createActivity(
      tenantId, project.lead_id, 'Project Progress Updated', 'projects', id, userId,
      { progress_pct: updated.progress_pct, status: updated.status, remarks: data.remarks }, transactionClient
    );

    return updated;
  });
};

const getProjectStatistics = async (tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  return projectRepository.getProjectStatistics(tenantId);
};

module.exports = {
  assignOrReassignLead,
  getLeadAssignment,
  getLeadAssignmentHistory,
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectProgress,
  getProjectStatistics
};
