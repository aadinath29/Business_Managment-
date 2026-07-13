const { z } = require('zod');

// Helpers for date validation
const dateString = z.string().trim().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format'
});

const nullableDateString = z.string().trim().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format'
}).nullable().optional();

// === Delivery Schemas ===

const createDeliverySchema = z.object({
  go_live_date: nullableDateString,
  deployment_date: nullableDateString,
  uat_status: z.string().trim().max(50).optional().default('Pending'),
  documentation_status: z.string().trim().max(50).optional().default('Pending'),
  acceptance_status: z.string().trim().max(50).optional().default('Pending'),
  handover_completed: z.boolean().optional().default(false),
  remarks: z.string().trim().optional().nullable(),
  
  // Serialized properties
  deployment_status: z.string().trim().max(50).optional().nullable(),
  uat_remarks: z.string().trim().optional().nullable(),
  documentation_delivered: z.boolean().optional().nullable(),
  training_completed: z.boolean().optional().nullable(),
  client_acceptance: z.string().trim().max(50).optional().nullable(),
  acceptance_date: nullableDateString,
  warranty_start: nullableDateString,
  warranty_end: nullableDateString,
  delivery_remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const updateDeliverySchema = z.object({
  go_live_date: nullableDateString,
  deployment_date: nullableDateString,
  uat_status: z.string().trim().max(50).optional(),
  documentation_status: z.string().trim().max(50).optional(),
  acceptance_status: z.string().trim().max(50).optional(),
  handover_completed: z.boolean().optional(),
  remarks: z.string().trim().optional().nullable(),
  
  // Serialized properties
  deployment_status: z.string().trim().max(50).optional().nullable(),
  uat_remarks: z.string().trim().optional().nullable(),
  documentation_delivered: z.boolean().optional().nullable(),
  training_completed: z.boolean().optional().nullable(),
  client_acceptance: z.string().trim().max(50).optional().nullable(),
  acceptance_date: nullableDateString,
  warranty_start: nullableDateString,
  warranty_end: nullableDateString,
  delivery_remarks: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

// === Customer Success Schemas ===

const createCSSchema = z.object({
  support_status: z.string().trim().max(50).optional().default('Pending'),
  renewal_date: nullableDateString,
  health_score: z.number().int().min(0).max(100).optional().nullable(),
  nps: z.number().int().min(-100).max(100).optional().nullable(),
  feedback: z.string().trim().optional().nullable(),
  upsell_opportunity: z.boolean().optional().default(false),
  renewal_status: z.string().trim().max(50).optional().default('Pending'),
  
  // Serialized properties
  amc_status: z.string().trim().max(50).optional().nullable(),
  support_plan: z.string().trim().max(100).optional().nullable(),
  cross_sell_opportunity: z.boolean().optional().nullable(),
  last_review_date: nullableDateString,
  next_review_date: nullableDateString,
  success_manager: z.string().trim().max(255).optional().nullable(),
  customer_status: z.string().trim().max(50).optional().nullable(),
  amc_details_text: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const updateCSSchema = z.object({
  support_status: z.string().trim().max(50).optional(),
  renewal_date: nullableDateString,
  health_score: z.number().int().min(0).max(100).optional().nullable(),
  nps: z.number().int().min(-100).max(100).optional().nullable(),
  feedback: z.string().trim().optional().nullable(),
  upsell_opportunity: z.boolean().optional(),
  renewal_status: z.string().trim().max(50).optional(),
  
  // Serialized properties
  amc_status: z.string().trim().max(50).optional().nullable(),
  support_plan: z.string().trim().max(100).optional().nullable(),
  cross_sell_opportunity: z.boolean().optional().nullable(),
  last_review_date: nullableDateString,
  next_review_date: nullableDateString,
  success_manager: z.string().trim().max(255).optional().nullable(),
  customer_status: z.string().trim().max(50).optional().nullable(),
  amc_details_text: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

// === Search & Query Filter Schemas ===

const listDeliveryQuerySchema = z.object({
  page: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().positive().default(1)),
  limit: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().positive().default(10)),
  delivery_status: z.string().trim().optional(), // uat_status or acceptance_status
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  branch_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  sort_by: z.enum(['go_live_date', 'created_at', 'uat_status']).optional().default('created_at'),
  sort_order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('DESC')
});

const listCSQuerySchema = z.object({
  page: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().positive().default(1)),
  limit: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().positive().default(10)),
  customer_status: z.string().trim().optional(),
  renewal_status: z.string().trim().optional(),
  health_score_min: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().min(0).max(100).optional()),
  health_score_max: z.preprocess((val) => val ? parseInt(val, 10) : undefined, z.number().int().min(0).max(100).optional()),
  branch_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  sort_by: z.enum(['renewal_date', 'health_score', 'nps', 'created_at']).optional().default('created_at'),
  sort_order: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional().default('DESC')
});

module.exports = {
  createDeliverySchema,
  updateDeliverySchema,
  createCSSchema,
  updateCSSchema,
  listDeliveryQuerySchema,
  listCSQuerySchema
};
