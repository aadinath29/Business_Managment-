const db = require('../../database');
const scopeHelper = require('../../utils/scopeHelper');

// === Task Operations ===

const createTask = async (tenantId, leadId, assignedById, data, client = db) => {
  const queryText = `
    INSERT INTO tasks (
      tenant_id, lead_id, assigned_by_id, assigned_to_id,
      title, description, category, priority, status,
      due_date, est_hours, hours_worked, progress_pct
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, 0)
    RETURNING *
  `;
  const values = [
    tenantId,
    leadId,
    assignedById,
    data.assigned_to_id || null,
    data.title,
    data.description || null,
    data.category || null,
    data.priority || 'Medium',
    'Open',
    data.due_date || null,
    data.est_hours || null
  ];
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const findTaskById = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    SELECT t.*,
           u_by.first_name || ' ' || u_by.last_name as assigned_by_name,
           u_to.first_name || ' ' || u_to.last_name as assigned_to_name,
           l.name as lead_name
    FROM tasks t
    LEFT JOIN users u_by ON t.assigned_by_id = u_by.id
    LEFT JOIN developers d ON t.assigned_to_id = d.id
    LEFT JOIN users u_to ON d.user_id = u_to.id
    JOIN leads l ON t.lead_id = l.id
    WHERE t.id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL AND l.deleted_at IS NULL
  `;
  queryText += scopeHelper.getScopeCondition(params, '', { branchColumn: 'l.branch_id', teamColumn: 'l.team_id', developerColumn: 'd.user_id' });
  const { rows } = await client.query(queryText, params);
  return rows.length ? rows[0] : null;
};

const findTasksByLeadId = async (leadId, tenantId, filters = {}, client = db) => {
  const values = [leadId, tenantId];
  let queryText = `
    SELECT t.*,
           u_by.first_name || ' ' || u_by.last_name as assigned_by_name,
           u_to.first_name || ' ' || u_to.last_name as assigned_to_name
    FROM tasks t
    LEFT JOIN users u_by ON t.assigned_by_id = u_by.id
    LEFT JOIN developers d ON t.assigned_to_id = d.id
    LEFT JOIN users u_to ON d.user_id = u_to.id
    JOIN leads l ON t.lead_id = l.id
    WHERE t.lead_id = $1 AND t.tenant_id = $2 AND t.deleted_at IS NULL
  `;
  let index = 3;

  if (filters.status) {
    queryText += ` AND t.status = $${index}`;
    values.push(filters.status);
    index++;
  }
  if (filters.priority) {
    queryText += ` AND t.priority = $${index}`;
    values.push(filters.priority);
    index++;
  }
  if (filters.developer_id) {
    queryText += ` AND t.assigned_to_id = $${index}`;
    values.push(filters.developer_id);
    index++;
  }
  if (filters.category) {
    queryText += ` AND t.category = $${index}`;
    values.push(filters.category);
    index++;
  }
  if (filters.search) {
    queryText += ` AND (t.title ILIKE $${index} OR t.description ILIKE $${index})`;
    values.push(`%${filters.search}%`);
    index++;
  }

  // Sorting
  const sortBy = filters.sort_by || 'created_at';
  const sortOrder = filters.sort_order || 'DESC';
  
  queryText += scopeHelper.getScopeCondition(values, '', { branchColumn: 'l.branch_id', teamColumn: 'l.team_id', developerColumn: 'd.user_id' });
  
  queryText += ` ORDER BY t.${sortBy} ${sortOrder}`;

  const { rows } = await client.query(queryText, values);
  return rows;
};

const updateTask = async (id, tenantId, data, client = db) => {
  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(data).forEach(([key, val]) => {
    fields.push(`${key} = $${index}`);
    values.push(val);
    index++;
  });

  values.push(id, tenantId);
  let queryText = `
    UPDATE tasks
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index} AND tenant_id = $${index + 1} AND deleted_at IS NULL
  `;
  
  const scopeStr = scopeHelper.getScopeCondition(values, '', { branchColumn: 'l.branch_id', teamColumn: 'l.team_id', developerColumn: 'd.user_id' });
  if (scopeStr && scopeStr !== ' AND 1=0 ' && scopeStr !== '') {
    queryText += ` AND id IN (
      SELECT t.id FROM tasks t
      JOIN leads l ON t.lead_id = l.id
      LEFT JOIN developers d ON t.assigned_to_id = d.id
      WHERE t.tenant_id = $${index + 1} ${scopeStr}
    )`;
  } else if (scopeStr === ' AND 1=0 ') {
    queryText += scopeStr;
  }
  
  queryText += ' RETURNING *';
  
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const deleteTask = async (id, tenantId, client = db) => {
  const params = [id, tenantId];
  let queryText = `
    UPDATE tasks
    SET deleted_at = NOW()
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  
  const scopeStr = scopeHelper.getScopeCondition(params, '', { branchColumn: 'l.branch_id', teamColumn: 'l.team_id', developerColumn: 'd.user_id' });
  if (scopeStr && scopeStr !== ' AND 1=0 ' && scopeStr !== '') {
    queryText += ` AND id IN (
      SELECT t.id FROM tasks t
      JOIN leads l ON t.lead_id = l.id
      LEFT JOIN developers d ON t.assigned_to_id = d.id
      WHERE t.tenant_id = $2 ${scopeStr}
    )`;
  } else if (scopeStr === ' AND 1=0 ') {
    queryText += scopeStr;
  }
  
  queryText += ' RETURNING id';
  
  const { rows } = await client.query(queryText, params);
  return rows.length > 0;
};

// === Helper Checks ===

const findDeveloperById = async (id, tenantId) => {
  const queryText = `
    SELECT d.*, u.first_name || ' ' || u.last_name as name, u.tenant_id as user_tenant_id
    FROM developers d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = $1 AND d.tenant_id = $2 AND u.deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findLeadById = async (id, tenantId) => {
  const queryText = `
    SELECT * FROM leads
    WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
  `;
  const { rows } = await db.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

// === Checklist Items Operations ===

const createChecklistItem = async (tenantId, taskId, data, client = db) => {
  const queryText = `
    INSERT INTO task_checklists (tenant_id, task_id, item_text, is_completed)
    VALUES ($1, $2, $3, false)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, taskId, data.item_text]);
  return rows[0];
};

const findChecklistItemById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_checklists
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const updateChecklistItem = async (id, tenantId, data, client = db) => {
  const fields = [];
  const values = [];
  let index = 1;

  Object.entries(data).forEach(([key, val]) => {
    fields.push(`${key} = $${index}`);
    values.push(val);
    index++;
  });

  values.push(id, tenantId);
  const queryText = `
    UPDATE task_checklists
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${index} AND tenant_id = $${index + 1}
    RETURNING *
  `;
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const deleteChecklistItem = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM task_checklists
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

const findChecklistByTaskId = async (taskId, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_checklists
    WHERE task_id = $1 AND tenant_id = $2
    ORDER BY created_at ASC
  `;
  const { rows } = await client.query(queryText, [taskId, tenantId]);
  return rows;
};

const getChecklistStats = async (taskId, tenantId, client = db) => {
  const queryText = `
    SELECT 
      COUNT(*)::integer as total_count,
      SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END)::integer as completed_count
    FROM task_checklists
    WHERE task_id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [taskId, tenantId]);
  return rows[0] || { total_count: 0, completed_count: 0 };
};

// === Comments Operations ===

const createComment = async (tenantId, taskId, authorId, comment, client = db) => {
  const queryText = `
    INSERT INTO task_comments (tenant_id, task_id, author_id, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, taskId, authorId, comment]);
  return rows[0];
};

const findCommentById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_comments
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const updateComment = async (id, tenantId, comment, client = db) => {
  const queryText = `
    UPDATE task_comments
    SET comment = $1
    WHERE id = $2 AND tenant_id = $3
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [comment, id, tenantId]);
  return rows[0];
};

const deleteComment = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM task_comments
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

const findCommentsByTaskId = async (taskId, tenantId, client = db) => {
  const queryText = `
    SELECT tc.*, u.first_name || ' ' || u.last_name as author_name
    FROM task_comments tc
    JOIN users u ON tc.author_id = u.id
    WHERE tc.task_id = $1 AND tc.tenant_id = $2
    ORDER BY tc.created_at ASC
  `;
  const { rows } = await client.query(queryText, [taskId, tenantId]);
  return rows;
};

// === Attachments Operations ===

const createAttachment = async (tenantId, taskId, uploadedById, data, client = db) => {
  const queryText = `
    INSERT INTO task_attachments (
      tenant_id, task_id, uploaded_by_id, file_name, file_url, file_size_bytes, mime_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    tenantId,
    taskId,
    uploadedById,
    data.file_name,
    data.file_url,
    data.file_size_bytes || null,
    data.mime_type || null
  ];
  const { rows } = await client.query(queryText, values);
  return rows[0];
};

const findAttachmentById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_attachments
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const deleteAttachment = async (id, tenantId, client = db) => {
  const queryText = `
    DELETE FROM task_attachments
    WHERE id = $1 AND tenant_id = $2
    RETURNING id
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length > 0;
};

const findAttachmentsByTaskId = async (taskId, tenantId, client = db) => {
  const queryText = `
    SELECT ta.*, u.first_name || ' ' || u.last_name as uploader_name
    FROM task_attachments ta
    JOIN users u ON ta.uploaded_by_id = u.id
    WHERE ta.task_id = $1 AND ta.tenant_id = $2
    ORDER BY ta.created_at ASC
  `;
  const { rows } = await client.query(queryText, [taskId, tenantId]);
  return rows;
};

// === Labels Operations ===

const createLabel = async (tenantId, labelName, colorHex, client = db) => {
  const queryText = `
    INSERT INTO task_labels (tenant_id, label_name, color_hex)
    VALUES ($1, $2, $3)
    ON CONFLICT (tenant_id, label_name) DO UPDATE SET color_hex = EXCLUDED.color_hex
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [tenantId, labelName, colorHex || '#4B5563']);
  return rows[0];
};

const findLabelById = async (id, tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_labels
    WHERE id = $1 AND tenant_id = $2
  `;
  const { rows } = await client.query(queryText, [id, tenantId]);
  return rows.length ? rows[0] : null;
};

const findAllLabels = async (tenantId, client = db) => {
  const queryText = `
    SELECT * FROM task_labels
    WHERE tenant_id = $1
    ORDER BY label_name ASC
  `;
  const { rows } = await client.query(queryText, [tenantId]);
  return rows;
};

const assignLabelToTask = async (taskId, labelId, client = db) => {
  const queryText = `
    INSERT INTO task_label_mapping (task_id, label_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [taskId, labelId]);
  return rows[0];
};

const removeLabelFromTask = async (taskId, labelId, client = db) => {
  const queryText = `
    DELETE FROM task_label_mapping
    WHERE task_id = $1 AND label_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [taskId, labelId]);
  return rows.length > 0;
};

const findLabelsByTaskId = async (taskId, tenantId, client = db) => {
  const queryText = `
    SELECT tl.*
    FROM task_labels tl
    JOIN task_label_mapping tlm ON tl.id = tlm.label_id
    WHERE tlm.task_id = $1 AND tl.tenant_id = $2
    ORDER BY tl.label_name ASC
  `;
  const { rows } = await client.query(queryText, [taskId, tenantId]);
  return rows;
};

// === Dependencies Operations ===

const addDependency = async (taskId, dependsOnTaskId, dependencyType = 'finish-to-start', client = db) => {
  const queryText = `
    INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [taskId, dependsOnTaskId, dependencyType]);
  return rows[0];
};

const removeDependency = async (taskId, dependsOnTaskId, client = db) => {
  const queryText = `
    DELETE FROM task_dependencies
    WHERE task_id = $1 AND depends_on_task_id = $2
    RETURNING *
  `;
  const { rows } = await client.query(queryText, [taskId, dependsOnTaskId]);
  return rows.length > 0;
};

const findDependenciesByTaskId = async (taskId, client = db) => {
  const queryText = `
    SELECT td.*, t.title as depends_on_title, t.status as depends_on_status
    FROM task_dependencies td
    JOIN tasks t ON td.depends_on_task_id = t.id
    WHERE td.task_id = $1 AND t.deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [taskId]);
  return rows;
};

const findIncompleteDependencies = async (taskId, client = db) => {
  const queryText = `
    SELECT td.*, t.title
    FROM task_dependencies td
    JOIN tasks t ON td.depends_on_task_id = t.id
    WHERE td.task_id = $1 AND t.status != 'Done' AND t.deleted_at IS NULL
  `;
  const { rows } = await client.query(queryText, [taskId]);
  return rows;
};

module.exports = {
  createTask,
  findTaskById,
  findTasksByLeadId,
  updateTask,
  deleteTask,
  findDeveloperById,
  findLeadById,
  
  createChecklistItem,
  findChecklistItemById,
  updateChecklistItem,
  deleteChecklistItem,
  findChecklistByTaskId,
  getChecklistStats,

  createComment,
  findCommentById,
  updateComment,
  deleteComment,
  findCommentsByTaskId,

  createAttachment,
  findAttachmentById,
  deleteAttachment,
  findAttachmentsByTaskId,

  createLabel,
  findLabelById,
  findAllLabels,
  assignLabelToTask,
  removeLabelFromTask,
  findLabelsByTaskId,

  addDependency,
  removeDependency,
  findDependenciesByTaskId,
  findIncompleteDependencies
};
