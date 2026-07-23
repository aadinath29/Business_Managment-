const { z } = require('zod');

const createBranchSchema = z.object({
  branch_name: z.string({
    required_error: 'Branch name is required'
  }).trim().min(1, 'Branch name cannot be empty'),
  
  branch_code: z.string({
    required_error: 'Branch code is required'
  }).trim().min(1, 'Branch code cannot be empty'),
  
  company_name: z.string().trim().optional(),
  company_location: z.string().trim().optional(),
  country: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().max(20, 'Phone cannot exceed 20 characters').optional(),
  
  email: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),

  // Business targets (INR)
  assigned_target: z.number().nonnegative('Assigned target must be greater than or equal to 0').optional().default(0),
  achieved_target: z.number().nonnegative('Achieved target must be greater than or equal to 0').optional().default(0),

  status: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  pincode: z.string().trim().nullable().optional(),
  working_days: z.string().trim().nullable().optional(),
  timezone: z.string().trim().nullable().optional(),
  gst_number: z.string().trim().nullable().optional(),
  pan_number: z.string().trim().nullable().optional(),

  // Operational metrics (leads/projects/employees) are system-derived — never accepted from clients.
  manager_id: z.string().uuid('Invalid manager user ID format').nullable().optional(),
  manager_name: z.string().trim().min(1, 'Manager name cannot be empty').nullable().optional(),
  manager_email: z.string().trim().email('Invalid email address').or(z.literal('')).nullable().optional(),
  manager_password: z.string().min(6, 'Password must be at least 6 characters long').or(z.literal('')).nullable().optional()
}).strict('Unknown fields are not allowed');

const updateBranchSchema = z.object({
  branch_name: z.string().trim().min(1, 'Branch name cannot be empty').optional(),
  branch_code: z.string().trim().min(1, 'Branch code cannot be empty').optional(),
  company_name: z.string().trim().optional(),
  company_location: z.string().trim().optional(),
  country: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().max(20, 'Phone cannot exceed 20 characters').optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).optional(),
  assigned_target: z.number().nonnegative('Assigned target must be greater than or equal to 0').optional(),
  achieved_target: z.number().nonnegative('Achieved target must be greater than or equal to 0').optional(),
  status: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  pincode: z.string().trim().nullable().optional(),
  working_days: z.string().trim().nullable().optional(),
  timezone: z.string().trim().nullable().optional(),
  gst_number: z.string().trim().nullable().optional(),
  pan_number: z.string().trim().nullable().optional(),
  manager_id: z.string().uuid('Invalid manager user ID format').nullable().optional()
}).strict('Unknown fields are not allowed');

const listBranchesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  sortBy: z.enum(['created_at', 'branch_name', 'branch_code', 'city', 'state', 'health_score', 'assigned_target'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform(val => val ? val.toUpperCase() : 'DESC')
});

const branchIdParamSchema = z.object({
  id: z.string({
    required_error: 'Branch ID parameter is required'
  }).uuid('Invalid Branch ID format')
});

const updateQuarterlyTargetsSchema = z.object({
  financial_year: z.string({
    required_error: 'Financial year is required'
  }).trim().min(1, 'Financial year cannot be empty'),
  q1_target: z.number().nonnegative('Q1 target must be greater than or equal to 0').optional().default(0),
  q2_target: z.number().nonnegative('Q2 target must be greater than or equal to 0').optional().default(0),
  q3_target: z.number().nonnegative('Q3 target must be greater than or equal to 0').optional().default(0),
  q4_target: z.number().nonnegative('Q4 target must be greater than or equal to 0').optional().default(0),
  q1_achieved: z.number().nonnegative('Q1 achieved must be greater than or equal to 0').nullable().optional(),
  q2_achieved: z.number().nonnegative('Q2 achieved must be greater than or equal to 0').nullable().optional(),
  q3_achieved: z.number().nonnegative('Q3 achieved must be greater than or equal to 0').nullable().optional(),
  q4_achieved: z.number().nonnegative('Q4 achieved must be greater than or equal to 0').nullable().optional(),
}).strict('Unknown fields are not allowed');

module.exports = {
  createBranchSchema,
  updateBranchSchema,
  listBranchesQuerySchema,
  branchIdParamSchema,
  updateQuarterlyTargetsSchema
};
