const request = require('supertest');
const app = require('../src/app');
const Availability = require('../src/models/Availability');
const Appointment = require('../src/models/Appointment');
const Service = require('../src/models/Service');
const db = require('./setup/db');
const { createUserWithToken } = require('./setup/users');
const { nowInBusinessTz, addDays } = require('../src/utils/dateTime');

beforeAll(async () => {
  await db.connect();
  await Availability.init(); // build the unique index on date
});
afterEach(db.clear);
afterAll(db.close);

// Far-future dates keep the tests independent of "today"
const FUTURE = '2099-01-15';

let adminAuth;
let userAuth;
beforeEach(async () => {
  ({ auth: adminAuth } = await createUserWithToken('admin'));
  ({ auth: userAuth } = await createUserWithToken('user'));
});

describe('PUT /api/availability/:date', () => {
  it('creates a day (201) with slots sorted and de-duplicated', async () => {
    const res = await request(app)
      .put(`/api/availability/${FUTURE}`)
      .set(adminAuth)
      .send({ slots: ['10:00', '09:00', '10:00', '09:30'] });

    expect(res.status).toBe(201);
    expect(res.body.data.day).toMatchObject({ date: FUTURE, slots: ['09:00', '09:30', '10:00'] });
  });

  it('replaces the slots of an existing day (200)', async () => {
    await Availability.create({ date: FUTURE, slots: ['09:00'] });
    const res = await request(app).put(`/api/availability/${FUTURE}`).set(adminAuth).send({ slots: ['14:00'] });

    expect(res.status).toBe(200);
    expect(res.body.data.day.slots).toEqual(['14:00']);
    expect(await Availability.countDocuments()).toBe(1);
  });

  it('returns 401 without a token and 403 for a normal user', async () => {
    const body = { slots: ['09:00'] };
    expect((await request(app).put(`/api/availability/${FUTURE}`).send(body)).status).toBe(401);
    expect((await request(app).put(`/api/availability/${FUTURE}`).set(userAuth).send(body)).status).toBe(403);
  });

  it('returns 400 for a past date', async () => {
    const res = await request(app).put('/api/availability/2000-01-01').set(adminAuth).send({ slots: ['09:00'] });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot set availability for a past date');
  });

  it('allows today', async () => {
    const today = nowInBusinessTz().date;
    const res = await request(app).put(`/api/availability/${today}`).set(adminAuth).send({ slots: ['23:59'] });
    expect(res.status).toBe(201);
  });

  it('returns 400 for an impossible date', async () => {
    const res = await request(app).put('/api/availability/2099-02-30').set(adminAuth).send({ slots: ['09:00'] });

    expect(res.status).toBe(400);
    expect(res.body.details[0]).toEqual({ field: 'date', message: 'Date must be a real date in YYYY-MM-DD format' });
  });

  it('returns 400 for bad or empty slots', async () => {
    const bad = await request(app).put(`/api/availability/${FUTURE}`).set(adminAuth).send({ slots: ['9am'] });
    const empty = await request(app).put(`/api/availability/${FUTURE}`).set(adminAuth).send({ slots: [] });

    expect(bad.status).toBe(400);
    expect(bad.body.details[0].message).toBe('Each slot must be a time in HH:mm format');
    expect(empty.status).toBe(400);
    expect(empty.body.details[0].message).toBe('At least one slot is required');
  });
});

describe('GET /api/availability/:date', () => {
  it('is public and returns the slots for a day', async () => {
    await Availability.create({ date: FUTURE, slots: ['09:00', '09:30'] });
    const res = await request(app).get(`/api/availability/${FUTURE}`);

    expect(res.status).toBe(200);
    expect(res.body.data.day.slots).toEqual(['09:00', '09:30']);
  });

  it('returns 404 for a day with no availability', async () => {
    const res = await request(app).get(`/api/availability/${FUTURE}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/availability?from=&to=', () => {
  beforeEach(async () => {
    await Availability.create([
      { date: '2099-01-10', slots: ['09:00'] },
      { date: '2099-01-12', slots: ['10:00'] },
      { date: '2099-02-20', slots: ['11:00'] },
    ]);
  });

  it('returns days in the range, sorted by date', async () => {
    const res = await request(app).get('/api/availability?from=2099-01-01&to=2099-01-31');

    expect(res.status).toBe(200);
    expect(res.body.data.days.map((d) => d.date)).toEqual(['2099-01-10', '2099-01-12']);
  });

  it('defaults to today + 30 days', async () => {
    const today = nowInBusinessTz().date;
    const res = await request(app).get('/api/availability');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ from: today, to: addDays(today, 30) });
  });

  it('returns 400 when from is after to', async () => {
    const res = await request(app).get('/api/availability?from=2099-02-01&to=2099-01-01');
    expect(res.status).toBe(400);
  });

  it('returns 400 when the range is longer than 62 days', async () => {
    const res = await request(app).get('/api/availability?from=2099-01-01&to=2099-06-01');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Date range can be at most 62 days');
  });
});

describe('Availability with bookings', () => {
  let service;
  let user;
  beforeEach(async () => {
    service = await Service.create({ name: 'Haircut', durationMinutes: 30, price: 25 });
    ({ user } = await createUserWithToken('user'));
    await Availability.create({ date: FUTURE, slots: ['09:00', '09:30', '10:00'] });
    await Appointment.create({ user: user._id, service: service._id, date: FUTURE, time: '09:30' });
    // A cancelled booking must not block its slot
    await Appointment.create({ user: user._id, service: service._id, date: FUTURE, time: '10:00', status: 'cancelled' });
  });

  it('GET /:date shows booked and available slots', async () => {
    const res = await request(app).get(`/api/availability/${FUTURE}`);

    expect(res.body.data.day).toMatchObject({
      slots: ['09:00', '09:30', '10:00'],
      bookedSlots: ['09:30'],
      availableSlots: ['09:00', '10:00'],
    });
  });

  it('GET range shows booked and available slots per day', async () => {
    const res = await request(app).get('/api/availability?from=2099-01-01&to=2099-01-31');
    expect(res.body.data.days[0]).toMatchObject({ bookedSlots: ['09:30'], availableSlots: ['09:00', '10:00'] });
  });

  it('a past day has no available slots', async () => {
    await Availability.collection.insertOne({ date: '2000-01-01', slots: ['09:00'] });
    const res = await request(app).get('/api/availability/2000-01-01');
    expect(res.body.data.day.availableSlots).toEqual([]);
  });

  it('PUT returns 409 when removing a booked slot', async () => {
    const res = await request(app).put(`/api/availability/${FUTURE}`).set(adminAuth).send({ slots: ['09:00'] });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Cannot remove booked slots: 09:30');
  });

  it('PUT can remove slots that are not booked', async () => {
    const res = await request(app).put(`/api/availability/${FUTURE}`).set(adminAuth).send({ slots: ['09:30'] });

    expect(res.status).toBe(200);
    expect(res.body.data.day.slots).toEqual(['09:30']);
  });

  it('DELETE returns 409 when the day has bookings', async () => {
    const res = await request(app).delete(`/api/availability/${FUTURE}`).set(adminAuth);

    expect(res.status).toBe(409);
    expect(await Availability.countDocuments({ date: FUTURE })).toBe(1);
  });
});

describe('DELETE /api/availability/:date', () => {
  it('lets an admin delete a day', async () => {
    await Availability.create({ date: FUTURE, slots: ['09:00'] });
    const res = await request(app).delete(`/api/availability/${FUTURE}`).set(adminAuth);

    expect(res.status).toBe(200);
    expect(await Availability.countDocuments()).toBe(0);
  });

  it('returns 404 if the day has no availability', async () => {
    const res = await request(app).delete(`/api/availability/${FUTURE}`).set(adminAuth);
    expect(res.status).toBe(404);
  });

  it('returns 403 for a normal user', async () => {
    await Availability.create({ date: FUTURE, slots: ['09:00'] });
    const res = await request(app).delete(`/api/availability/${FUTURE}`).set(userAuth);
    expect(res.status).toBe(403);
  });
});
