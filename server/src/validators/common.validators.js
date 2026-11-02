const { z } = require('zod');

// Shared ?page=&limit=&search= rules for every list endpoint.
// Query values always arrive as strings, so z.coerce turns "2" into 2.
const paginationQuery = z.object({
  page: z.coerce.number({ error: 'page must be a number' }).int().min(1, 'page must be at least 1').default(1),
  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int()
    .min(1, 'limit must be at least 1')
    .max(50, 'limit must be at most 50')
    .default(10),
  search: z.string().trim().max(100, 'search must be at most 100 characters').optional(),
});

module.exports = { paginationQuery };
