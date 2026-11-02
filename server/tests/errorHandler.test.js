// Unit tests for the central error handler: a tiny app whose routes throw
// each kind of error, so we can check the JSON response for every case.
const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const ApiError = require('../src/utils/ApiError');
const errorHandler = require('../src/middleware/errorHandler');

function appThatThrows(error) {
  const app = express();
  app.get('/', async () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('uses the status and message of an ApiError', async () => {
    const res = await request(appThatThrows(new ApiError(403, 'Admins only'))).get('/');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Admins only' });
  });

  it('turns a Mongoose ValidationError into 400 with field details', async () => {
    const Model = mongoose.model('Temp', new mongoose.Schema({ name: { type: String, required: true } }));
    const validationError = await new Model({}).validate().catch((err) => err);

    const res = await request(appThatThrows(validationError)).get('/');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.details).toEqual([{ field: 'name', message: 'Path `name` is required.' }]);
  });

  it('turns a CastError (bad ObjectId) into 400', async () => {
    const castError = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
    const res = await request(appThatThrows(castError)).get('/');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid value for _id');
  });

  it('turns a duplicate key error (11000) into 409', async () => {
    const dupError = Object.assign(new Error('E11000 duplicate key'), {
      code: 11000,
      keyValue: { email: 'a@b.com' },
    });
    const res = await request(appThatThrows(dupError)).get('/');
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Duplicate value for: email');
  });

  it('hides the real message and stack of unexpected errors (500)', async () => {
    const res = await request(appThatThrows(new Error('DB password is hunter2'))).get('/');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: 'Internal server error' });
  });
});
