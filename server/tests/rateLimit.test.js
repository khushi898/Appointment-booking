// Uses a low limit so we can trigger it quickly. Set before requiring the app,
// because the limiter reads the value when it is created.
process.env.AUTH_RATE_LIMIT_MAX = '3';

const request = require('supertest');
const app = require('../src/app');

describe('Auth rate limiting', () => {
  it('returns 429 after too many login attempts from the same IP', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({});

    // First 3 get through to validation (400), the 4th is blocked
    for (let i = 0; i < 3; i += 1) {
      expect((await attempt()).status).toBe(400);
    }
    const blocked = await attempt();

    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe('Too many attempts, please try again in 15 minutes');
  });

  it('does not rate-limit non-auth routes', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
