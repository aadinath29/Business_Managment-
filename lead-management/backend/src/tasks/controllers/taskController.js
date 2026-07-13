const taskService = require('../services/taskService');
const validators = require('../validators/taskValidator');
const { ValidationError } = require('../../auth/errors/authErrors');

// Helper for sending success response
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const getTasksByLead = async (req, res, next) => {
  try {
    const { leadId } = validators.leadIdParamSchema.parse(req.params);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;
    const filters = req.query; // Could add validation for filters if needed

    const tasks = await taskService.getTasksByLead(leadId, tenantId, userRole, userId, filters);
    sendSuccess(res, tasks, 'Tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const task = await taskService.getTaskById(taskId, tenantId, userRole, userId);
    sendSuccess(res, task, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { leadId } = validators.leadIdParamSchema.parse(req.params);
    const validatedData = validators.createTaskSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const task = await taskService.createTask(leadId, tenantId, userId, userRole, validatedData);
    sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.updateTaskSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const task = await taskService.updateTask(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.deleteTask(taskId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Checklist
const createChecklistItem = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.createChecklistItemSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const item = await taskService.createChecklistItem(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, item, 'Checklist item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateChecklistItem = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const itemId = req.params.itemId;
    const validatedData = validators.updateChecklistItemSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const item = await taskService.updateChecklistItem(taskId, itemId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, item, 'Checklist item updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteChecklistItem = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const itemId = req.params.itemId;
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.deleteChecklistItem(taskId, itemId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Checklist item deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Comments
const addComment = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.createCommentSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const comment = await taskService.addComment(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, comment, 'Comment added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const commentId = req.params.commentId;
    const validatedData = validators.updateCommentSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const comment = await taskService.updateComment(taskId, commentId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, comment, 'Comment updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const commentId = req.params.commentId;
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.deleteComment(taskId, commentId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Comment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Attachments
const addAttachment = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.createAttachmentSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const attachment = await taskService.addAttachment(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, attachment, 'Attachment added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const attachmentId = req.params.attachmentId;
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.deleteAttachment(taskId, attachmentId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Attachment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Labels
const getLabels = async (req, res, next) => {
  try {
    const { tenant_id: tenantId } = req.user;
    const labels = await taskService.getLabels(tenantId);
    sendSuccess(res, labels, 'Labels retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createLabel = async (req, res, next) => {
  try {
    const { tenant_id: tenantId, role: userRole } = req.user;
    const validatedData = validators.createLabelSchema.parse(req.body);
    
    const label = await taskService.createLabel(tenantId, userRole, validatedData);
    sendSuccess(res, label, 'Label created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const assignLabel = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.assignLabelSchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const label = await taskService.assignLabel(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, label, 'Label assigned successfully', 201);
  } catch (error) {
    next(error);
  }
};

const removeLabel = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const labelId = req.params.labelId;
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.removeLabel(taskId, labelId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Label removed successfully');
  } catch (error) {
    next(error);
  }
};

// Dependencies
const addDependency = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const validatedData = validators.addDependencySchema.parse(req.body);
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    const dep = await taskService.addDependency(taskId, tenantId, userRole, userId, validatedData);
    sendSuccess(res, dep, 'Dependency added successfully', 201);
  } catch (error) {
    next(error);
  }
};

const removeDependency = async (req, res, next) => {
  try {
    const { taskId } = validators.taskIdParamSchema.parse(req.params);
    const dependsOnTaskId = req.params.dependsOnTaskId;
    const { tenant_id: tenantId, user_id: userId, role: userRole } = req.user;

    await taskService.removeDependency(taskId, dependsOnTaskId, tenantId, userRole, userId);
    sendSuccess(res, null, 'Dependency removed successfully');
  } catch (error) {
    next(error);
  }
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
