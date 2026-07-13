const { z } = require('zod');

const dashboardFilterSchema = z.object({
  startDate: z.string().trim().optional().transform(val => val === '' ? undefined : val),
  endDate: z.string().trim().optional().transform(val => val === '' ? undefined : val),
  branchId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  teamId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  developerId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  branchManagerId: z.string().uuid().optional().or(z.literal('').transform(() => undefined)),
  leadStatus: z.string().optional().or(z.literal('').transform(() => undefined)),
  minRevenue: z.string().optional().transform(val => val && val !== '' ? Number(val) : undefined),
  maxRevenue: z.string().optional().transform(val => val && val !== '' ? Number(val) : undefined),
  months: z.string().optional().transform(val => val && val !== '' ? Math.max(1, parseInt(val, 10)) : 6),
  limit: z.string().optional().transform(val => val && val !== '' ? Math.max(1, parseInt(val, 10)) : 10)
});

module.exports = {
  dashboardFilterSchema
};
