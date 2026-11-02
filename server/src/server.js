// Entry point: check env vars, connect to MongoDB, then start the HTTP server.
const { env, assertRequiredEnv } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  assertRequiredEnv();
  await connectDB(env.mongoUri);
  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
