const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const { protect, adminOnly } = require('../src/middleware/auth');
const errorHandler = require('../src/middleware/errorHandler');
const db = require('./setup/db');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

const validUser = { name: 'Asha Rao', email: 'Asha@Example.com', password: 'secret123' };

function register(body = validUser) {
  return request(app).post('/api/auth/register').send(body);
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns 201 with a token', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com', role: 'user' });
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('stores the password as a bcrypt hash, not plain text', async () => {
    await register();
    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');

    expect(stored.password).not.toBe('secret123');
    expect(stored.password).toMatch(/^\$2[aby]\$12\$/); // bcrypt hash with cost 12
  });

  it('ignores a role sent in the body (cannot self-register as admin)', async () => {
    const res = await register({ ...validUser, role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('returns 409 when the email is already registered', async () => {
    await register();
    const res = await register({ ...validUser, email: 'asha@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('An account with this email already exists');
  });

  it('returns 400 with field details for missing/invalid fields', async () => {
    const res = await register({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => register());

  it('returns 200 with a token for correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'secret123' });

    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ sub: res.body.data.user._id, role: 'user' });
  });

  it('returns 401 for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@example.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns the same 401 message for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me (protect middleware)', () => {
  it('returns the current user with a valid token', async () => {
    const { body } = await register();
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('asha@example.com');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authenticated: token missing');
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', role: 'admin' }, 'attacker-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('returns 401 for an expired token', async () => {
    const { body } = await register();
    const expired = jwt.sign({ sub: body.data.user._id, role: 'user' }, process.env.JWT_SECRET, {
      expiresIn: -10,
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token expired, please log in again');
  });

  it('returns 401 when the user behind a valid token was deleted', async () => {
    const { body } = await register();
    await User.deleteMany({});
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.data.token}`);

    expect(res.status).toBe(401);
  });
});

describe('adminOnly middleware', () => {
  // A tiny app with one admin-only route, until real admin routes exist (Feature 3).
  const adminApp = express();
  adminApp.get('/admin-only', protect, adminOnly, (req, res) => res.json({ ok: true }));
  adminApp.use(errorHandler);

  it('returns 403 for a normal user', async () => {
    const { body } = await register();
    const res = await request(adminApp).get('/admin-only').set('Authorization', `Bearer ${body.data.token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Forbidden: admin access only');
  });

  it('allows an admin', async () => {
    await User.create({ name: 'Admin', email: 'admin@example.com', password: 'adminpass1', role: 'admin' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'adminpass1' });
    const res = await request(adminApp).get('/admin-only').set('Authorization', `Bearer ${login.body.data.token}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 (not 403) when there is no token at all', async () => {
    const res = await request(adminApp).get('/admin-only');
    expect(res.status).toBe(401);
  });
});
