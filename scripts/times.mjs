// Print today's schedule from the same code the watch runs.
// Usage: npm run times -- [lat] [lng] [METHOD] [asrFactor]
import { getSchedule, formatClock, formatDuration, NAMES } from '../src/common/praytimes.js';

const [lat = '3.139', lng = '101.6869', method = 'JAKIM', asr = '1'] = process.argv.slice(2);
const cfg = { lat: +lat, lng: +lng, method, asrFactor: +asr };
const s = getSchedule(new Date(), cfg);

console.log(`Location ${cfg.lat}, ${cfg.lng}  method ${method}  asr x${cfg.asrFactor}\n`);
for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) {
  console.log(`  ${NAMES[k].padEnd(8)} ${formatClock(s.today[k])}`);
}
console.log(`\nNow:  ${s.current ? NAMES[s.current] : 'no fard prayer (Duha)'}, ends ${formatClock(s.currentEnd)} (in ${formatDuration(s.remainingMs)})`);
console.log(`Next: ${NAMES[s.next]} at ${formatClock(s.nextStart)} (in ${formatDuration(s.untilNextMs)})`);
