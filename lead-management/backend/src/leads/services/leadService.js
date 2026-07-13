const leadRepository = require('../repositories/leadRepository');
const { LeadNotFoundError, BranchNotFoundError, TeamNotFoundError, InvalidTransitionError } = require('../errors/leadErrors');
const { ForbiddenError, ValidationError } = require('../../auth/errors/authErrors');
const { ROLES } = require('../../auth/constants/authConstants');
const { JOURNEY_STAGE_ORDER } = require('../constants/leadConstants');
const { withTransaction } = require('../../database/transactions');
const logger = require('../../config/logger');

/**
 * Ensures user has management permissions (Super Admin or Admin).
 */
const enforceManagementRole = (userRole) => {
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('Only Administrators can modify lead resources');
  }
};

/**
 * Ensures user is not a Developer (Developers have no access to Leads Module).
 */
const enforceNotDeveloper = (userRole) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Access Denied: Developers do not have access to lead resources');
  }
};

/**
 * Checks if a Team Leader user has access to a specific lead.
 */
const checkLeadAccess = async (leadId, tenantId, userRole, userId) => {
  const lead = await leadRepository.findById(leadId, tenantId);
  if (!lead) {
    throw new LeadNotFoundError();
  }
  return lead;
};

/**
 * Creates a new lead.
 */
const createLead = async (tenantId, userRole, userId, data) => {
  enforceManagementRole(userRole);

  // Validate email uniqueness if supplied
  if (data.email) {
    const emailExists = await leadRepository.checkEmailExists(tenantId, data.email);
    if (emailExists) {
      throw new ValidationError('A lead with this email address already exists');
    }
  }

  // Validate branch exists
  const branchExists = await leadRepository.checkBranchExists(tenantId, data.branch_id);
  if (!branchExists) {
    throw new BranchNotFoundError();
  }

  // Validate team exists and belongs to the branch if supplied
  if (data.team_id) {
    const teamExists = await leadRepository.checkTeamExists(tenantId, data.branch_id, data.team_id);
    if (!teamExists) {
      throw new TeamNotFoundError();
    }
  }

  // Perform lead creation and activity log in a single transaction
  return withTransaction(async (transactionClient) => {
    const lead = await leadRepository.create(tenantId, data, transactionClient);
    
    // Create activity log
    await leadRepository.createActivity(
      tenantId,
      lead.id,
      'Lead Created',
      'leads',
      lead.id,
      userId,
      { name: lead.name, status: lead.status },
      transactionClient
    );

    logger.info(`Lead Created: ID=${lead.id} | Name=${lead.name} | Tenant=${tenantId}`);
    return lead;
  });
};

/**
 * Lists leads with filtering, search, pagination, and RBAC constraints.
 */
const getLeads = async (tenantId, userRole, userId, filters) => {
  enforceNotDeveloper(userRole);
  return leadRepository.findAll(tenantId, filters);
};

/**
 * Get details of a single lead.
 */
const getLeadById = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  return checkLeadAccess(id, tenantId, userRole, userId);
};

/**
 * Partially updates an existing lead.
 */
const updateLead = async (id, tenantId, userRole, userId, data) => {
  if (userRole === ROLES.TEAM_LEADER) {
    await checkLeadAccess(id, tenantId, userRole, userId);
  } else {
    enforceManagementRole(userRole);
  }

  const existingLead = await leadRepository.findById(id, tenantId);
  if (!existingLead) {
    throw new LeadNotFoundError();
  }

  // Validate email uniqueness if changing email
  if (data.email && data.email.toLowerCase() !== (existingLead.email || '').toLowerCase()) {
    const emailExists = await leadRepository.checkEmailExists(tenantId, data.email, id);
    if (emailExists) {
      throw new ValidationError('A lead with this email address already exists');
    }
  }

  // Resolve branch and team variables for validation checks
  const targetBranchId = data.branch_id || existingLead.branch_id;
  const targetTeamId = data.team_id !== undefined ? data.team_id : existingLead.team_id;

  // Validate branch changes
  if (data.branch_id && data.branch_id !== existingLead.branch_id) {
    const branchExists = await leadRepository.checkBranchExists(tenantId, data.branch_id);
    if (!branchExists) {
      throw new BranchNotFoundError();
    }
  }

  // Validate team changes relative to branch context
  if (targetTeamId && (data.team_id !== undefined || data.branch_id)) {
    const teamExists = await leadRepository.checkTeamExists(tenantId, targetBranchId, targetTeamId);
    if (!teamExists) {
      throw new TeamNotFoundError();
    }
  }

  const statusChanged = data.status && data.status !== existingLead.status;
  const oldStatus = existingLead.status;
  const newStatus = data.status;

  return withTransaction(async (transactionClient) => {
    const updatedLead = await leadRepository.update(id, tenantId, data, transactionClient);

    if (statusChanged) {
      // Create status history log
      const statusHistory = await leadRepository.createStatusHistory(
        tenantId,
        id,
        oldStatus,
        newStatus,
        userId,
        data.reminder_notes || 'Status updated',
        transactionClient
      );

      // Create activity log
      await leadRepository.createActivity(
        tenantId,
        id,
        'Status Changed',
        'lead_status_history',
        statusHistory.id,
        userId,
        { old_status: oldStatus, new_status: newStatus },
        transactionClient
      );
    }

    logger.info(`Lead Updated: ID=${id} | Tenant=${tenantId}`);
    return updatedLead;
  });
};

/**
 * Soft deletes a lead.
 */
const deleteLead = async (id, tenantId, userRole) => {
  enforceManagementRole(userRole);

  const existingLead = await leadRepository.findById(id, tenantId);
  if (!existingLead) {
    throw new LeadNotFoundError();
  }

  await leadRepository.softDelete(id, tenantId);
  logger.info(`Lead Deleted (Soft): ID=${id} | Tenant=${tenantId}`);
  return true;
};

/**
 * Get lead journey history.
 */
const getLeadJourney = async (leadId, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findJourneyByLeadId(leadId, tenantId);
};

/**
 * Updates the current lead journey stage.
 */
const updateLeadJourney = async (leadId, tenantId, userRole, userId, journeyData) => {
  // Team Leader can update only if assigned, SUPER_ADMIN/ADMIN can update always
  if (userRole === ROLES.TEAM_LEADER) {
    await checkLeadAccess(leadId, tenantId, userRole, userId);
  } else {
    enforceManagementRole(userRole);
    // Ensure lead exists and belongs to tenant
    const lead = await leadRepository.findById(leadId, tenantId);
    if (!lead) {
      throw new LeadNotFoundError();
    }
  }

  const lead = await leadRepository.findById(leadId, tenantId);

  // Reject transitions if lead status is Closed Won / Closed Lost
  if (lead.status === 'Closed Won' || lead.status === 'Closed Lost') {
    throw new InvalidTransitionError(`Cannot transition stage of a closed lead (${lead.status})`);
  }

  return withTransaction(async (transactionClient) => {
    const activeStage = await leadRepository.findActiveJourneyStage(leadId, tenantId, transactionClient);

    if (activeStage) {
      if (activeStage.stage === journeyData.stage) {
        // If same stage, just update it (e.g. status transition or remarks change)
        const updatedStage = await leadRepository.updateJourneyStage(
          activeStage.id,
          tenantId,
          journeyData.status || activeStage.status,
          journeyData.status === 'Completed' ? new Date() : activeStage.completed_at,
          journeyData.remarks,
          transactionClient
        );

        // Log general activity
        await leadRepository.createActivity(
          tenantId,
          leadId,
          'Journey Updated',
          'lead_journey',
          updatedStage.id,
          userId,
          { stage: journeyData.stage, status: updatedStage.status, remarks: journeyData.remarks },
          transactionClient
        );

        if (journeyData.status === 'Completed' && activeStage.status !== 'Completed') {
          await leadRepository.createActivity(
            tenantId,
            leadId,
            'Stage Completed',
            'lead_journey',
            updatedStage.id,
            userId,
            { stage: journeyData.stage },
            transactionClient
          );
        }

        return updatedStage;
      }

      // If different stage, enforce sequential transition
      const currentIdx = JOURNEY_STAGE_ORDER[activeStage.stage];
      const nextIdx = JOURNEY_STAGE_ORDER[journeyData.stage];

      if (nextIdx <= currentIdx) {
        throw new InvalidTransitionError(`Cannot transition backward from ${activeStage.stage} to ${journeyData.stage}`);
      }

      // Close the current active stage
      await leadRepository.updateJourneyStage(
        activeStage.id,
        tenantId,
        'Completed',
        new Date(),
        'Completed via transition to next stage',
        transactionClient
      );

      // Log Stage Completed activity
      await leadRepository.createActivity(
        tenantId,
        leadId,
        'Stage Completed',
        'lead_journey',
        activeStage.id,
        userId,
        { stage: activeStage.stage },
        transactionClient
      );
    }

    // Insert new journey stage
    const newStage = await leadRepository.createJourneyStage(
      tenantId,
      leadId,
      journeyData.stage,
      journeyData.status || 'In Progress',
      new Date(),
      userId,
      journeyData.remarks,
      transactionClient
    );

    // Log Journey Updated activity
    await leadRepository.createActivity(
      tenantId,
      leadId,
      'Journey Updated',
      'lead_journey',
      newStage.id,
      userId,
      { stage: journeyData.stage, status: newStage.status, remarks: journeyData.remarks },
      transactionClient
    );

    return newStage;
  });
};

/**
 * Retrieve chronological timeline of lead.
 */
const getLeadTimeline = async (leadId, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const lead = await checkLeadAccess(leadId, tenantId, userRole, userId);

  const activities = await leadRepository.findActivitiesByLeadId(leadId, tenantId);
  const statusHistory = await leadRepository.findStatusHistoryByLeadId(leadId, tenantId);
  const journey = await leadRepository.findJourneyByLeadId(leadId, tenantId);

  const timeline = [];
  const seenEntityIds = new Set();

  // 1. Process activities first
  for (const act of activities) {
    timeline.push({
      id: act.id,
      type: act.activity_type,
      date: act.created_at,
      performed_by: act.performed_by,
      performed_by_name: act.performed_by_name || 'System',
      metadata: act.metadata,
      remarks: act.metadata ? act.metadata.remarks : null
    });
    if (act.entity_id) {
      seenEntityIds.add(act.entity_id);
    }
  }

  // 2. Process status history if not already accounted for by activity
  for (const sh of statusHistory) {
    if (!seenEntityIds.has(sh.id)) {
      timeline.push({
        id: sh.id,
        type: 'Status Changed',
        date: sh.changed_at,
        performed_by: sh.changed_by,
        performed_by_name: sh.changed_by_name || 'System',
        metadata: { old_status: sh.old_status, new_status: sh.new_status },
        remarks: sh.remarks
      });
    }
  }

  // 3. Process journey stages if not already accounted for
  for (const j of journey) {
    if (!seenEntityIds.has(j.id)) {
      timeline.push({
        id: j.id,
        type: 'Journey Updated',
        date: j.created_at,
        performed_by: j.entered_by,
        performed_by_name: j.entered_by_name || 'System',
        metadata: { stage: j.stage, status: j.status, started_at: j.started_at, completed_at: j.completed_at },
        remarks: j.remarks
      });
    }
  }

  // 4. Fallback Lead Creation activity check
  const hasCreatedActivity = timeline.some(t => t.type === 'Lead Created');
  if (!hasCreatedActivity) {
    timeline.push({
      id: lead.id,
      type: 'Lead Created',
      date: lead.created_at,
      performed_by: lead.assigned_sales_user_id,
      performed_by_name: lead.assigned_sales_name || 'System',
      metadata: { name: lead.name, status: lead.status },
      remarks: 'Lead created in the system'
    });
  }

  // Sort newest first
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  return timeline;
};

/**
 * Notes Service Operations
 */
const checkNoteAccess = async (id, tenantId, userRole, userId) => {
  const note = await leadRepository.findNoteById(id, tenantId);
  if (!note) {
    throw new LeadNotFoundError('Note not found');
  }
  await checkLeadAccess(note.lead_id, tenantId, userRole, userId);
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN && note.author_id !== userId) {
    throw new ForbiddenError('You can only modify/delete notes you have authored');
  }
  return note;
};

const createNote = async (leadId, tenantId, authorId, userRole, content) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, authorId);

  return withTransaction(async (transactionClient) => {
    const note = await leadRepository.createNote(tenantId, leadId, authorId, content, transactionClient);
    await leadRepository.createActivity(
      tenantId, leadId, 'Note Created', 'lead_notes', note.id, authorId,
      { content_preview: content.substring(0, 50) }, transactionClient
    );
    return note;
  });
};

const getNotesByLeadId = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findNotesByLeadId(leadId, tenantId);
};

const getNoteById = async (id, tenantId, userRole, userId) => {
  const note = await leadRepository.findNoteById(id, tenantId);
  if (!note) {
    throw new LeadNotFoundError('Note not found');
  }
  await checkLeadAccess(note.lead_id, tenantId, userRole, userId);
  return note;
};

const updateNote = async (id, tenantId, userRole, userId, content) => {
  enforceNotDeveloper(userRole);
  const note = await checkNoteAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateNote(id, tenantId, content, transactionClient);
    await leadRepository.createActivity(
      tenantId, note.lead_id, 'Note Updated', 'lead_notes', id, userId,
      { content_preview: content.substring(0, 50) }, transactionClient
    );
    return updated;
  });
};

const deleteNote = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const note = await checkNoteAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await leadRepository.deleteNote(id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, note.lead_id, 'Note Deleted', 'lead_notes', id, userId,
      { content_preview: note.content.substring(0, 50) }, transactionClient
    );
    return true;
  });
};

/**
 * Communications Service Operations
 */
const checkCommAccess = async (id, tenantId, userRole, userId) => {
  const comm = await leadRepository.findCommunicationById(id, tenantId);
  if (!comm) {
    throw new LeadNotFoundError('Communication not found');
  }
  await checkLeadAccess(comm.lead_id, tenantId, userRole, userId);
  if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN && comm.author_id !== userId) {
    throw new ForbiddenError('You can only modify/delete communications you have authored');
  }
  return comm;
};

const createCommunication = async (leadId, tenantId, authorId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, authorId);

  return withTransaction(async (transactionClient) => {
    const comm = await leadRepository.createCommunication(tenantId, leadId, authorId, data, transactionClient);
    await leadRepository.createActivity(
      tenantId, leadId, 'Communication Created', 'communications', comm.id, authorId,
      { type: data.type, subject: data.subject }, transactionClient
    );
    return comm;
  });
};

const getCommunicationsByLeadId = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findCommunicationsByLeadId(leadId, tenantId);
};

const getCommunicationById = async (id, tenantId, userRole, userId) => {
  const comm = await leadRepository.findCommunicationById(id, tenantId);
  if (!comm) {
    throw new LeadNotFoundError('Communication not found');
  }
  await checkLeadAccess(comm.lead_id, tenantId, userRole, userId);
  return comm;
};

const updateCommunication = async (id, tenantId, userRole, userId, data) => {
  enforceNotDeveloper(userRole);
  const comm = await checkCommAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateCommunication(id, tenantId, data, transactionClient);
    await leadRepository.createActivity(
      tenantId, comm.lead_id, 'Communication Updated', 'communications', id, userId,
      { type: updated.type, subject: updated.subject }, transactionClient
    );
    return updated;
  });
};

const deleteCommunication = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const comm = await checkCommAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await leadRepository.deleteCommunication(id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, comm.lead_id, 'Communication Deleted', 'communications', id, userId,
      { type: comm.type, subject: comm.subject }, transactionClient
    );
    return true;
  });
};

/**
 * Follow-ups Service Operations
 */
const updateLeadNextFollowUp = async (leadId, tenantId, client) => {
  const nextDate = await leadRepository.findNextPendingFollowupDate(leadId, tenantId, client);
  await leadRepository.update(leadId, tenantId, { next_follow_up_date: nextDate || null }, client);
};

const checkFollowupAccess = async (id, tenantId, userRole, userId) => {
  const fu = await leadRepository.findFollowupById(id, tenantId);
  if (!fu) {
    throw new LeadNotFoundError('Follow-up not found');
  }
  await checkLeadAccess(fu.lead_id, tenantId, userRole, userId);
  return fu;
};

const createFollowup = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const fu = await leadRepository.createFollowup(tenantId, leadId, userId, data, transactionClient);
    await updateLeadNextFollowUp(leadId, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, leadId, 'Follow-up Created', 'lead_followups', fu.id, userId,
      { followup_date: data.followup_date, status: fu.status }, transactionClient
    );
    return fu;
  });
};

const getFollowupsByLeadId = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findFollowupsByLeadId(leadId, tenantId);
};

const getFollowupById = async (id, tenantId, userRole, userId) => {
  const fu = await leadRepository.findFollowupById(id, tenantId);
  if (!fu) {
    throw new LeadNotFoundError('Follow-up not found');
  }
  await checkLeadAccess(fu.lead_id, tenantId, userRole, userId);
  return fu;
};

const updateFollowup = async (id, tenantId, userRole, userId, data) => {
  enforceNotDeveloper(userRole);
  const fu = await checkFollowupAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const updatedPayload = { ...data };
    if (data.status === 'Completed' && fu.status !== 'Completed' && !data.completed_date) {
      updatedPayload.completed_date = new Date();
    }

    const updated = await leadRepository.updateFollowup(id, tenantId, updatedPayload, transactionClient);
    await updateLeadNextFollowUp(fu.lead_id, tenantId, transactionClient);

    await leadRepository.createActivity(
      tenantId, fu.lead_id, 'Follow-up Updated', 'lead_followups', id, userId,
      { followup_date: updated.followup_date, status: updated.status }, transactionClient
    );

    if (data.status === 'Completed' && fu.status !== 'Completed') {
      await leadRepository.createActivity(
        tenantId, fu.lead_id, 'Follow-up Completed', 'lead_followups', id, userId,
        { outcome: updated.outcome }, transactionClient
      );
    }

    return updated;
  });
};

const deleteFollowup = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const fu = await checkFollowupAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await leadRepository.deleteFollowup(id, tenantId, transactionClient);
    await updateLeadNextFollowUp(fu.lead_id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, fu.lead_id, 'Follow-up Deleted', 'lead_followups', id, userId,
      {}, transactionClient
    );
    return true;
  });
};

/**
 * Requirements Service Operations
 */
const checkRequirementAccess = async (id, tenantId, userRole, userId) => {
  const reqItem = await leadRepository.findRequirementById(id, tenantId);
  if (!reqItem) {
    throw new LeadNotFoundError('Requirement not found');
  }
  await checkLeadAccess(reqItem.lead_id, tenantId, userRole, userId);
  return reqItem;
};

const createRequirement = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const requirement = await leadRepository.createRequirement(tenantId, leadId, userId, data, transactionClient);
    await leadRepository.createActivity(
      tenantId, leadId, 'Requirement Created', 'lead_requirements', requirement.id, userId,
      { requirement: data.requirement, priority: data.priority }, transactionClient
    );
    return requirement;
  });
};

const getRequirementsByLeadId = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findRequirementsByLeadId(leadId, tenantId);
};

const getRequirementById = async (id, tenantId, userRole, userId) => {
  const reqItem = await leadRepository.findRequirementById(id, tenantId);
  if (!reqItem) {
    throw new LeadNotFoundError('Requirement not found');
  }
  await checkLeadAccess(reqItem.lead_id, tenantId, userRole, userId);
  return reqItem;
};

const updateRequirement = async (id, tenantId, userRole, userId, data) => {
  enforceNotDeveloper(userRole);
  const reqItem = await checkRequirementAccess(id, tenantId, userRole, userId);

  // If approved is transitioning to true, capture approved_by and approved_date
  const updatedData = { ...data };
  if (data.approved && !reqItem.approved) {
    updatedData.approved_by = userId;
    updatedData.approved_date = new Date();
  }

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateRequirement(id, tenantId, userId, updatedData, transactionClient);
    await leadRepository.createActivity(
      tenantId, reqItem.lead_id, 'Requirement Updated', 'lead_requirements', id, userId,
      { requirement: updated.requirement, approved: updated.approved }, transactionClient
    );
    return updated;
  });
};

const deleteRequirement = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const reqItem = await checkRequirementAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await leadRepository.deleteRequirement(id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, reqItem.lead_id, 'Requirement Deleted', 'lead_requirements', id, userId,
      {}, transactionClient
    );
    return true;
  });
};

/**
 * Proposals Service Operations
 */
const checkProposalAccess = async (id, tenantId, userRole, userId) => {
  const prop = await leadRepository.findProposalById(id, tenantId);
  if (!prop) {
    throw new LeadNotFoundError('Proposal not found');
  }
  await checkLeadAccess(prop.lead_id, tenantId, userRole, userId);
  return prop;
};

const createProposal = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);

  const proposalData = { ...data };
  if (!proposalData.proposal_number) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    proposalData.proposal_number = `PROP-${leadId.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}-${suffix}`;
  }

  // Calculate final cost if quotation_amount and discount are set
  const qAmt = proposalData.quotation_amount || 0;
  const disc = proposalData.discount || 0;
  proposalData.final_cost = Math.max(0, qAmt - disc);

  return withTransaction(async (transactionClient) => {
    const proposal = await leadRepository.createProposal(tenantId, leadId, userId, proposalData, transactionClient);
    
    // Log Activity
    await leadRepository.createActivity(
      tenantId, leadId, 'Proposal Created', 'proposals', proposal.id, userId,
      { proposal_number: proposal.proposal_number, proposal_version: proposal.proposal_version, final_cost: proposal.final_cost },
      transactionClient
    );
    return proposal;
  });
};

const getProposalsByLeadId = async (leadId, tenantId, userRole, userId) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  return leadRepository.findProposalsByLeadId(leadId, tenantId);
};

const getProposalById = async (id, tenantId, userRole, userId) => {
  const prop = await leadRepository.findProposalById(id, tenantId);
  if (!prop) {
    throw new LeadNotFoundError('Proposal not found');
  }
  await checkLeadAccess(prop.lead_id, tenantId, userRole, userId);
  return prop;
};

const updateProposal = async (id, tenantId, userRole, userId, data) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  if (prop.is_approved || prop.status === 'Approved') {
    throw new ValidationError('An approved proposal cannot be edited. Please create a new version.');
  }

  const proposalData = { ...data };
  
  // Re-calculate final cost if needed
  const qAmt = proposalData.quotation_amount !== undefined ? proposalData.quotation_amount : Number(prop.quotation_amount || 0);
  const disc = proposalData.discount !== undefined ? proposalData.discount : Number(prop.discount || 0);
  proposalData.final_cost = Math.max(0, qAmt - disc);

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateProposal(id, tenantId, userId, proposalData, transactionClient);
    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Proposal Updated', 'proposals', id, userId,
      { proposal_number: updated.proposal_number, final_cost: updated.final_cost },
      transactionClient
    );
    return updated;
  });
};

const deleteProposal = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    await leadRepository.deleteProposal(id, tenantId, transactionClient);
    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Proposal Deleted', 'proposals', id, userId,
      {}, transactionClient
    );
    return true;
  });
};

const approveProposal = async (id, tenantId, userRole, userId, remarks) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    // 1. Update status and is_approved flag on target proposal
    const updated = await leadRepository.updateProposal(
      id, tenantId, userId, 
      { status: 'Approved', is_approved: true }, 
      transactionClient
    );

    // 2. Automatically deactivate all other versions for this lead
    await leadRepository.deactivateOtherProposals(prop.lead_id, tenantId, id, transactionClient);

    // 3. Log Activity
    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Proposal Approved', 'proposals', id, userId,
      { remarks, proposal_number: prop.proposal_number },
      transactionClient
    );

    return updated;
  });
};

const rejectProposal = async (id, tenantId, userRole, userId, remarks) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateProposal(
      id, tenantId, userId, 
      { status: 'Rejected', is_approved: false }, 
      transactionClient
    );

    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Proposal Rejected', 'proposals', id, userId,
      { remarks, proposal_number: prop.proposal_number },
      transactionClient
    );

    return updated;
  });
};

const signContract = async (id, tenantId, userRole, userId) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  if (!prop.is_approved) {
    throw new ValidationError('Signing a contract is only allowed after proposal approval');
  }

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateProposal(
      id, tenantId, userId, 
      { contract_signed: true }, 
      transactionClient
    );

    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Contract Signed', 'proposals', id, userId,
      { proposal_number: prop.proposal_number },
      transactionClient
    );

    return updated;
  });
};

const receiveAdvance = async (id, tenantId, userRole, userId, advanceAmount) => {
  enforceNotDeveloper(userRole);
  const prop = await checkProposalAccess(id, tenantId, userRole, userId);

  if (!prop.contract_signed) {
    throw new ValidationError('Advance payment is only allowed after contract signing');
  }

  return withTransaction(async (transactionClient) => {
    const updated = await leadRepository.updateProposal(
      id, tenantId, userId, 
      { advance_received: true, advance_amount: advanceAmount }, 
      transactionClient
    );

    await leadRepository.createActivity(
      tenantId, prop.lead_id, 'Advance Payment Received', 'proposals', id, userId,
      { advance_amount: advanceAmount, proposal_number: prop.proposal_number },
      transactionClient
    );

    return updated;
  });
};

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getLeadJourney,
  updateLeadJourney,
  getLeadTimeline,
  createNote,
  getNotesByLeadId,
  getNoteById,
  updateNote,
  deleteNote,
  createCommunication,
  getCommunicationsByLeadId,
  getCommunicationById,
  updateCommunication,
  deleteCommunication,
  createFollowup,
  getFollowupsByLeadId,
  getFollowupById,
  updateFollowup,
  deleteFollowup,
  createRequirement,
  getRequirementsByLeadId,
  getRequirementById,
  updateRequirement,
  deleteRequirement,
  createProposal,
  getProposalsByLeadId,
  getProposalById,
  updateProposal,
  deleteProposal,
  approveProposal,
  rejectProposal,
  signContract,
  receiveAdvance
};
