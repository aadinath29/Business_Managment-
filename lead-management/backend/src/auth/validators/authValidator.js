const { z } = require('zod');

const loginSchema = z.object({
  email: z.string({
    required_error: 'Email is required'
  }).email('Invalid email address'),
  password: z.string({
    required_error: 'Password is required'
  }).min(6, 'Password must be at least 6 characters long')
});

const refreshSchema = z.object({
  // Since we accept refresh token in body (fallback) or cookie,
  // we validate it as a non-empty string.
  refreshToken: z.string({
    required_error: 'Refresh token is required'
  }).min(1, 'Refresh token cannot be empty')
});

module.exports = {
  loginSchema,
  refreshSchema
};
