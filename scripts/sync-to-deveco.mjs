// Copy src/ into a DevEco Studio "Lite Wearable" JS project and register the pages
// and location permission in its config.json.
// Usage: npm run sync -- /path/to/DevEcoProject
import fs from 'node:fs';
import path from 'node:path';

const project = process.argv[2];
if (!project) {
  console.error('Usage: npm run sync -- /path/to/DevEcoProject');
  process.exit(1);
}
const mainDir = path.join(project, 'entry', 'src', 'main');
const jsRoot = path.join(mainDir, 'js');
if (!fs.existsSync(jsRoot)) {
  console.error(`No ${jsRoot} — create a Lite Wearable JS project in DevEco Studio first.`);
  process.exit(1);
}
// Template names the ability folder "MainAbility" (newer) or "default" (older).
const ability = fs.readdirSync(jsRoot).find((d) => fs.existsSync(path.join(jsRoot, d, 'app.js')));
if (!ability) {
  console.error(`No ability folder with app.js under ${jsRoot}`);
  process.exit(1);
}
const dest = path.join(jsRoot, ability);
const src = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
fs.cpSync(src, dest, { recursive: true });
console.log(`Copied src/ -> ${dest}`);

const configPath = path.join(mainDir, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const mod = config.module;
const js = mod.js.find((j) => j.name === ability) || mod.js[0];
js.pages = ['pages/index/index', 'pages/settings/settings'];
mod.reqPermissions = mod.reqPermissions || [];
if (!mod.reqPermissions.some((p) => p.name === 'ohos.permission.LOCATION')) {
  mod.reqPermissions.push({ name: 'ohos.permission.LOCATION', reason: 'Calculate prayer times for your location' });
}
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
console.log(`Updated ${configPath} (pages + LOCATION permission)`);
