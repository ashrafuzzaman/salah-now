import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as adhan from 'adhan';
import { computeTimes, getSchedule, formatDuration, formatClock } from '../src/common/praytimes.js';

const KL = { lat: 3.139, lng: 101.6869, tz: 8 };
const hm = (h) => Math.round(h * 60); // fractional hours -> minutes of day

test('KL times are ordered and Dhuhr is near solar noon', () => {
  const t = computeTimes(2026, 9, 26, { ...KL, method: 'JAKIM', asrFactor: 1 });
  const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha];
  for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1]);
  assert.ok(hm(t.dhuhr) > 13 * 60 && hm(t.dhuhr) < 13 * 60 + 10, `dhuhr ${t.dhuhr}`);
});

test('matches the adhan library within 2 minutes (several cities/methods)', () => {
  const cases = [
    { name: 'Kuala Lumpur', lat: 3.139, lng: 101.6869, tz: 8, method: 'JAKIM', params: () => { const p = adhan.CalculationMethod.Other(); p.fajrAngle = 20; p.ishaAngle = 18; return p; } },
    { name: 'Dhaka', lat: 23.8103, lng: 90.4125, tz: 6, method: 'KARACHI', params: () => adhan.CalculationMethod.Karachi() },
    { name: 'London', lat: 51.5074, lng: -0.1278, tz: 1, method: 'MWL', params: () => adhan.CalculationMethod.MuslimWorldLeague() },
    { name: 'Makkah', lat: 21.4225, lng: 39.8262, tz: 3, method: 'MAKKAH', params: () => adhan.CalculationMethod.UmmAlQura() }
  ];
  for (const c of cases) {
    for (const asrFactor of [1, 2]) {
      const date = new Date(Date.UTC(2026, 8, 26, 12));
      const p = c.params();
      p.madhab = asrFactor === 2 ? adhan.Madhab.Hanafi : adhan.Madhab.Shafi;
      const ref = new adhan.PrayerTimes(new adhan.Coordinates(c.lat, c.lng), date, p);
      const ours = computeTimes(2026, 9, 26, { lat: c.lat, lng: c.lng, tz: c.tz, method: c.method, asrFactor });
      for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        const r = ref[k];
        const refMin = (r.getUTCHours() + c.tz) * 60 + r.getUTCMinutes() + r.getUTCSeconds() / 60;
        const diff = Math.abs(((hm(ours[k]) - refMin) % 1440 + 1440 + 720) % 1440 - 720);
        assert.ok(diff <= 2, `${c.name} ${k} asr=${asrFactor}: ours ${hm(ours[k])} ref ${refMin.toFixed(1)}`);
      }
    }
  }
});

const cfg = { lat: KL.lat, lng: KL.lng, tz: 8, method: 'JAKIM', asrFactor: 1 };
const at = (h, m) => new Date(2026, 8, 26, h, m); // local time; tz pinned via cfg.tz

test('schedule: before Fajr is still Isha, ending at Fajr', () => {
  const s = getSchedule(at(3, 0), cfg);
  assert.equal(s.current, 'isha');
  assert.equal(s.next, 'fajr');
  assert.equal(s.currentEnd, s.nextStart);
});

test('schedule: mid-morning has no fard prayer, next is Dhuhr', () => {
  const s = getSchedule(at(10, 0), cfg);
  assert.equal(s.current, null);
  assert.equal(s.next, 'dhuhr');
});

test('schedule: afternoon Asr window ends at Maghrib', () => {
  const s = getSchedule(at(17, 0), cfg);
  assert.equal(s.current, 'asr');
  assert.equal(s.next, 'maghrib');
  assert.equal(s.currentEnd, s.today.maghrib);
});

test('schedule: late night Isha rolls over to tomorrow Fajr', () => {
  const s = getSchedule(at(23, 30), cfg);
  assert.equal(s.current, 'isha');
  assert.equal(s.next, 'fajr');
  assert.ok(s.nextStart > s.today.isha + 5 * 3600000);
});

test('formatting', () => {
  assert.equal(formatDuration(3723000), '1:02:03');
  assert.equal(formatDuration(65000), '1:05');
  assert.equal(formatClock(new Date(2026, 0, 1, 13, 5).getTime(), true), '1:05pm');
  assert.equal(formatClock(new Date(2026, 0, 1, 0, 7).getTime(), false), '00:07');
});
