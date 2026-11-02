const { isValidDate, isValidTime, addDays, daysBetween, nowInBusinessTz } = require('../src/utils/dateTime');

describe('dateTime utils', () => {
  it('accepts real dates and rejects impossible or badly formatted ones', () => {
    expect(isValidDate('2026-11-20')).toBe(true);
    expect(isValidDate('2028-02-29')).toBe(true); // leap year
    expect(isValidDate('2027-02-29')).toBe(false); // not a leap year
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-5')).toBe(false);
    expect(isValidDate(20261120)).toBe(false);
  });

  it('accepts HH:mm times only', () => {
    expect(isValidTime('09:00')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('9:00')).toBe(false);
    expect(isValidTime('09:60')).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-11-01', '2026-12-01')).toBe(30);
  });

  it('gives date and time in the business timezone (UTC in tests)', () => {
    expect(nowInBusinessTz(new Date('2026-11-20T23:45:00Z'))).toEqual({ date: '2026-11-20', time: '23:45' });
  });
});
