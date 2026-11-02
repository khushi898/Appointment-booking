const Service = require('../src/models/Service');
const services = require('../src/scripts/data/services');

describe('seed data: clinic services', () => {
  it('has 20 services', () => {
    expect(services).toHaveLength(20);
  });

  it('has no duplicate names (ignoring case)', () => {
    const names = services.map((s) => s.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('passes the Service schema validation for every entry', async () => {
    const errors = await Promise.all(services.map((s) => new Service(s).validate().catch((err) => err)));
    expect(errors.filter(Boolean)).toEqual([]);
  });
});
