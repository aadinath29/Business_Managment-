const { z } = require('zod');

const quotationStatusEnum = z.enum([
  'Draft', 'Sent', 'In Negotiation', 'Accepted', 'Rejected', 'Expired'
]);

const quotationItemSchema = z.object({
  service_name: z.string().trim().min(1, 'Service name is required'),
  description: z.string().trim().optional().nullable(),
  hsn_sac: z.string().trim().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().trim().default('Nos'),
  rate: z.number().nonnegative('Rate must be greater than or equal to 0'),
  discount_percentage: z.number().nonnegative().max(100).default(0),
  tax_percentage: z.number().nonnegative().max(100).default(18),
});

const createQuotationSchema = z.object({
  lead_id: z.string().uuid('Invalid Lead ID format'),
  quotation_number: z.string().trim().min(1, 'Quotation number is required'),
  quotation_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  validity_days: z.number().int().nonnegative().default(30),
  status: quotationStatusEnum.default('Draft'),
  notes: z.string().trim().optional().nullable(),
  customer_name: z.string().trim().optional().nullable(),
  bill_to: z.string().trim().optional().nullable(),
  ship_to: z.string().trim().optional().nullable(),
  payment_terms: z.string().trim().optional().nullable(),
  priority: z.string().trim().optional().nullable(),
  shipping_amount: z.number().nonnegative().optional().default(0),
  terms: z.string().trim().optional().nullable(),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required')
}).strict('Unknown fields are not allowed');

const updateQuotationSchema = z.object({
  validity_days: z.number().int().nonnegative().optional(),
  status: quotationStatusEnum.optional(),
  notes: z.string().trim().optional().nullable(),
  customer_name: z.string().trim().optional().nullable(),
  bill_to: z.string().trim().optional().nullable(),
  ship_to: z.string().trim().optional().nullable(),
  payment_terms: z.string().trim().optional().nullable(),
  priority: z.string().trim().optional().nullable(),
  shipping_amount: z.number().nonnegative().optional(),
  terms: z.string().trim().optional().nullable(),
  items: z.array(quotationItemSchema).optional(),
  quotation_number: z.string().trim().optional(),
  quotation_date: z.string().optional()
}).strict('Unknown fields are not allowed');

const listQuotationsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  lead_id: z.string().uuid().optional(),
  status: quotationStatusEnum.optional(),
});

module.exports = {
  createQuotationSchema,
  updateQuotationSchema,
  listQuotationsQuerySchema
};
