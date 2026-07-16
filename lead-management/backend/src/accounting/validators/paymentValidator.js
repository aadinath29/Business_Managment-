const { z } = require('zod');

const paymentModeEnum = z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']);

const createPaymentSchema = z.object({
  payment_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format'),
  payment_mode: paymentModeEnum,
  transaction_number: z.string().trim().optional().nullable(),
  amount_received: z.number().positive('Amount received must be greater than 0'),
  bank_name: z.string().trim().optional().nullable(),
  received_by: z.string().trim().optional().nullable(),
  document_url: z.string().url('Invalid URL format').optional().nullable(),
  notes: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

const updatePaymentSchema = z.object({
  payment_date: z.string().refine(val => !isNaN(new Date(val).getTime()), 'Invalid date format').optional(),
  payment_mode: paymentModeEnum.optional(),
  transaction_number: z.string().trim().optional().nullable(),
  amount_received: z.number().positive('Amount received must be greater than 0').optional(),
  bank_name: z.string().trim().optional().nullable(),
  received_by: z.string().trim().optional().nullable(),
  document_url: z.string().url('Invalid URL format').optional().nullable(),
  notes: z.string().trim().optional().nullable()
}).strict('Unknown fields are not allowed');

module.exports = {
  createPaymentSchema,
  updatePaymentSchema
};
