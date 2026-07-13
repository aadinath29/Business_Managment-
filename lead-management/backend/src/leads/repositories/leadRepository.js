const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

/**
 * Checks if a lead with the given email already exists in the tenant.
 */
const checkEmailExists = async (tenantId, email, excludeId = null, client = db) => {
  if (!email) return false;
  let queryText = `
    SELECT id FROM leads 
    WHERE tenant_id = $1 AND LOWER(email) = LOWER($2) AND deleted_at IS NULL
  `;
  const params = [tenantId, email];

  if (excludeId) {
    params.push(excludeId);
    queryText += ` AND id != $3`;
  }

  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Checks if branch exists and is active.
 */
const checkBranchExists = async (tenantId, branchId, client = db) => {
  const queryText = `
    SELECT id FROM branches 
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [branchId, tenantId]);
  return rows.length > 0;
};

/**
 * Checks if team exists, is active, and belongs to the specified branch.
 */
const checkTeamExists = async (tenantId, branchId, teamId, client = db) => {
  const queryText = `
    SELECT id FROM teams 
    WHERE id = $1 AND branch_id = $2 AND tenant_id = $3 AND deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [teamId, branchId, tenantId]);
  return rows.length > 0;
};

/**
 * Creates a new lead in the database.
 */
const create = async (tenantId, data, client = db) => {
  const fields = [
    'tenant_id', 'branch_id', 'team_id', 'assigned_sales_user_id',
    'name', 'company_name', 'contact_person', 'mobile', 'email',
    'industry', 'address', 'country', 'city',
    'lead_source', 'campaign', 'referral_name', 'advertisement',
    'social_media', 'website_inquiry', 'budget', 'decision_maker',
    'expected_start_date', 'business_need', 'project_type',
    'lead_score', 'priority', 'expected_revenue', 'status',
    'next_follow_up_date', 'reminder_notes'
  ];

  const params = [
    tenantId,
    data.branch_id,
    data.team_id || null,
    data.assigned_sales_user_id || null,
    data.name,
    data.company_name || null,
    data.contact_person || null,
    data.mobile || null,
    data.email || null,
    data.industry || null,
    data.address || null,
    data.country || null,
    data.city || null,
    data.lead_source || null,
    data.campaign || null,
    data.referral_name || null,
    data.advertisement || null,
    data.social_media || null,
    data.website_inquiry !== undefined ? data.website_inquiry : false,
    data.budget !== undefined ? data.budget : null,
    data.decision_maker || null,
    data.expected_start_date || null,
    data.business_need || null,
    data.project_type || null,
    data.lead_score !== undefined ? data.lead_score : null,
    data.priority || 'Medium',
    data.expected_revenue !== undefined ? data.expected_revenue : null,
    data.status || 'New',
    data.next_follow_up_date || null,
    data.reminder_notes || null
  ];

  const queryText = `
    INSERT INTO leads (${fields.join(', ')})
    VALUES (${fields.map((_, i) => `$${i + 1}`).join(', ')})
    RETURNING *
  `;

  const { rows } = await client.query(queryText, params);
  return rows[0];
};

/**
 * Finds a specific lead by ID, returning joined branch, team, and assigned sales user info.
 */
const findById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT l.*,
           b.branch_name, b.branch_code,
           t.team_name, t.department,
           u.first_name || ' ' || u.last_name as assigned_sales_name, u.email as assigned_sales_email, u.phone as assigned_sales_phone
    FROM leads l
    LEFT JOIN branches b ON l.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN teams t ON l.team_id = t.id AND t.deleted_at IS NULL
    LEFT JOIN users u ON l.assigned_sales_user_id = u.id AND u.deleted_at IS NULL
    WHERE l.id = $1 AND l.tenant_id = $2 AND l.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

/**
 * Finds team ID managed by a Team Leader user.
 */
const findTeamLeaderTeamId = async (userId, tenantId, client = db) => {
  const queryText = `
    SELECT team_id FROM team_leaders 
    WHERE user_id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [userId, tenantId]);
  return rows.length ? rows[0].team_id : null;
};

/**
 * Finds all active leads matching filters, search criteria, and RBAC constraints.
 */
const findAll = async (tenantId, filters, teamLeaderTeamId = null, teamLeaderUserId = null, client = db) => {
  const { page = 1, limit = 10, search, status, priority, branch, team, city, industry, lead_source, created_at, sortBy, sortOrder } = filters;

  const params = [tenantId];
  let filterConditions = 'WHERE l.tenant_id = $1 AND l.deleted_at IS NULL';
  
  // Ensure the lead belongs to an active (non-deleted) branch
  filterConditions += ` AND EXISTS (SELECT 1 FROM branches b2 WHERE b2.id = l.branch_id AND b2.deleted_at IS NULL)`;
  
  filterConditions += scopeHelper.getScopeCondition(params, 'l', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });

  // Filter params mapping
  if (status) {
    params.push(status);
    filterConditions += ` AND l.status = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    filterConditions += ` AND l.priority = $${params.length}`;
  }

  if (branch) {
    params.push(branch);
    filterConditions += ` AND l.branch_id = $${params.length}`;
  }

  if (team) {
    params.push(team);
    filterConditions += ` AND l.team_id = $${params.length}`;
  }

  if (city) {
    params.push(city);
    filterConditions += ` AND l.city = $${params.length}`;
  }

  if (industry) {
    params.push(industry);
    filterConditions += ` AND l.industry = $${params.length}`;
  }

  if (lead_source) {
    params.push(lead_source);
    filterConditions += ` AND l.lead_source = $${params.length}`;
  }

  if (created_at) {
    params.push(created_at);
    filterConditions += ` AND DATE(l.created_at) = $${params.length}`;
  }

  // Full Text Search over company_name, contact_person, email, mobile
  if (search) {
    params.push(`%${search}%`);
    const searchIdx = params.length;
    filterConditions += ` AND (
      l.company_name ILIKE $${searchIdx} OR
      l.contact_person ILIKE $${searchIdx} OR
      l.email ILIKE $${searchIdx} OR
      l.mobile ILIKE $${searchIdx}
    )`;
  }

  // 1. Get total matching records count
  const countQuery = `
    SELECT COUNT(*) 
    FROM leads l
    ${filterConditions}
  `;
  const countRes = await client.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10);

  // 2. Fetch paginated records list
  // sortBy and sortOrder are hard-validated by Zod to prevent SQL injection
  let selectQuery = `
    SELECT l.*,
           b.branch_name, b.branch_code,
           t.team_name, t.department,
           u.first_name || ' ' || u.last_name as assigned_sales_name, u.email as assigned_sales_email
    FROM leads l
    LEFT JOIN branches b ON l.branch_id = b.id AND b.deleted_at IS NULL
    LEFT JOIN teams t ON l.team_id = t.id AND t.deleted_at IS NULL
    LEFT JOIN users u ON l.assigned_sales_user_id = u.id AND u.deleted_at IS NULL
    ${filterConditions}
    ORDER BY l.${sortBy || 'created_at'} ${sortOrder || 'DESC'}
  `;

  const offset = (page - 1) * limit;
  params.push(limit);
  selectQuery += ` LIMIT $${params.length}`;
  params.push(offset);
  selectQuery += ` OFFSET $${params.length}`;

  const { rows } = await client.query(selectQuery, params);

  return {
    rows,
    total
  };
};

/**
 * Partially updates an existing lead.
 */
const update = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  let queryText = `
    UPDATE leads
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  queryText += ' RETURNING *';

  const { rows } = await client.query(queryText, params);
  return rows.length ? findById(id, tenantId, client) : null;
};

/**
 * Soft deletes a lead by setting deleted_at = NOW().
 */
const softDelete = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    UPDATE leads
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'branch_id', teamColumn: 'team_id', developerColumn: 'assigned_sales_user_id' });
  queryText += ' RETURNING *';
  
  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

/**
 * Find all journey stages for a specific lead.
 */
const findJourneyByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT lj.*, u.first_name || ' ' || u.last_name as entered_by_name
    FROM lead_journey lj
    LEFT JOIN users u ON lj.entered_by = u.id
    WHERE lj.lead_id = $1 AND lj.tenant_id = $2
    ORDER BY lj.created_at ASC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

/**
 * Find the currently active journey stage for a specific lead.
 */
const findActiveJourneyStage = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM lead_journey
    WHERE lead_id = $1 AND tenant_id = $2 AND status = 'In Progress'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0] : null;
};

/**
 * Create a new journey stage entry.
 */
const createJourneyStage = async (tenantId, leadId, stage, status, startedAt, enteredBy, remarks, client = db) => {
  const queryText = `
    INSERT INTO lead_journey (tenant_id, lead_id, stage, status, started_at, entered_by, remarks)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, leadId, stage, status, startedAt, enteredBy, remarks]);
  return rows[0];
};

/**
 * Update an existing journey stage entry.
 */
const updateJourneyStage = async (id, tenantId, status, completedAt, remarks, client = db) => {
  const queryText = `
    UPDATE lead_journey
    SET status = $3, completed_at = $4, remarks = COALESCE($5, remarks), updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [id, tenantId, status, completedAt, remarks]);
  return rows[0];
};

/**
 * Create a status history audit entry.
 */
const createStatusHistory = async (tenantId, leadId, oldStatus, newStatus, changedBy, remarks, client = db) => {
  const queryText = `
    INSERT INTO lead_status_history (tenant_id, lead_id, old_status, new_status, changed_by, remarks)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, leadId, oldStatus, newStatus, changedBy, remarks]);
  return rows[0];
};

/**
 * Create a lead activity log.
 */
const createActivity = async (tenantId, leadId, activityType, entityType, entityId, performedBy, metadata, client = db) => {
  const queryText = `
    INSERT INTO lead_activities (tenant_id, lead_id, activity_type, entity_type, entity_id, performed_by, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, leadId, activityType, entityType, entityId, performedBy, JSON.stringify(metadata)]);
  return rows[0];
};

/**
 * Find status history for a lead.
 */
const findStatusHistoryByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT lsh.*, u.first_name || ' ' || u.last_name as changed_by_name
    FROM lead_status_history lsh
    LEFT JOIN users u ON lsh.changed_by = u.id
    WHERE lsh.lead_id = $1 AND lsh.tenant_id = $2
    ORDER BY lsh.changed_at ASC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

/**
 * Find activities for a lead.
 */
const findActivitiesByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT la.*, u.first_name || ' ' || u.last_name as performed_by_name
    FROM lead_activities la
    LEFT JOIN users u ON la.performed_by = u.id
    WHERE la.lead_id = $1 AND la.tenant_id = $2
    ORDER BY la.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

// === NEW DATABASE OPERATIONS FOR PHASE 7C ===

/**
 * Notes Repository Operations
 */
const createNote = async (tenantId, leadId, authorId, content, client = db) => {
  const queryText = `
    INSERT INTO lead_notes (tenant_id, lead_id, author_id, content)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, leadId, authorId, content]);
  return rows[0];
};

const findNoteById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT n.*, u.first_name || ' ' || u.last_name as author_name
    FROM lead_notes n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = $1 AND n.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findNotesByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT n.*, u.first_name || ' ' || u.last_name as author_name
    FROM lead_notes n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.lead_id = $1 AND n.tenant_id = $2
    ORDER BY n.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

const updateNote = async (id, tenantId, content, client = db) => {
  const queryText = `
    UPDATE lead_notes
    SET content = $3
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [id, tenantId, content]);
  return rows.length ? findNoteById(id, tenantId, client) : null;
};

const deleteNote = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM lead_notes
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

/**
 * Communications Repository Operations
 */
const createCommunication = async (tenantId, leadId, authorId, data, client = db) => {
  const queryText = `
    INSERT INTO communications (
      tenant_id, lead_id, author_id, type, comm_date, comm_time, 
      subject, discussion_summary, client_problem, suggested_solution, 
      success_status, attachment_url
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, authorId, data.type, data.comm_date, data.comm_time || null,
    data.subject, data.discussion_summary || null, data.client_problem || null,
    data.suggested_solution || null, data.success_status !== undefined ? data.success_status : false,
    data.attachment_url || null
  ]);
  return rows[0];
};

const findCommunicationById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT c.*, u.first_name || ' ' || u.last_name as author_name
    FROM communications c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.id = $1 AND c.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findCommunicationsByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT c.*, u.first_name || ' ' || u.last_name as author_name
    FROM communications c
    LEFT JOIN users u ON c.author_id = u.id
    WHERE c.lead_id = $1 AND c.tenant_id = $2
    ORDER BY c.comm_date DESC, c.comm_time DESC, c.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

const updateCommunication = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findCommunicationById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  const queryText = `
    UPDATE communications
    SET ${assignments.join(', ')}
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, params);
  return rows.length ? findCommunicationById(id, tenantId, client) : null;
};

const deleteCommunication = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM communications
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

/**
 * Followups Repository Operations
 */
const createFollowup = async (tenantId, leadId, createdBy, data, client = db) => {
  const queryText = `
    INSERT INTO lead_followups (
      tenant_id, lead_id, created_by, communication_type, 
      reminder_notes, outcome, followup_date, completed_date, 
      status, remarks
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, createdBy, data.communication_type || null,
    data.reminder_notes || null, data.outcome || null, data.followup_date || null,
    data.completed_date || null, data.status || 'Pending', data.remarks || null
  ]);
  return rows[0];
};

const findFollowupById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT lf.*, u.first_name || ' ' || u.last_name as created_by_name
    FROM lead_followups lf
    LEFT JOIN users u ON lf.created_by = u.id
    WHERE lf.id = $1 AND lf.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findFollowupsByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT lf.*, u.first_name || ' ' || u.last_name as created_by_name
    FROM lead_followups lf
    LEFT JOIN users u ON lf.created_by = u.id
    WHERE lf.lead_id = $1 AND lf.tenant_id = $2
    ORDER BY lf.followup_date ASC, lf.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

const updateFollowup = async (id, tenantId, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findFollowupById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 3}`);
  const params = [id, tenantId, ...keys.map(key => data[key])];

  const queryText = `
    UPDATE lead_followups
    SET ${assignments.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, params);
  return rows.length ? findFollowupById(id, tenantId, client) : null;
};

const deleteFollowup = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM lead_followups
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

const findNextPendingFollowupDate = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT followup_date FROM lead_followups
    WHERE lead_id = $1 AND tenant_id = $2 AND status = 'Pending' AND followup_date >= NOW()
    ORDER BY followup_date ASC
    LIMIT 1
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows.length ? rows[0].followup_date : null;
};


// === NEW DATABASE OPERATIONS FOR PHASE 7D ===

/**
 * Requirements Repository Operations
 */
const createRequirement = async (tenantId, leadId, createdBy, data, client = db) => {
  const queryText = `
    INSERT INTO lead_requirements (
      tenant_id, lead_id, created_by, requirement, notes,
      priority, complexity, approval_status, estimated_hours,
      approved, remarks, assigned_developer_id, assigned_team
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, createdBy, data.requirement, data.notes || null,
    data.priority || 'Medium', data.complexity || 'Medium', data.approval_status || 'Pending',
    data.estimated_hours || null, data.approved || false, data.remarks || null,
    data.assigned_developer_id || null, data.assigned_team || null
  ]);
  return rows[0];
};

const findRequirementById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT lr.*,
           u.first_name || ' ' || u.last_name as creator_name,
           u2.first_name || ' ' || u2.last_name as approver_name,
           du.first_name || ' ' || du.last_name as assigned_developer_name
    FROM lead_requirements lr
    LEFT JOIN users u ON lr.created_by = u.id
    LEFT JOIN users u2 ON lr.approved_by = u2.id
    LEFT JOIN developers dv ON lr.assigned_developer_id = dv.id
    LEFT JOIN users du ON dv.user_id = du.id
    WHERE lr.id = $1 AND lr.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findRequirementsByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT lr.*,
           u.first_name || ' ' || u.last_name as creator_name,
           u2.first_name || ' ' || u2.last_name as approver_name,
           du.first_name || ' ' || du.last_name as assigned_developer_name
    FROM lead_requirements lr
    LEFT JOIN users u ON lr.created_by = u.id
    LEFT JOIN users u2 ON lr.approved_by = u2.id
    LEFT JOIN developers dv ON lr.assigned_developer_id = dv.id
    LEFT JOIN users du ON dv.user_id = du.id
    WHERE lr.lead_id = $1 AND lr.tenant_id = $2
    ORDER BY lr.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

const updateRequirement = async (id, tenantId, updatedBy, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findRequirementById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 4}`);
  const params = [id, tenantId, updatedBy, ...keys.map(key => data[key])];

  const queryText = `
    UPDATE lead_requirements
    SET ${assignments.join(', ')}, updated_by = $3, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, params);
  return rows.length ? findRequirementById(id, tenantId, client) : null;
};

const deleteRequirement = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM lead_requirements
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

/**
 * Proposals Repository Operations
 */
const createProposal = async (tenantId, leadId, createdBy, data, client = db) => {
  const queryText = `
    INSERT INTO proposals (
      tenant_id, lead_id, created_by, proposal_number, proposal_version, 
      business_analysis, technical_analysis, risk_analysis, scope, 
      timeline, est_hours, quotation_amount, discount, final_cost, 
      currency, status, is_approved, contract_signed, advance_received, 
      advance_amount
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [
    tenantId, leadId, createdBy, data.proposal_number || null, data.proposal_version || 'v1.0',
    data.business_analysis || null, data.technical_analysis || null, data.risk_analysis || null,
    data.scope || null, data.timeline || null, data.est_hours || null, data.quotation_amount || null,
    data.discount !== undefined ? data.discount : 0, data.final_cost || null, data.currency || 'INR',
    data.status || 'Draft', data.is_approved || false, data.contract_signed || false,
    data.advance_received || false, data.advance_amount !== undefined ? data.advance_amount : 0
  ]);
  return rows[0];
};

const findProposalById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT p.*,
           u.first_name || ' ' || u.last_name as creator_name
    FROM proposals p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = $1 AND p.tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findProposalsByLeadId = async (leadId, tenantId, client = db) => {
  const queryText = `
    SELECT p.*,
           u.first_name || ' ' || u.last_name as creator_name
    FROM proposals p
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.lead_id = $1 AND p.tenant_id = $2
    ORDER BY p.proposal_version DESC, p.created_at DESC
  `;
  const { rows } = await client.query(queryText, [leadId, tenantId]);
  return rows;
};

const updateProposal = async (id, tenantId, updatedBy, data, client = db) => {
  const keys = Object.keys(data).filter(key => data[key] !== undefined);
  if (keys.length === 0) {
    return findProposalById(id, tenantId, client);
  }

  const assignments = keys.map((key, i) => `${key} = $${i + 4}`);
  const params = [id, tenantId, updatedBy, ...keys.map(key => data[key])];

  const queryText = `
    UPDATE proposals
    SET ${assignments.join(', ')}, updated_by = $3, updated_at = NOW()
    WHERE id = $1 AND tenant_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, params);
  return rows.length ? findProposalById(id, tenantId, client) : null;
};

const deleteProposal = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM proposals
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rowCount } = await client.query(queryText, [id, tenantId]);
  return rowCount > 0;
};

const deactivateOtherProposals = async (leadId, tenantId, activeProposalId, client = db) => {
  const queryText = `
    UPDATE proposals
    SET is_approved = false, updated_at = NOW()
    WHERE lead_id = $1 AND tenant_id = $2 AND id != $3
  `;
  await client.query(queryText, [leadId, tenantId, activeProposalId]);
};

module.exports = {
  checkEmailExists,
  checkBranchExists,
  checkTeamExists,
  create,
  findById,
  findTeamLeaderTeamId,
  findAll,
  update,
  softDelete,
  findJourneyByLeadId,
  findActiveJourneyStage,
  createJourneyStage,
  updateJourneyStage,
  createStatusHistory,
  createActivity,
  findStatusHistoryByLeadId,
  findActivitiesByLeadId,
  createNote,
  findNoteById,
  findNotesByLeadId,
  updateNote,
  deleteNote,
  createCommunication,
  findCommunicationById,
  findCommunicationsByLeadId,
  updateCommunication,
  deleteCommunication,
  createFollowup,
  findFollowupById,
  findFollowupsByLeadId,
  updateFollowup,
  deleteFollowup,
  findNextPendingFollowupDate,
  createRequirement,
  findRequirementById,
  findRequirementsByLeadId,
  updateRequirement,
  deleteRequirement,
  createProposal,
  findProposalById,
  findProposalsByLeadId,
  updateProposal,
  deleteProposal,
  deactivateOtherProposals
};
