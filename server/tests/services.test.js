const request = require('supertest');
const app = require('../src/app');
const Service = require('../src/models/Service');
const db = require('./setup/db');
const { createUserWithToken } = require('./setup/users');

beforeAll(async () => {
  await db.connect();
  await Service.init(); // make sure the unique index exists before the duplicate test
});
afterEach(db.clear);
afterAll(db.close);

const haircut = { name: 'Haircut', description: 'Wash and cut', durationMinutes: 30, price: 25 };

let adminAuth;
let userAuth;
beforeEach(async () => {
  ({ auth: adminAuth } = await createUserWithToken('admin'));
  ({ auth: userAuth } = await createUserWithToken('user'));
});

describe('POST /api/services', () => {
  it('lets an admin create a service (201)', async () => {
    const res = await request(app).post('/api/services').set(adminAuth).send(haircut);

    expect(res.status).toBe(201);
    expect(res.body.data.service).toMatchObject({ ...haircut, isActive: true });
    expect(res.body.data.service.createdAt).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/services').send(haircut);
    expect(res.status).toBe(401);
  });

  it('returns 403 for a normal user', async () => {
    const res = await request(app).post('/api/services').set(userAuth).send(haircut);
    expect(res.status).toBe(403);
  });

  it('returns 400 with details for invalid fields', async () => {
    const res = await request(app)
      .post('/api/services')
      .set(adminAuth)
      .send({ name: 'X', durationMinutes: 2.5, price: -1 });

    expect(res.status).toBe(400);
    const fields = res.body.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'durationMinutes', 'price']));
  });

  it('returns 409 for a duplicate name, ignoring case', async () => {
    await request(app).post('/api/services').set(adminAuth).send(haircut);
    const res = await request(app).post('/api/services').set(adminAuth).send({ ...haircut, name: 'HAIRCUT' });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/services', () => {
  beforeEach(async () => {
    await Service.create([
      { name: 'Haircut', durationMinutes: 30, price: 25 },
      { name: 'Beard Trim', durationMinutes: 15, price: 10 },
      { name: 'Hair Colour', description: 'Full colour', durationMinutes: 90, price: 80 },
      { name: 'Old Massage', durationMinutes: 60, price: 50, isActive: false },
    ]);
  });

  it('is public and returns only active services with pagination info', async () => {
    const res = await request(app).get('/api/services');

    expect(res.status).toBe(200);
    expect(res.body.data.services).toHaveLength(3);
    expect(res.body.data.services.map((s) => s.name)).not.toContain('Old Massage');
    expect(res.body.data.pagination).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
  });

  it('paginates with ?page and ?limit', async () => {
    const res = await request(app).get('/api/services?page=2&limit=2&sort=name');

    expect(res.status).toBe(200);
    expect(res.body.data.services.map((s) => s.name)).toEqual(['Haircut']);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('searches name and description case-insensitively', async () => {
    const res = await request(app).get('/api/services?search=HAIR');
    expect(res.body.data.services.map((s) => s.name).sort()).toEqual(['Hair Colour', 'Haircut']);
  });

  it('treats regex characters in search literally', async () => {
    const res = await request(app).get('/api/services?search=.*');
    expect(res.status).toBe(200);
    expect(res.body.data.services).toHaveLength(0);
  });

  it('sorts with ?sort=-price', async () => {
    const res = await request(app).get('/api/services?sort=-price');
    expect(res.body.data.services.map((s) => s.price)).toEqual([80, 25, 10]);
  });

  it('returns 400 for invalid query values', async () => {
    const res = await request(app).get('/api/services?page=0&limit=500&sort=password');

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual(expect.arrayContaining(['page', 'limit', 'sort']));
  });

  it('lets an admin include inactive services', async () => {
    const res = await request(app).get('/api/services?includeInactive=true').set(adminAuth);
    expect(res.body.data.services).toHaveLength(4);
  });

  it('returns 403 when a normal user asks for inactive services', async () => {
    const res = await request(app).get('/api/services?includeInactive=true').set(userAuth);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/services/:id', () => {
  it('returns a single active service', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).get(`/api/services/${service._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.service.name).toBe('Haircut');
  });

  it('returns 404 for an inactive service to the public, but not to admins', async () => {
    const service = await Service.create({ ...haircut, isActive: false });

    expect((await request(app).get(`/api/services/${service._id}`)).status).toBe(404);
    expect((await request(app).get(`/api/services/${service._id}`).set(adminAuth)).status).toBe(200);
  });

  it('returns 404 for an id that does not exist', async () => {
    const res = await request(app).get('/api/services/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/services/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/services/:id', () => {
  it('updates only the fields sent', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).patch(`/api/services/${service._id}`).set(adminAuth).send({ price: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data.service).toMatchObject({ name: 'Haircut', price: 30, durationMinutes: 30 });
  });

  it('returns 400 for an empty body', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).patch(`/api/services/${service._id}`).set(adminAuth).send({});

    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toBe('Provide at least one field to update');
  });

  it('returns 403 for a normal user', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).patch(`/api/services/${service._id}`).set(userAuth).send({ price: 1 });
    expect(res.status).toBe(403);
  });

  it('can reactivate a deleted service', async () => {
    const service = await Service.create({ ...haircut, isActive: false });
    const res = await request(app).patch(`/api/services/${service._id}`).set(adminAuth).send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.service.isActive).toBe(true);
  });
});

describe('DELETE /api/services/:id', () => {
  it('soft-deletes: hidden from the public list but kept in the DB', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).delete(`/api/services/${service._id}`).set(adminAuth);

    expect(res.status).toBe(200);
    expect((await request(app).get('/api/services')).body.data.services).toHaveLength(0);
    expect(await Service.findById(service._id)).toMatchObject({ isActive: false });
  });

  it('returns 403 for a normal user', async () => {
    const service = await Service.create(haircut);
    const res = await request(app).delete(`/api/services/${service._id}`).set(userAuth);
    expect(res.status).toBe(403);
  });
});
