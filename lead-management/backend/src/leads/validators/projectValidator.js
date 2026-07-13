const { z } = require('zod');

const assignLeadSchema = z.object({
  assigned_team_id: z.string().uuid('Invalid Team ID format').nullable().optional(),
  assigned_to_user_id: z.string().uuid('Invalid Assigned To User ID format').nullable().optional(),
  reason: z.string().trim().optional().nullable(),
  assignment_type: z.enum(['Team', 'Team Leader', 'Developer'], {
    required_error: 'assignment_type is required and must be one of: Team, Team Leader, Developer'
  })
}).strict('Unknown fields are not allowed');

const reassignLeadSchema = assignLeadSchema;

const createProjectSchema = z.object({
  project_name: z.string().trim().min(1, 'Project name cannot be empty').optional().nullable(),
  technology: z.string().trim().optional().nullable(),
  start_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid start date format').optional().nullable(),
  deadline: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid deadline format').optional().nullable(),
  total_cost: z.number().nonnegative('Total cost must be greater than or equal to 0').optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
  risk_level: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
  current_sprint: z.string().trim().max(50).optional().nullable(),
  expected_hours: z.number().int().nonnegative('Expected hours must be >= 0').optional().nullable()
}).strict('Unknown fields are not allowed');

const updateProjectSchema = z.object({
  project_name: z.string().trim().min(1, 'Project name cannot be empty').optional(),
  technology: z.string().trim().optional().nullable(),
  status: z.enum(['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional(),
  progress_pct: z.number().int().min(0).max(100, 'Progress must be between 0 and 100').optional(),
  total_cost: z.number().nonnegative('Total cost must be >= 0').optional(),
  start_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid start date format').optional().nullable(),
  deadline: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid deadline format').optional().nullable(),
  remarks: z.string().trim().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
  risk_level: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
  current_sprint: z.string().trim().max(50).optional().nullable(),
  expected_hours: z.number().int().nonnegative('Expected hours must be >= 0').optional().nullable()
}).strict('Unknown fields are not allowed');

const updateProgressSchema = z.object({
  progress_pct: z.number({
    required_error: 'progress_pct is required'
  }).int().min(0).max(100, 'Progress must be between 0 and 100'),
  status: z.enum(['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional(),
  remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const listProjectsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  team: z.string().trim().optional(),
  developer: z.string().trim().optional(),
  technology: z.string().trim().optional(),
  branch: z.string().trim().optional(),
  lead: z.string().trim().optional(),
  startDate: z.string().trim().optional(), // format: YYYY-MM-DD
  endDate: z.string().trim().optional(),   // format: YYYY-MM-DD
  sortBy: z.enum(['created_at', 'project_name', 'progress_pct', 'status', 'start_date', 'deadline'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform(val => val ? val.toUpperCase() : 'DESC')
});

module.exports = {
  assignLeadSchema,
  reassignLeadSchema,
  createProjectSchema,
  updateProjectSchema,
  updateProgressSchema,
  listProjectsQuerySchema
};
