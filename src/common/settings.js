// Persisted user settings. Uses @system.storage on the watch; falls back to
// in-memory defaults if storage is unavailable.
import storage from '@system.storage';

var KEY = 'salahnow.settings';

// Default: Kuala Lumpur, JAKIM, Shafi'i Asr. Replaced by GPS once the user taps "Location".
export var DEFAULTS = {
  lat: 3.1390,
  lng: 101.6869,
  place: 'Kuala Lumpur',
  method: 'JAKIM',
  asrFactor: 1,
  use12h: false
};

var cache = null;

function copy(src) {
  var out = {};
  for (var k in DEFAULTS) { out[k] = src && src[k] !== undefined ? src[k] : DEFAULTS[k]; }
  return out;
}

export function loadSettings(cb) {
  if (cache) { cb(cache); return; }
  try {
    storage.get({
      key: KEY,
      success: function (data) {
        var parsed = null;
        try { parsed = data ? JSON.parse(data) : null; } catch (e) { parsed = null; }
        cache = copy(parsed);
        cb(cache);
      },
      fail: function () { cache = copy(null); cb(cache); }
    });
  } catch (e) {
    cache = copy(null);
    cb(cache);
  }
}

export function saveSettings(s) {
  cache = copy(s);
  try {
    storage.set({ key: KEY, value: JSON.stringify(cache) });
  } catch (e) {
    // Storage unavailable (e.g. previewer); keep in-memory copy.
  }
}
