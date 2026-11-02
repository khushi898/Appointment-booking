// Creates the first admin account from ADMIN_* values in .env.
// Run with:  npm run seed:admin
// Safe to run more than once: if the email already exists it is promoted to admin
// (its password is left unchanged).
const mongoose = require('mongoose');
const { env, assertRequiredEnv } = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seedAdmin() {
  assertRequiredEnv();
  const { ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  }

  await connectDB(env.mongoUri);

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing user ${existing.email} to admin`);
    } else {
      console.log(`Admin ${existing.email} already exists — nothing to do`);
    }
  } else {
    // create() runs the pre-save hook, so the password is hashed with bcrypt
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`Created admin ${admin.email}`);
  }
}

seedAdmin()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
