const { z } = require('zod');

const uuidParamSchema = z.object({
  id: z.string({
    required_error: 'ID parameter is required'
  }).uuid('Invalid UUID format')
});

const teamLeaderParamSchema = z.object({
  teamLeaderId: z.string({
    required_error: 'Team Leader ID parameter is required'
  }).uuid('Invalid UUID format')
});

const createTeamSchema = z.object({
  team_name: z.string({
    required_error: 'Team name is required'
  }).trim().min(1, 'Team name cannot be empty'),
  
  branch_id: z.string({
    required_error: 'Branch ID is required'
  }).uuid('Invalid branch ID format'),
  
  department: z.string().trim().optional(),
  
  // Optional leader provisioning fields
  leader_name: z.string().trim().min(1, 'Leader name cannot be empty').optional(),
  leader_email: z.string().trim().email('Invalid email format').optional(),
  leader_password: z.string().min(6, 'Password must be at least 6 characters long').optional(),
  employee_id: z.string().trim().optional(),
  designation: z.string().trim().optional()
}).strict('Unknown fields are not allowed');

const updateTeamSchema = z.object({
  team_name: z.string().trim().min(1, 'Team name cannot be empty').optional(),
  branch_id: z.string().uuid('Invalid branch ID format').optional(),
  department: z.string().trim().optional()
}).strict('Unknown fields are not allowed');

const createLeaderSchema = z.object({
  team_id: z.string({
    required_error: 'Team ID is required'
  }).uuid('Invalid team ID format'),
  
  name: z.string({
    required_error: 'Leader name is required'
  }).trim().min(1, 'Leader name cannot be empty'),
  
  email: z.string({
    required_error: 'Email is required'
  }).trim().email('Invalid email format'),
  
  password: z.string({
    required_error: 'Password is required'
  }).min(6, 'Password must be at least 6 characters long'),
  
  employee_id: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  performance_score: z.number().int().min(0).max(100).optional().default(90)
}).strict('Unknown fields are not allowed');

const updateLeaderSchema = z.object({
  designation: z.string().trim().optional(),
  employee_id: z.string().trim().optional(),
  performance_score: z.number().int().min(0).max(100).optional()
}).strict('Unknown fields are not allowed');

const assignDevelopersSchema = z.object({
  developer_ids: z.array(z.string().uuid('Invalid developer ID format'), {
    required_error: 'Developer IDs must be an array of UUIDs'
  }).min(1, 'At least one developer ID is required')
}).strict('Unknown fields are not allowed');

module.exports = {
  uuidParamSchema,
  teamLeaderParamSchema,
  createTeamSchema,
  updateTeamSchema,
  createLeaderSchema,
  updateLeaderSchema,
  assignDevelopersSchema
};
