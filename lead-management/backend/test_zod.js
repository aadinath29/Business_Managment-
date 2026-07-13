const { z } = require('zod');

const schema = z.object({
  sortBy: z.enum(['created_at', 'branch_name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional().transform(val => val ? val.toUpperCase() : 'DESC')
});

console.log(schema.safeParse({}));
