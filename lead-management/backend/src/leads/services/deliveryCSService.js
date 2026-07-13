const deliveryCSRepository = require('../repositories/deliveryCSRepository');
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

// === Flatteners ===

const flattenDelivery = (row) => {
  if (!row) return null;
  let parsed = {};
  try {
    parsed = JSON.parse(row.remarks || '{}');
  } catch (e) {
    parsed = { delivery_remarks: row.remarks };
  }
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    lead_id: row.lead_id,
    go_live_date: row.go_live_date,
    uat_status: row.uat_status,
    documentation_status: row.documentation_status,
    acceptance_status: row.acceptance_status,
    handover_completed: row.handover_completed,
    deployment_date: row.deployment_date,
    remarks: row.remarks,
    created_at: row.created_at,
    updated_at: row.updated_at,
    
    deployment_status: parsed.deployment_status || null,
    uat_remarks: parsed.uat_remarks || null,
    documentation_delivered: parsed.documentation_delivered !== undefined ? parsed.documentation_delivered : null,
    training_completed: parsed.training_completed !== undefined ? parsed.training_completed : null,
    client_acceptance: parsed.client_acceptance || null,
    acceptance_date: parsed.acceptance_date || null,
    warranty_start: parsed.warranty_start || null,
    warranty_end: parsed.warranty_end || null,
    delivery_remarks: parsed.delivery_remarks || null
  };
};

const flattenCS = (row) => {
  if (!row) return null;
  let parsed = {};
  try {
    parsed = JSON.parse(row.amc_details || '{}');
  } catch (e) {
    parsed = { amc_details_text: row.amc_details };
  }
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    lead_id: row.lead_id,
    support_status: row.support_status,
    renewal_date: row.renewal_date,
    health_score: row.health_score,
    nps: row.nps,
    feedback: row.feedback,
    upsell_opportunity: row.upsell_opportunity,
    renewal_status: row.renewal_status,
    amc_details: row.amc_details,
    created_at: row.created_at,
    updated_at: row.updated_at,
    
    amc_status: parsed.amc_status || null,
    support_plan: parsed.support_plan || null,
    cross_sell_opportunity: parsed.cross_sell_opportunity !== undefined ? parsed.cross_sell_opportunity : null,
    last_review_date: parsed.last_review_date || null,
    next_review_date: parsed.next_review_date || null,
    success_manager: parsed.success_manager || null,
    customer_status: parsed.customer_status || null,
    amc_details_text: parsed.amc_details_text || null
  };
};

// === Delivery Services ===

const createDelivery = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);

  // Guard 1: Completed Project exists
  const project = await deliveryCSRepository.findCompletedProjectByLeadId(leadId, tenantId);
  if (!project) {
    throw new ValidationError('A delivery record can only be created for leads with a completed project');
  }

  // Guard 2: Uniqueness check (Max 1 active Delivery per Lead)
  const existing = await deliveryCSRepository.findDeliveryByLeadId(leadId, tenantId);
  if (existing) {
    throw new ValidationError('A delivery record already exists for this Lead');
  }

  // Pack serialized properties
  const serializedRemarks = {
    deployment_status: data.deployment_status || null,
    uat_remarks: data.uat_remarks || null,
    documentation_delivered: data.documentation_delivered || false,
    training_completed: data.training_completed || false,
    client_acceptance: data.client_acceptance || null,
    acceptance_date: data.acceptance_date || null,
    warranty_start: data.warranty_start || null,
    warranty_end: data.warranty_end || null,
    delivery_remarks: data.delivery_remarks || null
  };

  const dbPayload = {
    go_live_date: data.go_live_date,
    uat_status: data.uat_status,
    documentation_status: data.documentation_status,
    acceptance_status: data.acceptance_status,
    handover_completed: data.handover_completed,
    deployment_date: data.deployment_date,
    remarks: JSON.stringify(serializedRemarks)
  };

  return withTransaction(async (transactionClient) => {
    const row = await deliveryCSRepository.createDelivery(tenantId, leadId, dbPayload, transactionClient);
    
    // Log Activities
    await leadRepository.createActivity(tenantId, leadId, 'Delivery Created', 'lead_deliveries', row.id, userId, {}, transactionClient);
    
    if (dbPayload.go_live_date) {
      await leadRepository.createActivity(tenantId, leadId, 'Go Live', 'lead_deliveries', row.id, userId, { go_live_date: dbPayload.go_live_date }, transactionClient);
    }
    if (dbPayload.uat_status === 'Approved') {
      await leadRepository.createActivity(tenantId, leadId, 'UAT Completed', 'lead_deliveries', row.id, userId, { uat_status: dbPayload.uat_status }, transactionClient);
    }
    if (serializedRemarks.documentation_delivered) {
      await leadRepository.createActivity(tenantId, leadId, 'Documentation Delivered', 'lead_deliveries', row.id, userId, {}, transactionClient);
    }
    if (serializedRemarks.training_completed) {
      await leadRepository.createActivity(tenantId, leadId, 'Training Completed', 'lead_deliveries', row.id, userId, {}, transactionClient);
    }
    if (dbPayload.acceptance_status === 'Accepted' || serializedRemarks.client_acceptance === 'Accepted') {
      await leadRepository.createActivity(tenantId, leadId, 'Customer Accepted', 'lead_deliveries', row.id, userId, {}, transactionClient);
    }

    return flattenDelivery(row);
  });
};

const updateDelivery = async (id, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  const delivery = await deliveryCSRepository.findDeliveryById(id, tenantId);
  if (!delivery) {
    throw new LeadNotFoundError('Delivery record not found');
  }

  // Access check
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (delivery.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only update deliveries assigned to your team');
    }
  }

  // Parse current remarks JSON
  let currentRemarks = {};
  try {
    currentRemarks = JSON.parse(delivery.remarks || '{}');
  } catch (e) {}

  // Update serialized remarks properties
  const serializedKeys = [
    'deployment_status', 'uat_remarks', 'documentation_delivered',
    'training_completed', 'client_acceptance', 'acceptance_date',
    'warranty_start', 'warranty_end', 'delivery_remarks'
  ];

  serializedKeys.forEach((key) => {
    if (data[key] !== undefined) {
      currentRemarks[key] = data[key];
    }
  });

  // Direct database fields mapping
  const dbPayload = {};
  const directFields = ['go_live_date', 'uat_status', 'documentation_status', 'acceptance_status', 'handover_completed', 'deployment_date'];
  directFields.forEach((field) => {
    if (data[field] !== undefined) {
      dbPayload[field] = data[field];
    }
  });
  dbPayload.remarks = JSON.stringify(currentRemarks);

  return withTransaction(async (transactionClient) => {
    const updated = await deliveryCSRepository.updateDelivery(id, tenantId, dbPayload, transactionClient);

    // Logging activities based on value changes
    await leadRepository.createActivity(tenantId, delivery.lead_id, 'Delivery Updated', 'lead_deliveries', id, userId, {}, transactionClient);

    if (data.go_live_date && data.go_live_date !== delivery.go_live_date) {
      await leadRepository.createActivity(tenantId, delivery.lead_id, 'Go Live', 'lead_deliveries', id, userId, { go_live_date: data.go_live_date }, transactionClient);
    }
    if (data.uat_status === 'Approved' && delivery.uat_status !== 'Approved') {
      await leadRepository.createActivity(tenantId, delivery.lead_id, 'UAT Completed', 'lead_deliveries', id, userId, { uat_status: data.uat_status }, transactionClient);
    }
    if (data.documentation_delivered === true && currentRemarks.documentation_delivered !== true) {
      await leadRepository.createActivity(tenantId, delivery.lead_id, 'Documentation Delivered', 'lead_deliveries', id, userId, {}, transactionClient);
    }
    if (data.training_completed === true && currentRemarks.training_completed !== true) {
      await leadRepository.createActivity(tenantId, delivery.lead_id, 'Training Completed', 'lead_deliveries', id, userId, {}, transactionClient);
    }
    if ((data.acceptance_status === 'Accepted' && delivery.acceptance_status !== 'Accepted') || 
        (data.client_acceptance === 'Accepted' && currentRemarks.client_acceptance !== 'Accepted')) {
      await leadRepository.createActivity(tenantId, delivery.lead_id, 'Customer Accepted', 'lead_deliveries', id, userId, {}, transactionClient);
    }

    return flattenDelivery(updated);
  });
};

const deleteDelivery = async (id, tenantId, userId, userRole) => {
  enforceNotDeveloper(userRole);
  const delivery = await deliveryCSRepository.findDeliveryById(id, tenantId);
  if (!delivery) {
    throw new LeadNotFoundError('Delivery record not found');
  }

  // Access Check
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (delivery.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only delete deliveries assigned to your team');
    }
  }

  return withTransaction(async (transactionClient) => {
    await deliveryCSRepository.deleteDelivery(id, tenantId, transactionClient);
    await leadRepository.createActivity(tenantId, delivery.lead_id, 'Delivery Deleted', 'lead_deliveries', id, userId, {}, transactionClient);
    return true;
  });
};

const getDeliveryById = async (id, tenantId, userId, userRole) => {
  const delivery = await deliveryCSRepository.findDeliveryById(id, tenantId);
  if (!delivery) {
    throw new LeadNotFoundError('Delivery record not found');
  }

  // Access checks
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (delivery.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only view deliveries assigned to your team');
    }
  } else if (userRole === ROLES.DEVELOPER) {
    if (delivery.assigned_sales_user_id !== userId) {
      throw new ForbiddenError('You can only view deliveries assigned to you');
    }
  }

  return flattenDelivery(delivery);
};

const getDeliveryByLeadId = async (leadId, tenantId, userId, userRole) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  const delivery = await deliveryCSRepository.findDeliveryByLeadId(leadId, tenantId);
  return flattenDelivery(delivery);
};

const listDeliveries = async (tenantId, userId, userRole, filters) => {
  const queryFilters = { ...filters };

  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (!tlTeamId) return { rows: [], total: 0 };
    queryFilters.team = tlTeamId;
  } else if (userRole === ROLES.DEVELOPER) {
    queryFilters.developer = userId;
  }

  const { rows, total } = await deliveryCSRepository.findAllDeliveries(tenantId, queryFilters);
  return {
    rows: rows.map(flattenDelivery),
    total
  };
};

// === Customer Success Services ===

const createCustomerSuccess = async (leadId, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  await checkLeadAccess(leadId, tenantId, userRole, userId);

  // Guard 1: CS record unique per lead
  const existing = await deliveryCSRepository.findCSByLeadId(leadId, tenantId);
  if (existing) {
    throw new ValidationError('A Customer Success record already exists for this Lead');
  }

  // Guard 2: Renewal date vs Go live date
  if (data.renewal_date) {
    const delivery = await deliveryCSRepository.findDeliveryByLeadId(leadId, tenantId);
    if (delivery && delivery.go_live_date && new Date(data.renewal_date) < new Date(delivery.go_live_date)) {
      throw new ValidationError('Renewal date cannot be before Go Live date');
    }
  }

  const serializedAmc = {
    amc_status: data.amc_status || null,
    support_plan: data.support_plan || null,
    cross_sell_opportunity: data.cross_sell_opportunity || false,
    last_review_date: data.last_review_date || null,
    next_review_date: data.next_review_date || null,
    success_manager: data.success_manager || null,
    customer_status: data.customer_status || null,
    amc_details_text: data.amc_details_text || null
  };

  const dbPayload = {
    support_status: data.support_status,
    renewal_date: data.renewal_date,
    health_score: data.health_score,
    nps: data.nps,
    feedback: data.feedback,
    upsell_opportunity: data.upsell_opportunity,
    renewal_status: data.renewal_status,
    amc_details: JSON.stringify(serializedAmc)
  };

  return withTransaction(async (transactionClient) => {
    const row = await deliveryCSRepository.createCustomerSuccess(tenantId, leadId, dbPayload, transactionClient);

    // Logging activities
    await leadRepository.createActivity(tenantId, leadId, 'Customer Success Created', 'customer_success', row.id, userId, {}, transactionClient);
    
    if (dbPayload.health_score !== null) {
      await leadRepository.createActivity(tenantId, leadId, 'Health Score Updated', 'customer_success', row.id, userId, { health_score: dbPayload.health_score }, transactionClient);
    }
    if (serializedAmc.amc_status || serializedAmc.amc_details_text) {
      await leadRepository.createActivity(tenantId, leadId, 'AMC Updated', 'customer_success', row.id, userId, { amc_status: serializedAmc.amc_status }, transactionClient);
    }
    if (dbPayload.renewal_status || dbPayload.renewal_date) {
      await leadRepository.createActivity(tenantId, leadId, 'Renewal Updated', 'customer_success', row.id, userId, { renewal_status: dbPayload.renewal_status }, transactionClient);
    }
    if (dbPayload.feedback) {
      await leadRepository.createActivity(tenantId, leadId, 'Feedback Updated', 'customer_success', row.id, userId, {}, transactionClient);
    }

    return flattenCS(row);
  });
};

const updateCustomerSuccess = async (id, tenantId, userId, userRole, data) => {
  enforceNotDeveloper(userRole);
  const cs = await deliveryCSRepository.findCSById(id, tenantId);
  if (!cs) {
    throw new LeadNotFoundError('Customer Success record not found');
  }

  // Access check
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (cs.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only update Customer Success records assigned to your team');
    }
  }

  // Guard: Renewal date vs Go live date
  const renewalDate = data.renewal_date || cs.renewal_date;
  if (renewalDate) {
    const delivery = await deliveryCSRepository.findDeliveryByLeadId(cs.lead_id, tenantId);
    if (delivery && delivery.go_live_date && new Date(renewalDate) < new Date(delivery.go_live_date)) {
      throw new ValidationError('Renewal date cannot be before Go Live date');
    }
  }

  // Parse current amc_details JSON
  let currentAmc = {};
  try {
    currentAmc = JSON.parse(cs.amc_details || '{}');
  } catch (e) {}

  // Update serialized properties
  const serializedKeys = [
    'amc_status', 'support_plan', 'cross_sell_opportunity',
    'last_review_date', 'next_review_date', 'success_manager',
    'customer_status', 'amc_details_text'
  ];
  serializedKeys.forEach((key) => {
    if (data[key] !== undefined) {
      currentAmc[key] = data[key];
    }
  });

  // Direct database fields mapping
  const dbPayload = {};
  const directFields = ['support_status', 'renewal_date', 'health_score', 'nps', 'feedback', 'upsell_opportunity', 'renewal_status'];
  directFields.forEach((field) => {
    if (data[field] !== undefined) {
      dbPayload[field] = data[field];
    }
  });
  dbPayload.amc_details = JSON.stringify(currentAmc);

  return withTransaction(async (transactionClient) => {
    const updated = await deliveryCSRepository.updateCustomerSuccess(id, tenantId, dbPayload, transactionClient);

    // Logging activities based on value changes
    await leadRepository.createActivity(tenantId, cs.lead_id, 'Customer Success Updated', 'customer_success', id, userId, {}, transactionClient);

    if (data.health_score !== undefined && data.health_score !== cs.health_score) {
      await leadRepository.createActivity(tenantId, cs.lead_id, 'Health Score Updated', 'customer_success', id, userId, { health_score: data.health_score }, transactionClient);
    }
    if ((data.amc_status && data.amc_status !== currentAmc.amc_status) || data.amc_details_text) {
      await leadRepository.createActivity(tenantId, cs.lead_id, 'AMC Updated', 'customer_success', id, userId, { amc_status: data.amc_status || currentAmc.amc_status }, transactionClient);
    }
    if ((data.renewal_status && data.renewal_status !== cs.renewal_status) || data.renewal_date) {
      await leadRepository.createActivity(tenantId, cs.lead_id, 'Renewal Updated', 'customer_success', id, userId, { renewal_status: data.renewal_status || cs.renewal_status }, transactionClient);
    }
    if (data.feedback && data.feedback !== cs.feedback) {
      await leadRepository.createActivity(tenantId, cs.lead_id, 'Feedback Updated', 'customer_success', id, userId, {}, transactionClient);
    }

    return flattenCS(updated);
  });
};

const deleteCustomerSuccess = async (id, tenantId, userId, userRole) => {
  enforceNotDeveloper(userRole);
  const cs = await deliveryCSRepository.findCSById(id, tenantId);
  if (!cs) {
    throw new LeadNotFoundError('Customer Success record not found');
  }

  // Access check
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (cs.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only delete Customer Success records assigned to your team');
    }
  }

  return withTransaction(async (transactionClient) => {
    await deliveryCSRepository.deleteCustomerSuccess(id, tenantId, transactionClient);
    await leadRepository.createActivity(tenantId, cs.lead_id, 'Customer Success Deleted', 'customer_success', id, userId, {}, transactionClient);
    return true;
  });
};

const getCSById = async (id, tenantId, userId, userRole) => {
  const cs = await deliveryCSRepository.findCSById(id, tenantId);
  if (!cs) {
    throw new LeadNotFoundError('Customer Success record not found');
  }

  // Access checks
  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (cs.team_id !== tlTeamId) {
      throw new ForbiddenError('You can only view Customer Success records assigned to your team');
    }
  } else if (userRole === ROLES.DEVELOPER) {
    if (cs.assigned_sales_user_id !== userId) {
      throw new ForbiddenError('You can only view Customer Success records assigned to you');
    }
  }

  return flattenCS(cs);
};

const getCSByLeadId = async (leadId, tenantId, userId, userRole) => {
  await checkLeadAccess(leadId, tenantId, userRole, userId);
  const cs = await deliveryCSRepository.findCSByLeadId(leadId, tenantId);
  return flattenCS(cs);
};

const listCS = async (tenantId, userId, userRole, filters) => {
  const queryFilters = { ...filters };

  if (userRole === ROLES.TEAM_LEADER) {
    const tlTeamId = await leadRepository.findTeamLeaderTeamId(userId, tenantId);
    if (!tlTeamId) return { rows: [], total: 0 };
    queryFilters.team = tlTeamId;
  } else if (userRole === ROLES.DEVELOPER) {
    queryFilters.developer = userId;
  }

  const { rows, total } = await deliveryCSRepository.findAllCS(tenantId, queryFilters);
  return {
    rows: rows.map(flattenCS),
    total
  };
};

module.exports = {
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getDeliveryById,
  getDeliveryByLeadId,
  listDeliveries,
  
  createCustomerSuccess,
  updateCustomerSuccess,
  deleteCustomerSuccess,
  getCSById,
  getCSByLeadId,
  listCS
};
