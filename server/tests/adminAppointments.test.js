const request = require('supertest');
const app = require('../src/app');
const Appointment = require('../src/models/Appointment');
const Service = require('../src/models/Service');
const db = require('./setup/db');
const { createUserWithToken } = require('./setup/users');
const { nowInBusinessTz } = require('../src/utils/dateTime');

beforeAll(async () => {
  await db.connect();
  await Appointment.init();
});
afterEach(db.clear);
afterAll(db.close);

let admin;
let alice;
let bob;
let haircut;
let massage;
beforeEach(async () => {
  admin = await createUserWithToken('admin');
  alice = await createUserWithToken('user');
  bob = await createUserWithToken('user');
  haircut = await Service.create({ name: 'Haircut', durationMinutes: 30, price: 25 });
  massage = await Service.create({ name: 'Massage', durationMinutes: 60, price: 50 });
});

// Insert directly so we can create past appointments and any status
const make = (who, service, date, time, status = 'booked') =>
  Appointment.create({ user: who.user._id, service: service._id, date, time, status });

describe('GET /api/appointments (admin list)', () => {
  beforeEach(async () => {
    await make(alice, haircut, '2099-01-10', '09:00');
    await make(alice, massage, '2099-01-11', '10:00', 'cancelled');
    await make(bob, haircut, '2099-01-12', '11:00');
    await make(bob, massage, '2000-01-01', '09:00', 'completed');
  });

  it('returns all users\' appointments with user and service populated, newest first', async () => {
    const res = await request(app).get('/api/appointments').set(admin.auth);

    expect(res.status).toBe(200);
    expect(res.body.data.appointments.map((a) => a.date)).toEqual(['2099-01-12', '2099-01-11', '2099-01-10', '2000-01-01']);
    expect(res.body.data.appointments[0].user).toMatchObject({ name: bob.user.name, email: bob.user.email });
    expect(res.body.data.appointments[0].user.password).toBeUndefined();
    expect(res.body.data.appointments[0].service).toMatchObject({ name: 'Haircut', price: 25 });
    expect(res.body.data.pagination.total).toBe(4);
  });

  it('returns 403 for a normal user and 401 without a token', async () => {
    expect((await request(app).get('/api/appointments').set(alice.auth)).status).toBe(403);
    expect((await request(app).get('/api/appointments')).status).toBe(401);
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/appointments?status=booked').set(admin.auth);
    expect(res.body.data.appointments.map((a) => a.date)).toEqual(['2099-01-12', '2099-01-10']);
  });

  it('filters by exact date', async () => {
    const res = await request(app).get('/api/appointments?date=2099-01-11').set(admin.auth);
    expect(res.body.data.appointments).toHaveLength(1);
  });

  it('filters by date range and sorts ascending', async () => {
    const res = await request(app).get('/api/appointments?from=2099-01-10&to=2099-01-11&sort=date').set(admin.auth);
    expect(res.body.data.appointments.map((a) => a.date)).toEqual(['2099-01-10', '2099-01-11']);
  });

  it('searches by customer email and by service name', async () => {
    const byEmail = await request(app).get(`/api/appointments?search=${alice.user.email}`).set(admin.auth);
    const byService = await request(app).get('/api/appointments?search=massage').set(admin.auth);

    expect(byEmail.body.data.appointments).toHaveLength(2);
    expect(byService.body.data.appointments.map((a) => a.service.name)).toEqual(['Massage', 'Massage']);
  });

  it('paginates', async () => {
    const res = await request(app).get('/api/appointments?page=2&limit=3').set(admin.auth);

    expect(res.body.data.appointments).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it('returns 400 for invalid filters', async () => {
    const badStatus = await request(app).get('/api/appointments?status=done').set(admin.auth);
    const both = await request(app).get('/api/appointments?date=2099-01-10&from=2099-01-01').set(admin.auth);

    expect(badStatus.status).toBe(400);
    expect(both.status).toBe(400);
    expect(both.body.details[0].message).toBe('Use either date or from/to, not both');
  });
});

describe('PATCH /api/appointments/:id/status', () => {
  const setStatus = (who, id, status) =>
    request(app).patch(`/api/appointments/${id}/status`).set(who.auth).send({ status });

  it('marks a past booked appointment completed', async () => {
    const appt = await make(alice, haircut, '2000-01-01', '09:00');
    const res = await setStatus(admin, appt._id, 'completed');

    expect(res.status).toBe(200);
    expect(res.body.data.appointment).toMatchObject({ status: 'completed', user: { name: alice.user.name } });
  });

  it('marks a past booked appointment no-show', async () => {
    const appt = await make(alice, haircut, '2000-01-01', '09:00');
    const res = await setStatus(admin, appt._id, 'no-show');

    expect(res.status).toBe(200);
    expect(res.body.data.appointment.status).toBe('no-show');
  });

  it('returns 400 for an upcoming appointment', async () => {
    const appt = await make(alice, haircut, '2099-01-10', '09:00');
    const res = await setStatus(admin, appt._id, 'completed');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot mark an upcoming appointment as completed');
  });

  it('returns 400 when the appointment is not booked', async () => {
    const appt = await make(alice, haircut, '2000-01-01', '09:00', 'cancelled');
    const res = await setStatus(admin, appt._id, 'completed');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Cannot change an appointment that is cancelled');
  });

  it('returns 400 for a status other than completed/no-show', async () => {
    const appt = await make(alice, haircut, '2000-01-01', '09:00');
    const res = await setStatus(admin, appt._id, 'booked');
    expect(res.status).toBe(400);
  });

  it('returns 403 for a normal user', async () => {
    const appt = await make(alice, haircut, '2000-01-01', '09:00');
    const res = await setStatus(alice, appt._id, 'completed');
    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown appointment', async () => {
    const res = await setStatus(admin, '507f1f77bcf86cd799439011', 'completed');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/appointments/stats', () => {
  it('returns counts by status, today/upcoming counts and completed revenue', async () => {
    const today = nowInBusinessTz().date;
    await make(alice, haircut, '2000-01-01', '09:00', 'completed'); // 25
    await make(bob, massage, '2000-01-02', '09:00', 'completed'); // 50
    await make(bob, haircut, '2000-01-03', '09:00', 'no-show');
    await make(alice, haircut, '2099-01-10', '09:00');
    await make(alice, massage, '2099-01-11', '09:00', 'cancelled');
    await make(bob, haircut, today, '23:59');

    const res = await request(app).get('/api/appointments/stats').set(admin.auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      total: 6,
      byStatus: { booked: 2, cancelled: 1, completed: 2, 'no-show': 1 },
      todayBooked: 1,
      completedRevenue: 75,
    });
    // 2099 booking is upcoming; today's 23:59 is too unless the test runs at 23:59 UTC
    expect(res.body.data.upcomingBooked).toBeGreaterThanOrEqual(1);
  });

  it('returns zeros when there are no appointments', async () => {
    const res = await request(app).get('/api/appointments/stats').set(admin.auth);
    expect(res.body.data).toEqual({
      total: 0,
      byStatus: { booked: 0, cancelled: 0, completed: 0, 'no-show': 0 },
      todayBooked: 0,
      upcomingBooked: 0,
      completedRevenue: 0,
    });
  });

  it('returns 403 for a normal user', async () => {
    expect((await request(app).get('/api/appointments/stats').set(alice.auth)).status).toBe(403);
  });
});
