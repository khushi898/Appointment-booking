const mongoose = require('mongoose');

async function connectDB(uri) {
  await mongoose.connect(uri);
  // Log only the host — never the full URI, which contains the password.
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
