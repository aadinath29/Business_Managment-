const { z } = require('zod');

const proformaStatusEnum = z.enum(['Unpaid', 'Partially Paid', 'Paid', 'Expired', 'Cancelled']);

const proformaItemSchema = z.object({
  service_name: z.string().trim().min(1, 'Service name is required'),
  description: z.string().trim().optional().nullable(),
  hsn_sac: z.string().trim().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().trim().default('Nos'),
  rate: z.number().nonnegative('Rate must be greater than or equal to 0'),
  discount_percentage: z.number().nonnegative().max(100).default(0),
  tax_percentage: z.number().nonnegative().max(100).default(18),
});

const createProformaSchema = z.object({
  lead_id: z.string().uuid('Invalid Lead ID format'),
  quotation_id: z.string().uuid('Invalid Quotation ID format').optional().nullable(),
  proforma_number: z.string().trim().min(1, 'Proforma number is required'),
  proforma_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  due_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format').optional().nullable(),
  status: proformaStatusEnum.default('Unpaid'),
  notes: z.string().trim().optional().nullable(),
  items: z.array(proformaItemSchema).min(1, 'At least one item is required')
}).strict('Unknown fields are not allowed');

const updateProformaStatusSchema = z.object({
  status: proformaStatusEnum
}).strict('Unknown fields are not allowed');

const listProformasQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  lead_id: z.string().uuid().optional(),
  status: proformaStatusEnum.optional(),
});

module.exports = {
  createProformaSchema,
  updateProformaStatusSchema,
  listProformasQuerySchema
};
