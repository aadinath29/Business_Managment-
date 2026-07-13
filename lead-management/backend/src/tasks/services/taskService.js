const taskRepository = require('../repositories/taskRepository');
const leadRepository = require('../../leads/repositories/leadRepository');
const { ForbiddenError, ValidationError } = require('../../auth/errors/authErrors');
const { ROLES } = require('../../auth/constants/authConstants');
const { withTransaction } = require('../../database/transactions');
const logger = require('../../config/logger');

class TaskNotFoundError extends Error {
  constructor(message = 'Task not found') {
    super(message);
    this.name = 'TaskNotFoundError';
    this.status = 404;
  }
}

class LeadNotFoundError extends Error {
  constructor(message = 'Lead not found') {
    super(message);
    this.name = 'LeadNotFoundError';
    this.status = 404;
  }
}

/**
 * Validates lead access.
 */
const validateLeadAccess = async (leadId, tenantId, userRole, userId) => {
  const lead = await leadRepository.findById(leadId, tenantId);
  if (!lead) {
    throw new LeadNotFoundError();
  }
  return lead;
};

/**
 * Validates task access.
 */
const validateTaskAccess = async (taskId, tenantId, userRole, userId) => {
  const task = await taskRepository.findTaskById(taskId, tenantId);
  if (!task) {
    throw new TaskNotFoundError();
  }
  return task;
};

const getTasksByLead = async (leadId, tenantId, userRole, userId, filters) => {
  await validateLeadAccess(leadId, tenantId, userRole, userId);
  return taskRepository.findTasksByLeadId(leadId, tenantId, filters);
};

const getTaskById = async (taskId, tenantId, userRole, userId) => {
  const task = await validateTaskAccess(taskId, tenantId, userRole, userId);
  // Also fetch checklists, comments, attachments, labels, dependencies
  const [checklists, comments, attachments, labels, dependencies] = await Promise.all([
    taskRepository.findChecklistByTaskId(taskId, tenantId),
    taskRepository.findCommentsByTaskId(taskId, tenantId),
    taskRepository.findAttachmentsByTaskId(taskId, tenantId),
    taskRepository.findLabelsByTaskId(taskId, tenantId),
    taskRepository.findDependenciesByTaskId(taskId)
  ]);

  return {
    ...task,
    checklists,
    comments,
    attachments,
    labels,
    dependencies
  };
};

const createTask = async (leadId, tenantId, userId, userRole, data) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Developers cannot create tasks');
  }

  await validateLeadAccess(leadId, tenantId, userRole, userId);

  return withTransaction(async (client) => {
    const task = await taskRepository.createTask(tenantId, leadId, userId, data, client);
    
    // Log activity
    await leadRepository.createActivity(
      tenantId,
      leadId,
      'Task Created',
      'tasks',
      task.id,
      userId,
      { title: task.title, status: task.status },
      client
    );

    return task;
  });
};

const updateTask = async (taskId, tenantId, userRole, userId, data) => {
  const task = await validateTaskAccess(taskId, tenantId, userRole, userId);

  // If status is changed to 'Done', check dependencies
  if (data.status === 'Done' && task.status !== 'Done') {
    const incompleteDeps = await taskRepository.findIncompleteDependencies(taskId);
    if (incompleteDeps.length > 0) {
      throw new ValidationError('Cannot mark task as Done. Dependencies are not complete.', incompleteDeps);
    }
  }

  // Calculate progress based on checklists if status is set, or if progress_pct is not manually provided
  // But since we just update the task here, progress recalculation is done when checklist items are updated.
  
  return withTransaction(async (client) => {
    const updatedTask = await taskRepository.updateTask(taskId, tenantId, data, client);
    
    // Log activity
    await leadRepository.createActivity(
      tenantId,
      updatedTask.lead_id,
      'Task Updated',
      'tasks',
      updatedTask.id,
      userId,
      { previous_status: task.status, new_status: updatedTask.status, title: updatedTask.title },
      client
    );

    return updatedTask;
  });
};

const deleteTask = async (taskId, tenantId, userRole, userId) => {
  if (userRole === ROLES.DEVELOPER || userRole === ROLES.TEAM_LEADER) {
    throw new ForbiddenError('Only Administrators can delete tasks');
  }

  const task = await validateTaskAccess(taskId, tenantId, userRole, userId);

  return withTransaction(async (client) => {
    await taskRepository.deleteTask(taskId, tenantId, client);
    
    // Log activity
    await leadRepository.createActivity(
      tenantId,
      task.lead_id,
      'Task Deleted',
      'tasks',
      taskId,
      userId,
      { title: task.title },
      client
    );

    return true;
  });
};

// Checklist
const createChecklistItem = async (taskId, tenantId, userRole, userId, data) => {
  const task = await validateTaskAccess(taskId, tenantId, userRole, userId);
  return taskRepository.createChecklistItem(tenantId, taskId, data);
};

const updateChecklistItem = async (taskId, itemId, tenantId, userRole, userId, data) => {
  const task = await validateTaskAccess(taskId, tenantId, userRole, userId);
  const item = await taskRepository.findChecklistItemById(itemId, tenantId);
  if (!item || item.task_id !== taskId) {
    throw new ValidationError('Checklist item not found');
  }

  return withTransaction(async (client) => {
    const updatedItem = await taskRepository.updateChecklistItem(itemId, tenantId, data, client);
    
    // Auto recalculate progress
    const stats = await taskRepository.getChecklistStats(taskId, tenantId, client);
    if (stats.total_count > 0) {
      const pct = Math.round((stats.completed_count / stats.total_count) * 100);
      await taskRepository.updateTask(taskId, tenantId, { progress_pct: pct }, client);
    }
    
    return updatedItem;
  });
};

const deleteChecklistItem = async (taskId, itemId, tenantId, userRole, userId) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  const item = await taskRepository.findChecklistItemById(itemId, tenantId);
  if (!item || item.task_id !== taskId) {
    throw new ValidationError('Checklist item not found');
  }

  return withTransaction(async (client) => {
    await taskRepository.deleteChecklistItem(itemId, tenantId, client);
    // Auto recalculate progress
    const stats = await taskRepository.getChecklistStats(taskId, tenantId, client);
    if (stats.total_count > 0) {
      const pct = Math.round((stats.completed_count / stats.total_count) * 100);
      await taskRepository.updateTask(taskId, tenantId, { progress_pct: pct }, client);
    } else {
      await taskRepository.updateTask(taskId, tenantId, { progress_pct: 0 }, client);
    }
    return true;
  });
};

// Comments
const addComment = async (taskId, tenantId, userRole, userId, data) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  return taskRepository.createComment(tenantId, taskId, userId, data.comment);
};

const updateComment = async (taskId, commentId, tenantId, userRole, userId, data) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  const comment = await taskRepository.findCommentById(commentId, tenantId);
  if (!comment || comment.task_id !== taskId) {
    throw new ValidationError('Comment not found');
  }
  if (comment.author_id !== userId && userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('You can only edit your own comments');
  }
  return taskRepository.updateComment(commentId, tenantId, data.comment);
};

const deleteComment = async (taskId, commentId, tenantId, userRole, userId) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  const comment = await taskRepository.findCommentById(commentId, tenantId);
  if (!comment || comment.task_id !== taskId) {
    throw new ValidationError('Comment not found');
  }
  if (comment.author_id !== userId && userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('You can only delete your own comments');
  }
  return taskRepository.deleteComment(commentId, tenantId);
};

// Attachments
const addAttachment = async (taskId, tenantId, userRole, userId, data) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  return taskRepository.createAttachment(tenantId, taskId, userId, data);
};

const deleteAttachment = async (taskId, attachmentId, tenantId, userRole, userId) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  const attachment = await taskRepository.findAttachmentById(attachmentId, tenantId);
  if (!attachment || attachment.task_id !== taskId) {
    throw new ValidationError('Attachment not found');
  }
  if (attachment.uploaded_by_id !== userId && userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.ADMIN) {
    throw new ForbiddenError('You can only delete your own attachments');
  }
  return taskRepository.deleteAttachment(attachmentId, tenantId);
};

// Labels
const getLabels = async (tenantId) => {
  return taskRepository.findAllLabels(tenantId);
};

const createLabel = async (tenantId, userRole, data) => {
  if (userRole === ROLES.DEVELOPER) {
    throw new ForbiddenError('Developers cannot create labels');
  }
  return taskRepository.createLabel(tenantId, data.label_name, data.color_hex);
};

const assignLabel = async (taskId, tenantId, userRole, userId, data) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  const label = await taskRepository.findLabelById(data.label_id, tenantId);
  if (!label) throw new ValidationError('Label not found');
  return taskRepository.assignLabelToTask(taskId, data.label_id);
};

const removeLabel = async (taskId, labelId, tenantId, userRole, userId) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  return taskRepository.removeLabelFromTask(taskId, labelId);
};

// Dependencies
const addDependency = async (taskId, tenantId, userRole, userId, data) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  await validateTaskAccess(data.depends_on_task_id, tenantId, userRole, userId); // Ensure they can see the other task
  return taskRepository.addDependency(taskId, data.depends_on_task_id, data.dependency_type);
};

const removeDependency = async (taskId, dependsOnTaskId, tenantId, userRole, userId) => {
  await validateTaskAccess(taskId, tenantId, userRole, userId);
  return taskRepository.removeDependency(taskId, dependsOnTaskId);
};

module.exports = {
  getTasksByLead,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,

  addComment,
  updateComment,
  deleteComment,

  addAttachment,
  deleteAttachment,

  getLabels,
  createLabel,
  assignLabel,
  removeLabel,

  addDependency,
  removeDependency
};
