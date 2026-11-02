const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/models/Appointment');
const Availability = require('../src/models/Availability');
const Service = require('../src/models/Service');
const db = require('./setup/db');
const { createUserWithToken } = require('./setup/users');

beforeAll(async () => {
  await db.connect();
  await Appointment.init(); // build the partial unique index before the double-booking tests
});
afterEach(db.clear);
afterAll(db.close);

const FUTURE = '2099-01-15';

let alice;
let bob;
let service;
let booking;
beforeEach(async () => {
  alice = await createUserWithToken('user');
  bob = await createUserWithToken('user');
  service = await Service.create({ name: 'Haircut', durationMinutes: 30, price: 25 });
  await Availability.create({ date: FUTURE, slots: ['09:00', '09:30', '10:00'] });
  booking = { serviceId: service._id.toString(), date: FUTURE, time: '09:00' };
});

const book = (who, body = booking) => request(app).post('/api/appointments').set(who.auth).send(body);

describe('POST /api/appointments', () => {
  it('books a free slot (201) with service details populated', async () => {
    const res = await book(alice, { ...booking, notes: 'First visit' });

    expect(res.status).toBe(201);
    expect(res.body.data.appointment).toMatchObject({
      user: alice.user._id.toString(),
      date: FUTURE,
      time: '09:00',
      status: 'booked',
      notes: 'First visit',
      service: { name: 'Haircut', durationMinutes: 30, price: 25 },
    });
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/appointments').send(booking);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing or invalid fields', async () => {
    const res = await book(alice, { serviceId: 'abc', date: '2099-13-01' });

    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toEqual(expect.arrayContaining(['serviceId', 'date', 'time']));
  });

  it('ignores a "user" field in the body (cannot book for someone else)', async () => {
    const res = await book(alice, { ...booking, user: bob.user._id.toString() });
    expect(res.body.data.appointment.user).toBe(alice.user._id.toString());
  });

  it('returns 404 for an unknown or inactive service', async () => {
    const unknown = await book(alice, { ...booking, serviceId: '507f1f77bcf86cd799439011' });
    await Service.updateOne({ _id: service._id }, { isActive: false });
    const inactive = await book(alice);

    expect(unknown.status).toBe(404);
    expect(inactive.status).toBe(404);
  });

  it('returns 400 for a time the admin has not opened', async () => {
    const res = await book(alice, { ...booking, time: '11:00' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(`11:00 on ${FUTURE} is not an available slot`);
  });

  it('returns 400 for a day with no availability', async () => {
    const res = await book(alice, { ...booking, date: '2099-01-16' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a past date', async () => {
    const res = await book(alice, { ...booking, date: '2000-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot book a time in the past');
  });

  it('returns 409 when the slot is already booked', async () => {
    await book(alice);
    const res = await book(bob);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('This slot has already been booked. Please choose another time.');
  });

  it('allows only ONE of two simultaneous bookings for the same slot (race condition)', async () => {
    // Fire both requests at the same time, without waiting for the first
    const responses = await Promise.all([book(alice), book(bob)]);
    const statuses = responses.map((r) => r.status).sort();

    expect(statuses).toEqual([201, 409]);
    expect(await Appointment.countDocuments({ date: FUTURE, time: '09:00', status: 'booked' })).toBe(1);
  });

  it('allows ten simultaneous requests to produce exactly one booking', async () => {
    const users = await Promise.all(Array.from({ length: 10 }, () => createUserWithToken('user')));
    const responses = await Promise.all(users.map((u) => book(u)));

    expect(responses.filter((r) => r.status === 201)).toHaveLength(1);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(9);
  });

  it('allows different slots on the same day', async () => {
    expect((await book(alice)).status).toBe(201);
    expect((await book(bob, { ...booking, time: '09:30' })).status).toBe(201);
  });

  it('lets someone else book a slot after it was cancelled', async () => {
    const first = await book(alice);
    await request(app).patch(`/api/appointments/${first.body.data.appointment._id}/cancel`).set(alice.auth);
    const res = await book(bob);

    expect(res.status).toBe(201);
  });
});

describe('GET /api/appointments/me', () => {
  beforeEach(async () => {
    // Past appointments can't be booked through the API, so insert them directly
    await Appointment.create([
      { user: alice.user._id, service: service._id, date: '2000-01-01', time: '09:00', status: 'completed' },
      { user: alice.user._id, service: service._id, date: '2000-02-01', time: '09:00', status: 'no-show' },
      { user: alice.user._id, service: service._id, date: FUTURE, time: '10:00' },
      { user: alice.user._id, service: service._id, date: FUTURE, time: '09:00' },
      { user: bob.user._id, service: service._id, date: FUTURE, time: '09:30' },
    ]);
  });

  it('returns only my upcoming appointments, soonest first, with service details', async () => {
    const res = await request(app).get('/api/appointments/me').set(alice.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.appointments.map((a) => a.time)).toEqual(['09:00', '10:00']);
    expect(res.body.data.appointments[0].service.name).toBe('Haircut');
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('returns my past appointments, most recent first', async () => {
    const res = await request(app).get('/api/appointments/me?type=past').set(alice.auth);
    expect(res.body.data.appointments.map((a) => a.date)).toEqual(['2000-02-01', '2000-01-01']);
  });

  it('paginates', async () => {
    const res = await request(app).get('/api/appointments/me?limit=1&page=2').set(alice.auth);

    expect(res.body.data.appointments.map((a) => a.time)).toEqual(['10:00']);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });

  it('returns 400 for an invalid type', async () => {
    const res = await request(app).get('/api/appointments/me?type=all').set(alice.auth);
    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    expect((await request(app).get('/api/appointments/me')).status).toBe(401);
  });
});

describe('PATCH /api/appointments/:id/cancel', () => {
  const cancel = (who, id) => request(app).patch(`/api/appointments/${id}/cancel`).set(who.auth);

  it('lets the owner cancel an upcoming appointment', async () => {
    const { body } = await book(alice);
    const res = await cancel(alice, body.data.appointment._id);

    expect(res.status).toBe(200);
    expect(res.body.data.appointment.status).toBe('cancelled');
    expect(res.body.data.appointment.cancelledAt).toBeDefined();
  });

  it("returns 403 when cancelling someone else's appointment", async () => {
    const { body } = await book(alice);
    const res = await cancel(bob, body.data.appointment._id);

    expect(res.status).toBe(403);
    expect((await Appointment.findById(body.data.appointment._id)).status).toBe('booked');
  });

  it('returns 400 when the appointment is already cancelled', async () => {
    const { body } = await book(alice);
    await cancel(alice, body.data.appointment._id);
    const res = await cancel(alice, body.data.appointment._id);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot cancel an appointment that is cancelled');
  });

  it('returns 400 for a past appointment', async () => {
    const past = await Appointment.create({ user: alice.user._id, service: service._id, date: '2000-01-01', time: '09:00' });
    const res = await cancel(alice, past._id);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot cancel an appointment that has already started');
  });

  it('returns 404 for an unknown id and 400 for a malformed id', async () => {
    expect((await cancel(alice, '507f1f77bcf86cd799439011')).status).toBe(404);
    expect((await cancel(alice, 'not-an-id')).status).toBe(400);
  });
});
