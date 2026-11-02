// Starts a throwaway in-memory MongoDB for tests, so they never touch Atlas.
// Note: `npm test` runs Jest with --experimental-vm-modules because the MongoDB
// driver loads Node's `os` module with a dynamic import(). Without the flag that
// import fails inside Jest's sandbox and MongoDB rejects the connection handshake.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

// Empty every collection between tests so each test starts clean.
async function clear() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

async function close() {
  await mongoose.disconnect();
  await mongod.stop();
}

module.exports = { connect, clear, close };
