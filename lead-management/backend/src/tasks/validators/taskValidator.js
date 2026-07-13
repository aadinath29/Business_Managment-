const { z } = require('zod');

const priorityEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);
const statusEnum = z.enum(['Open', 'Pending', 'In Progress', 'Done', 'Cancelled']);

const uuidSchema = z.string().uuid('Invalid UUID format');

const taskIdParamSchema = z.object({
  taskId: uuidSchema
});

const leadIdParamSchema = z.object({
  leadId: uuidSchema
});

const createTaskSchema = z.object({
  title: z.string({
    required_error: 'Task title is required'
  }).trim().min(1, 'Task title cannot be empty'),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  priority: priorityEnum.default('Medium'),
  assigned_to_id: uuidSchema.optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().nullable(),
  est_hours: z.number().nonnegative('Estimated hours must be positive').optional().nullable()
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title cannot be empty').optional(),
  description: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  assigned_to_id: uuidSchema.optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional().nullable(),
  est_hours: z.number().nonnegative('Estimated hours must be positive').optional().nullable(),
  hours_worked: z.number().nonnegative('Hours worked must be positive').optional().nullable(),
  progress_pct: z.number().int().min(0).max(100).optional(),
  blocker_reason: z.string().trim().optional().nullable()
});

const createChecklistItemSchema = z.object({
  item_text: z.string({
    required_error: 'Item text is required'
  }).trim().min(1, 'Item text cannot be empty')
});

const updateChecklistItemSchema = z.object({
  item_text: z.string().trim().min(1, 'Item text cannot be empty').optional(),
  is_completed: z.boolean().optional()
});

const createCommentSchema = z.object({
  comment: z.string({
    required_error: 'Comment text is required'
  }).trim().min(1, 'Comment text cannot be empty')
});

const updateCommentSchema = z.object({
  comment: z.string().trim().min(1, 'Comment text cannot be empty')
});

const createAttachmentSchema = z.object({
  file_name: z.string({
    required_error: 'File name is required'
  }).trim().min(1, 'File name cannot be empty'),
  file_url: z.string({
    required_error: 'File URL is required'
  }).trim().url('Invalid file URL format'),
  file_size_bytes: z.number().int().nonnegative('File size must be positive').optional().nullable(),
  mime_type: z.string().trim().optional().nullable()
});

const createLabelSchema = z.object({
  label_name: z.string({
    required_error: 'Label name is required'
  }).trim().min(1, 'Label name cannot be empty'),
  color_hex: z.string().trim().regex(/^#[0-9a-fA-F]{3,6}$/, 'Invalid HEX color format').optional().nullable()
});

const assignLabelSchema = z.object({
  label_id: uuidSchema
});

const addDependencySchema = z.object({
  depends_on_task_id: uuidSchema,
  dependency_type: z.string().trim().default('finish-to-start')
});

module.exports = {
  taskIdParamSchema,
  leadIdParamSchema,
  createTaskSchema,
  updateTaskSchema,
  createChecklistItemSchema,
  updateChecklistItemSchema,
  createCommentSchema,
  updateCommentSchema,
  createAttachmentSchema,
  createLabelSchema,
  assignLabelSchema,
  addDependencySchema
};
