const { z } = require('zod');

// Note: there is no "role" field. Zod strips unknown keys, so a user
// sending { role: 'admin' } on register is silently ignored.
const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Email is invalid')),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'), // bcrypt ignores bytes after 72
});

const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().toLowerCase().pipe(z.email('Email is invalid')),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
