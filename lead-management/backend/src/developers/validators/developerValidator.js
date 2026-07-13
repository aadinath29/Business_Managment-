const { z } = require('zod');

const uuidParamSchema = z.object({
  id: z.string({
    required_error: 'ID parameter is required'
  }).uuid('Invalid UUID format')
});

const createDeveloperSchema = z.object({
  firstName: z.string({
    required_error: 'First name is required'
  }).trim().min(1, 'First name cannot be empty'),
  
  lastName: z.string({
    required_error: 'Last name is required'
  }).trim().min(1, 'Last name cannot be empty'),
  
  email: z.string({
    required_error: 'Email is required'
  }).trim().email('Invalid email format'),
  
  password: z.string({
    required_error: 'Password is required'
  }).min(6, 'Password must be at least 6 characters long'),
  
  employeeId: z.string({
    required_error: 'Employee ID is required'
  }).trim().min(1, 'Employee ID cannot be empty'),
  
  teamId: z.string({
    required_error: 'Team ID is required'
  }).uuid('Invalid team ID format')
}).strict('Unknown fields are not allowed');

const updateDeveloperSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').optional(),
  employeeId: z.string().trim().min(1, 'Employee ID cannot be empty').optional(),
  teamId: z.string().uuid('Invalid team ID format').optional()
}).strict('Unknown fields are not allowed');

module.exports = {
  uuidParamSchema,
  createDeveloperSchema,
  updateDeveloperSchema
};
