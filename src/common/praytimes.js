// Offline prayer-time calculation (astronomical method, adapted from PrayTimes.org).
// Written in plain ES5-style JS: the lite-wearable JS engine rejects some modern
// syntax (destructuring, spread, classes), so keep it that way.

export var METHODS = {
  JAKIM: { label: 'JAKIM (Malaysia)', fajr: 20, isha: 18 },
  MUIS: { label: 'MUIS (Singapore)', fajr: 20, isha: 18 },
  KEMENAG: { label: 'Kemenag (Indonesia)', fajr: 20, isha: 18 },
  KARACHI: { label: 'Karachi (BD/PK/IN)', fajr: 18, isha: 18 },
  MWL: { label: 'Muslim World League', fajr: 18, isha: 17 },
  ISNA: { label: 'ISNA (N. America)', fajr: 15, isha: 15 },
  EGYPT: { label: 'Egyptian Authority', fajr: 19.5, isha: 17.5 },
  MAKKAH: { label: 'Umm al-Qura (Makkah)', fajr: 18.5, ishaMinutes: 90 },
  DIYANET: { label: 'Diyanet (Turkey)', fajr: 18, isha: 17 }
};

export var METHOD_KEYS = ['JAKIM', 'MUIS', 'KEMENAG', 'KARACHI', 'MWL', 'ISNA', 'EGYPT', 'MAKKAH', 'DIYANET'];

var RISE_SET_ANGLE = 0.833;

function dtr(d) { return d * Math.PI / 180; }
function rtd(r) { return r * 180 / Math.PI; }
function sin(d) { return Math.sin(dtr(d)); }
function cos(d) { return Math.cos(dtr(d)); }
function tan(d) { return Math.tan(dtr(d)); }
function arcsin(x) { return rtd(Math.asin(x)); }
function arccos(x) { return rtd(Math.acos(x)); }
function arccot(x) { return rtd(Math.atan(1 / x)); }
function arctan2(y, x) { return rtd(Math.atan2(y, x)); }
function fix(a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; }
function fixAngle(a) { return fix(a, 360); }
function fixHour(a) { return fix(a, 24); }

function julian(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  var A = Math.floor(year / 100);
  var B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd) {
  var D = jd - 2451545.0;
  var g = fixAngle(357.529 + 0.98560028 * D);
  var q = fixAngle(280.459 + 0.98564736 * D);
  var L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
  var e = 23.439 - 0.00000036 * D;
  var RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - fixHour(RA) };
}

// Returns prayer times for a calendar date as fractional local hours (e.g. 13.08).
// opts: { lat, lng, tz (hours offset from UTC), method (key of METHODS), asrFactor (1 Shafi'i, 2 Hanafi) }
export function computeTimes(year, month, day, opts) {
  var lat = opts.lat;
  var lng = opts.lng;
  var method = METHODS[opts.method] || METHODS.MWL;
  var asrFactor = opts.asrFactor || 1;
  var jDate = julian(year, month, day) - lng / (15 * 24);

  function midDay(t) {
    return fixHour(12 - sunPosition(jDate + t).equation);
  }
  function sunAngleTime(angle, t, ccw) {
    var decl = sunPosition(jDate + t).declination;
    var noon = midDay(t);
    var x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    if (x < -1 || x > 1) { return NaN; }
    var h = arccos(x) / 15;
    return noon + (ccw ? -h : h);
  }
  function asrTime(t) {
    var decl = sunPosition(jDate + t).declination;
    return sunAngleTime(-arccot(asrFactor + tan(Math.abs(lat - decl))), t, false);
  }

  // Two refinement passes: each pass uses the previous estimate as the time of day.
  var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (var i = 0; i < 2; i++) {
    t = {
      fajr: sunAngleTime(method.fajr, (isNaN(t.fajr) ? 5 : t.fajr) / 24, true),
      sunrise: sunAngleTime(RISE_SET_ANGLE, t.sunrise / 24, true),
      dhuhr: midDay(t.dhuhr / 24),
      asr: asrTime(t.asr / 24),
      maghrib: sunAngleTime(RISE_SET_ANGLE, t.maghrib / 24, false),
      isha: method.ishaMinutes ? t.maghrib : sunAngleTime(method.isha, (isNaN(t.isha) ? 18 : t.isha) / 24, false)
    };
  }

  var shift = opts.tz - lng / 15;
  var out = {
    fajr: t.fajr + shift,
    sunrise: t.sunrise + shift,
    dhuhr: t.dhuhr + shift,
    asr: t.asr + shift,
    maghrib: t.maghrib + shift,
    isha: t.isha + shift
  };
  if (method.ishaMinutes) { out.isha = out.maghrib + method.ishaMinutes / 60; }

  // High latitudes: twilight angle never reached -> "angle-based" night portion.
  var night = 24 - (out.maghrib - out.sunrise);
  if (isNaN(out.fajr)) { out.fajr = out.sunrise - (method.fajr / 60) * night; }
  if (isNaN(out.isha)) { out.isha = out.maghrib + ((method.isha || 18) / 60) * night; }
  return out;
}

export var PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
export var NAMES = { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };

function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 0, 0, 0, 0); }

// Prayer times for the local day containing `date`, as epoch ms.
export function timesForDay(date, cfg) {
  var start = dayStart(date);
  var tz = cfg.tz !== undefined && cfg.tz !== null ? cfg.tz : -start.getTimezoneOffset() / 60;
  var h = computeTimes(start.getFullYear(), start.getMonth() + 1, start.getDate(), {
    lat: cfg.lat, lng: cfg.lng, tz: tz, method: cfg.method, asrFactor: cfg.asrFactor
  });
  var base = start.getTime();
  var res = {};
  for (var k in h) { res[k] = base + Math.round(h[k] * 3600000); }
  return res;
}

// Works out which prayer window `now` is in, when it ends, and the next prayer.
// A window runs from a prayer's start to the next boundary:
//   Fajr -> Sunrise, Dhuhr -> Asr, Asr -> Maghrib, Maghrib -> Isha, Isha -> next Fajr.
// Between Sunrise and Dhuhr there is no obligatory prayer (current = null).
export function getSchedule(now, cfg) {
  var nowMs = now.getTime();
  var y = timesForDay(addDays(now, -1), cfg);
  var t = timesForDay(now, cfg);
  var n = timesForDay(addDays(now, 1), cfg);

  var periods = [
    { key: 'isha', start: y.isha, end: t.fajr },
    { key: 'fajr', start: t.fajr, end: t.sunrise },
    { key: null, start: t.sunrise, end: t.dhuhr },
    { key: 'dhuhr', start: t.dhuhr, end: t.asr },
    { key: 'asr', start: t.asr, end: t.maghrib },
    { key: 'maghrib', start: t.maghrib, end: t.isha },
    { key: 'isha', start: t.isha, end: n.fajr },
    { key: 'fajr', start: n.fajr, end: n.sunrise }
  ];

  var idx = 0;
  for (var i = 0; i < periods.length; i++) {
    if (nowMs >= periods[i].start && nowMs < periods[i].end) { idx = i; break; }
  }
  var cur = periods[idx];
  var next = null;
  for (var j = idx + 1; j < periods.length; j++) {
    if (periods[j].key) { next = periods[j]; break; }
  }

  return {
    current: cur.key,
    currentStart: cur.start,
    currentEnd: cur.end,
    remainingMs: cur.end - nowMs,
    progress: Math.max(0, Math.min(100, Math.round((nowMs - cur.start) * 100 / (cur.end - cur.start)))),
    next: next.key,
    nextStart: next.start,
    untilNextMs: next.start - nowMs,
    today: t,
    validUntil: cur.end
  };
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

export function formatClock(ms, use12h) {
  var d = new Date(ms);
  var h = d.getHours();
  var m = pad(d.getMinutes());
  if (!use12h) { return pad(h) + ':' + m; }
  var suffix = h < 12 ? 'am' : 'pm';
  h = h % 12;
  if (h === 0) { h = 12; }
  return h + ':' + m + suffix;
}

export function formatDuration(ms) {
  if (ms < 0) { ms = 0; }
  var s = Math.floor(ms / 1000);
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  return (h > 0 ? h + ':' + pad(m) : '' + m) + ':' + pad(sec);
}
