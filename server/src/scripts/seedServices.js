// Adds the clinic's starter services from data/services.js.
// Run with:  npm run seed:services
// Safe to run more than once: a service whose name already exists (ignoring
// upper/lower case) is skipped, so admin edits to it are never overwritten.
const mongoose = require('mongoose');
const { env, assertRequiredEnv } = require('../config/env');
const connectDB = require('../config/db');
const Service = require('../models/Service');
const services = require('./data/services');

// Same case-insensitive comparison as the unique index on Service.name
const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

async function seedServices() {
  assertRequiredEnv();
  await connectDB(env.mongoUri);

  let created = 0;
  let skipped = 0;
  for (const service of services) {
    const exists = await Service.findOne({ name: service.name }).collation(CASE_INSENSITIVE);
    if (exists) {
      skipped += 1;
      continue;
    }
    // create() runs the schema validation, so bad data would stop the script
    await Service.create(service);
    created += 1;
  }

  console.log(`Services: ${created} created, ${skipped} already existed (${services.length} in seed file)`);
}

seedServices()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
