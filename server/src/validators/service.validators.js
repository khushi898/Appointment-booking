const { z } = require('zod');
const { paginationQuery } = require('./common.validators');

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be at most 100 characters');
const description = z.string().trim().max(500, 'Description must be at most 500 characters');
const durationMinutes = z
  .number({ error: 'Duration must be a number' })
  .int('Duration must be a whole number of minutes')
  .min(5, 'Duration must be at least 5 minutes')
  .max(480, 'Duration must be at most 480 minutes');
const price = z
  .number({ error: 'Price must be a number' })
  .min(0, 'Price cannot be negative')
  .max(100000, 'Price must be at most 100000');

const createServiceSchema = z.object({
  name,
  description: description.optional(),
  durationMinutes,
  price,
});

// PATCH: every field optional, but the body must change at least one thing.
const updateServiceSchema = z
  .object({
    name: name.optional(),
    description: description.optional(),
    durationMinutes: durationMinutes.optional(),
    price: price.optional(),
    isActive: z.boolean({ error: 'isActive must be true or false' }).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' });

// Only these fields can be sorted on; "-" in front means descending.
const SORT_FIELDS = ['name', 'price', 'durationMinutes', 'createdAt'];
const SORT_OPTIONS = SORT_FIELDS.flatMap((field) => [field, `-${field}`]);

const listServicesQuery = paginationQuery.extend({
  sort: z.enum(SORT_OPTIONS, { error: `sort must be one of: ${SORT_OPTIONS.join(', ')}` }).default('name'),
  includeInactive: z
    .enum(['true', 'false'], { error: 'includeInactive must be true or false' })
    .default('false')
    .transform((value) => value === 'true'),
});

module.exports = { createServiceSchema, updateServiceSchema, listServicesQuery };
