const { z } = require('zod');

const invoiceStatusEnum = z.enum(['Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']);
const invoiceTypeEnum = z.enum(['GST Invoice', 'Export Invoice', 'SEZ Invoice']);

const invoiceItemSchema = z.object({
  service_name: z.string().trim().min(1, 'Service name is required'),
  description: z.string().trim().optional().nullable(),
  hsn_sac: z.string().trim().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().trim().default('Nos'),
  rate: z.number().nonnegative('Rate must be greater than or equal to 0'),
  discount_percentage: z.number().nonnegative().max(100).default(0),
  tax_percentage: z.number().nonnegative().max(100).default(18),
});

const createInvoiceSchema = z.object({
  lead_id: z.string().uuid('Invalid Lead ID format'),
  proforma_id: z.string().uuid('Invalid Proforma ID format').optional().nullable(),
  invoice_number: z.string().trim().min(1, 'Invoice number is required'),
  invoice_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  due_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format').optional().nullable(),
  invoice_type: invoiceTypeEnum.default('GST Invoice'),
  place_of_supply: z.string().trim().optional().nullable(),
  currency: z.string().trim().default('INR'),
  status: invoiceStatusEnum.default('Pending'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required')
}).strict('Unknown fields are not allowed');

const listInvoicesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  lead_id: z.string().uuid().optional(),
  status: invoiceStatusEnum.optional(),
  invoice_type: invoiceTypeEnum.optional(),
});

module.exports = {
  createInvoiceSchema,
  listInvoicesQuerySchema
};
