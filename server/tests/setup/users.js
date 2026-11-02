// Creates a user directly in the DB and returns an Authorization header for them.
const User = require('../../src/models/User');
const { signToken } = require('../../src/utils/token');

let counter = 0;

async function createUserWithToken(role = 'user') {
  counter += 1;
  const user = await User.create({
    name: `${role} ${counter}`,
    email: `${role}${counter}@example.com`,
    password: 'password123',
    role,
  });
  return { user, auth: { Authorization: `Bearer ${signToken(user)}` } };
}

module.exports = { createUserWithToken };
