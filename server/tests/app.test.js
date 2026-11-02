const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    // No DB connection in this test, so mongoose reports "disconnected"
    expect(res.body.data.database).toBe('disconnected');
  });
});

describe('Unknown routes', () => {
  it('returns 404 JSON without a stack trace', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: 'Route not found: GET /api/does-not-exist',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
  });
});

describe('Malformed JSON body', () => {
  it('returns 400 with a clear message', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"bad json"');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Malformed JSON in request body' });
  });
});

describe('CORS', () => {
  it('allows the configured client origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not allow other origins', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'http://evil.example.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Security headers', () => {
  it('hides the X-Powered-By header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
