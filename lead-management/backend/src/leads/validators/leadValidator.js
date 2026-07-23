const { z } = require('zod');
const { LEAD_STATUS, PRIORITY_LEVEL, JOURNEY_STAGE } = require('../constants/leadConstants');

const statusEnum = z.enum([
  LEAD_STATUS.NEW,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.QUALIFIED,
  LEAD_STATUS.NEGOTIATION,
  LEAD_STATUS.CLOSED_WON,
  LEAD_STATUS.CLOSED_LOST
]);

const priorityEnum = z.enum([
  PRIORITY_LEVEL.LOW,
  PRIORITY_LEVEL.MEDIUM,
  PRIORITY_LEVEL.HIGH,
  PRIORITY_LEVEL.CRITICAL
]);

// Date validation helper for future/today dates
const isFutureOrToday = (val) => {
  if (!val) return true;
  const d = new Date(val);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
};

const createLeadSchema = z.object({
  name: z.string({
    required_error: 'Lead name is required'
  }).trim().min(1, 'Lead name cannot be empty'),

  branch_id: z.string({
    required_error: 'Branch ID is required'
  }).uuid('Invalid Branch ID format'),

  team_id: z.string().uuid('Invalid Team ID format').nullable().optional(),
  assigned_sales_user_id: z.string().uuid('Invalid Assigned Sales User ID format').nullable().optional(),
  
  company_name: z.string().trim().nullable().optional(),
  contact_person: z.string().trim().nullable().optional(),
  mobile: z.string().trim().nullable().optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).nullable().optional(),
  industry: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  country: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  lead_source: z.string().trim().nullable().optional(),
  campaign: z.string().trim().nullable().optional(),
  referral_name: z.string().trim().nullable().optional(),
  advertisement: z.string().trim().nullable().optional(),
  social_media: z.string().trim().nullable().optional(),
  website_inquiry: z.boolean().optional().default(false),
  
  budget: z.number().nonnegative('Budget must be greater than or equal to 0').nullable().optional(),
  decision_maker: z.string().trim().nullable().optional(),
  
  expected_start_date: z.string()
    .refine(isFutureOrToday, 'Expected start date must be today or in the future')
    .nullable()
    .optional(),
    
  business_need: z.string().trim().nullable().optional(),
  project_type: z.string().trim().nullable().optional(),
  
  lead_score: z.number().int().min(0).max(100).nullable().optional(),
  priority: priorityEnum.optional().default(PRIORITY_LEVEL.MEDIUM),
  expected_revenue: z.number().nonnegative('Expected revenue must be greater than or equal to 0').nullable().optional(),
  status: statusEnum.optional().default(LEAD_STATUS.NEW),
  
  next_follow_up_date: z.string()
    .refine(isFutureOrToday, 'Next follow up date must be today or in the future')
    .nullable()
    .optional(),
    
  reminder_notes: z.string().trim().nullable().optional()
}).strict('Unknown fields are not allowed');

const updateLeadSchema = z.object({
  name: z.string().trim().min(1, 'Lead name cannot be empty').optional(),
  branch_id: z.string().uuid('Invalid Branch ID format').optional(),
  team_id: z.string().uuid('Invalid Team ID format').nullable().optional(),
  assigned_sales_user_id: z.string().uuid('Invalid Assigned Sales User ID format').nullable().optional(),
  company_name: z.string().trim().nullable().optional(),
  contact_person: z.string().trim().nullable().optional(),
  mobile: z.string().trim().nullable().optional(),
  email: z.string().trim().email('Invalid email address').or(z.literal('')).nullable().optional(),
  industry: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  country: z.string().trim().nullable().optional(),
  city: z.string().trim().nullable().optional(),
  lead_source: z.string().trim().nullable().optional(),
  campaign: z.string().trim().nullable().optional(),
  referral_name: z.string().trim().nullable().optional(),
  advertisement: z.string().trim().nullable().optional(),
  social_media: z.string().trim().nullable().optional(),
  website_inquiry: z.boolean().optional(),
  budget: z.number().nonnegative('Budget must be greater than or equal to 0').nullable().optional(),
  decision_maker: z.string().trim().nullable().optional(),
  expected_start_date: z.string()
    .nullable()
    .optional(),
  business_need: z.string().trim().nullable().optional(),
  project_type: z.string().trim().nullable().optional(),
  lead_score: z.number().int().min(0).max(100).nullable().optional(),
  priority: priorityEnum.nullable().optional(),
  expected_revenue: z.number().nonnegative('Expected revenue must be greater than or equal to 0').nullable().optional(),
  status: statusEnum.nullable().optional(),
  next_follow_up_date: z.string()
    .nullable()
    .optional(),
  reminder_notes: z.string().trim().nullable().optional()
}).strict('Unknown fields are not allowed');

const listLeadsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: z.string().trim().optional(),
  branch: z.string().trim().optional(), // corresponds to branch_id filter
  team: z.string().trim().optional(),   // corresponds to team_id filter
  city: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  lead_source: z.string().trim().optional(),
  created_at: z.string().trim().optional(), // format: YYYY-MM-DD
  sortBy: z.enum(['created_at', 'name', 'company_name', 'lead_score', 'priority', 'status', 'expected_revenue'])
    .optional()
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform(val => val ? val.toUpperCase() : 'DESC')
});

const leadIdParamSchema = z.object({
  id: z.string({
    required_error: 'Lead ID parameter is required'
  }).uuid('Invalid Lead ID format')
});

const updateJourneySchema = z.object({
  stage: z.enum([
    JOURNEY_STAGE.DISCOVERY,
    JOURNEY_STAGE.QUALIFICATION,
    JOURNEY_STAGE.SOLUTION,
    JOURNEY_STAGE.PROPOSAL,
    JOURNEY_STAGE.NEGOTIATION,
    JOURNEY_STAGE.EXECUTION,
    JOURNEY_STAGE.DELIVERY,
    JOURNEY_STAGE.CUSTOMER_SUCCESS
  ], {
    required_error: 'Journey stage is required'
  }),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional().default('In Progress'),
  remarks: z.string().trim().max(1000, 'Remarks cannot exceed 1000 characters').nullable().optional()
}).strict('Unknown fields are not allowed');

// === NEW SCHEMAS FOR PHASE 7C ===

const createNoteSchema = z.object({
  content: z.string({
    required_error: 'Content is required'
  }).trim().min(1, 'Content cannot be empty')
}).strict('Unknown fields are not allowed');

const updateNoteSchema = z.object({
  content: z.string().trim().min(1, 'Content cannot be empty').optional()
}).strict('Unknown fields are not allowed');

const createCommunicationSchema = z.object({
  type: z.enum(['Call', 'Email', 'Meeting', 'Message'], {
    required_error: 'Communication type is required and must be one of: Call, Email, Meeting, Message'
  }),
  comm_date: z.string({
    required_error: 'Communication date is required'
  }).refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  comm_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format HH:MM or HH:MM:SS').optional().nullable(),
  subject: z.string({
    required_error: 'Subject is required'
  }).trim().min(1, 'Subject cannot be empty').max(255),
  discussion_summary: z.string().trim().optional().nullable(),
  client_problem: z.string().trim().optional().nullable(),
  suggested_solution: z.string().trim().optional().nullable(),
  success_status: z.boolean().optional().default(false),
  attachment_url: z.string().url('Invalid attachment URL format').or(z.literal('')).optional().nullable()
}).strict('Unknown fields are not allowed');

const updateCommunicationSchema = z.object({
  type: z.enum(['Call', 'Email', 'Meeting', 'Message']).optional(),
  comm_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format').optional(),
  comm_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, 'Invalid time format HH:MM or HH:MM:SS').optional().nullable(),
  subject: z.string().trim().min(1, 'Subject cannot be empty').max(255).optional(),
  discussion_summary: z.string().trim().optional().nullable(),
  client_problem: z.string().trim().optional().nullable(),
  suggested_solution: z.string().trim().optional().nullable(),
  success_status: z.boolean().optional(),
  attachment_url: z.string().url('Invalid attachment URL format').or(z.literal('')).optional().nullable()
}).strict('Unknown fields are not allowed');

const createFollowupSchema = z.object({
  communication_type: z.string().trim().optional().nullable(),
  reminder_notes: z.string().trim().optional().nullable(),
  outcome: z.string().trim().optional().nullable(),
  followup_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid follow-up date format').optional().nullable(),
  completed_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid completed date format').optional().nullable(),
  status: z.enum(['Pending', 'Completed', 'Cancelled']).optional().default('Pending'),
  remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const updateFollowupSchema = z.object({
  communication_type: z.string().trim().optional().nullable(),
  reminder_notes: z.string().trim().optional().nullable(),
  outcome: z.string().trim().optional().nullable(),
  followup_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid follow-up date format').optional().nullable(),
  completed_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid completed date format').optional().nullable(),
  status: z.enum(['Pending', 'Completed', 'Cancelled']).optional(),
  remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

// === NEW SCHEMAS FOR PHASE 7D ===

const createRequirementSchema = z.object({
  requirement: z.string({
    required_error: 'Title/Requirement is required'
  }).trim().min(1, 'Title/Requirement cannot be empty'),
  notes: z.string().trim().optional().nullable(),
  priority: z.string().trim().optional().default('Medium'),
  complexity: z.string().trim().optional().default('Medium'),
  approval_status: z.string().trim().optional().default('Pending'),
  estimated_hours: z.number().int().nonnegative('Estimated hours must be greater than or equal to 0').optional().nullable(),
  assigned_developer_id: z.string().uuid('Invalid Assigned Developer ID format').optional().nullable(),
  assigned_team: z.string().trim().optional().nullable(),
  approved: z.boolean().optional().default(false),
  remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const updateRequirementSchema = z.object({
  requirement: z.string().trim().min(1, 'Title/Requirement cannot be empty').optional(),
  notes: z.string().trim().optional().nullable(),
  priority: z.string().trim().optional(),
  complexity: z.string().trim().optional(),
  approval_status: z.string().trim().optional(),
  estimated_hours: z.number().int().nonnegative('Estimated hours must be greater than or equal to 0').optional().nullable(),
  assigned_developer_id: z.string().uuid('Invalid Assigned Developer ID format').optional().nullable(),
  assigned_team: z.string().trim().optional().nullable(),
  approved: z.boolean().optional(),
  remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const createProposalSchema = z.object({
  proposal_number: z.string().trim().optional().nullable(),
  proposal_version: z.string().trim().optional().default('v1.0'),
  business_analysis: z.string().trim().optional().nullable(),
  technical_analysis: z.string().trim().optional().nullable(),
  risk_analysis: z.string().trim().optional().nullable(),
  scope: z.string().trim().optional().nullable(),
  timeline: z.string().trim().optional().nullable(),
  est_hours: z.number().int().nonnegative('Estimated hours must be >= 0').optional().nullable(),
  quotation_amount: z.number().nonnegative('Quotation amount must be >= 0').optional().nullable(),
  discount: z.number().nonnegative('Discount must be >= 0').optional().default(0),
  final_cost: z.number().nonnegative('Final cost must be >= 0').optional().nullable(),
  currency: z.string().trim().max(10).optional().default('INR'),
  status: z.enum(['Draft', 'Sent', 'Negotiation', 'Approved', 'Rejected']).optional().default('Draft'),
  is_approved: z.boolean().optional().default(false),
  contract_signed: z.boolean().optional().default(false),
  advance_received: z.boolean().optional().default(false),
  advance_amount: z.number().nonnegative('Advance amount must be >= 0').optional().default(0)
}).strict('Unknown fields are not allowed');

const updateProposalSchema = z.object({
  proposal_number: z.string().trim().optional().nullable(),
  proposal_version: z.string().trim().optional(),
  business_analysis: z.string().trim().optional().nullable(),
  technical_analysis: z.string().trim().optional().nullable(),
  risk_analysis: z.string().trim().optional().nullable(),
  scope: z.string().trim().optional().nullable(),
  timeline: z.string().trim().optional().nullable(),
  est_hours: z.number().int().nonnegative('Estimated hours must be >= 0').optional().nullable(),
  quotation_amount: z.number().nonnegative('Quotation amount must be >= 0').optional().nullable(),
  discount: z.number().nonnegative('Discount must be >= 0').optional(),
  final_cost: z.number().nonnegative('Final cost must be >= 0').optional().nullable(),
  currency: z.string().trim().max(10).optional(),
  status: z.enum(['Draft', 'Sent', 'Negotiation', 'Approved', 'Rejected']).optional(),
  is_approved: z.boolean().optional(),
  contract_signed: z.boolean().optional(),
  advance_received: z.boolean().optional(),
  advance_amount: z.number().nonnegative('Advance amount must be >= 0').optional()
}).strict('Unknown fields are not allowed');

const approveRejectProposalSchema = z.object({
  remarks: z.string().trim().max(1000, 'Remarks cannot exceed 1000 characters').optional().nullable()
}).strict('Unknown fields are not allowed');

const receiveAdvanceSchema = z.object({
  advance_amount: z.number().positive('Advance amount must be greater than 0')
}).strict('Unknown fields are not allowed');

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  leadIdParamSchema,
  updateJourneySchema,
  createNoteSchema,
  updateNoteSchema,
  createCommunicationSchema,
  updateCommunicationSchema,
  createFollowupSchema,
  updateFollowupSchema,
  createRequirementSchema,
  updateRequirementSchema,
  createProposalSchema,
  updateProposalSchema,
  approveRejectProposalSchema,
  receiveAdvanceSchema
};
