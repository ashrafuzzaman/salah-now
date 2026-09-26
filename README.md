# Salah Now

A prayer-time app for Huawei watches and bands (HarmonyOS lite wearables such as the Watch Fit, Watch GT and Watch D). Built and sized first for the Watch Fit 5 Pro. It shows:

- the **current prayer** and a live countdown until its time ends
- the **next prayer** and when it starts
- all of today's times (tap the screen), with settings (long-press)

Times are calculated **offline on the watch** from GPS coordinates. Huawei's Fit, GT and similar
watches are HarmonyOS *lite wearables*: they have no general network access and run JS/HML/CSS
apps, not ArkTS. Pick every lite-wearable model you want to support when you create the app in
AppGallery Connect. Keep "Huawei" out of the app name, but you can list compatible devices in the
store description.

| Gesture | Action |
|---|---|
| Tap | Switch between the countdown and the list of today's times |
| Long-press | Open settings (method, Asr madhab, 12/24h, update GPS location) |
| Swipe right | Exit (Settings: go back) |

Prayer windows: Fajr → Sunrise, Dhuhr → Asr, Asr → Maghrib, Maghrib → Isha, Isha → next Fajr.
Between Sunrise and Dhuhr the watch shows "No fard prayer" with a countdown to Dhuhr.

## Layout

```
src/                     <- copied into the DevEco project's entry/src/main/js/<Ability>/
  app.js
  common/praytimes.js    calculation + "current/next" logic (pure JS, unit-tested)
  common/settings.js     persisted settings (@system.storage)
  pages/index/           countdown + today's list
  pages/settings/        method / madhab / clock / GPS
test/                    node tests (cross-checked against the `adhan` library)
scripts/times.mjs        print today's schedule from the terminal
scripts/sync-to-deveco.mjs  push src/ into a DevEco project and patch config.json
```

## 1. Check the logic without a watch

```bash
npm install
npm test                                  # 7 tests, incl. comparison vs adhan (±2 min)
npm run times                             # Kuala Lumpur, JAKIM
npm run times -- 23.8103 90.4125 KARACHI 2   # Dhaka, Hanafi Asr
```

Methods: `JAKIM MUIS KEMENAG KARACHI MWL ISNA EGYPT MAKKAH DIYANET`.

### See the watch UI in your browser

```bash
npm run preview        # opens http://localhost:5173
```

This runs the real `src/` pages inside a 408×480 watch frame. The `.hml` templates are
rendered by a small interpreter, and `@system.*` is swapped for browser stand-ins (storage uses
localStorage; geolocation uses the browser's location). Click to tap, hold to long-press, and
drag right to swipe. The side panel lets you jump the clock to any time, so you can see each
prayer window. Edits to `src/` show up after a reload.

This is a quick approximation. Before release, check the final look in the DevEco
Previewer or on the watch itself.

## 2. One-time toolchain setup

1. **Huawei developer account**: register at <https://developer.huawei.com/consumer/en/> and
   complete identity verification (individual is fine). Verification can take 1–3 working days,
   so start this first. You need it for device debugging and for AppGallery.
2. **DevEco Studio**: download the macOS (Apple Silicon/x64) build from
   <https://developer.huawei.com/consumer/en/deveco-studio/>. It needs a Huawei login, so it
   can't be installed from the command line. On first launch, let it install the SDK. Also add
   the **Lite Wearable / JS** SDK components under *Settings → SDK*.
3. **On your Android/Huawei phone**: install **Huawei Health** (already paired to the watch) and
   **DevEco Assistant** (from AppGallery).

## 3. Create the DevEco project and bring in this code

1. DevEco Studio → *File → New → Create Project* → pick the **Lite Wearable** device and the
   **Empty Ability (JS)** template.
   - Project name: `SalahNow`
   - Bundle name: e.g. `com.ashraf.salahnow` (it must match the app you create in AppGallery Connect later)
   - Save location: e.g. `~/DevEcoProjects/SalahNow`
2. Sync the sources:
   ```bash
   npm run sync -- ~/DevEcoProjects/SalahNow
   ```
   This copies `src/` over the template's `entry/src/main/js/<Ability>/`. It also sets
   `pages` and adds the `ohos.permission.LOCATION` permission in `entry/src/main/config.json`.
   Run the sync again after every edit you make in this repo, or edit directly in DevEco and
   copy the changes back.
3. Replace the template's app icon (referenced by `icon` in `config.json`, under
   `entry/src/main/resources`) with your own. AppGallery needs a proper icon.

## 4. Run locally

- **Previewer**: open `pages/index/index.hml` → *View → Tool Windows → Previewer*. The
  previewer is good for checking layout quickly, but storage and GPS don't work there. The
  app falls back to Kuala Lumpur defaults.
- **Simulator**: *Tools → Device Manager → Lite Wearable simulator*, then click **Run**.

## 5. Run on your real Watch Fit 5 Pro

1. **Watch**: *Settings → About* → tap the **build number** 7 times to turn on Developer mode.
   Then turn on **HDC/debugging** under the developer options.
2. **Debug signing**: this needs your watch's UDID, which you can see in DevEco Assistant.
   - Easiest: in DevEco *File → Project Structure → Signing Configs*, check **Automatically
     generate signature** while signed in.
   - Manual: in [AppGallery Connect](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
     → *Users & Permissions → Certificates* and *Devices*, add the watch UDID. Create a
     **debug certificate** (make the CSR with *Build → Generate Key and CSR*) and a **debug
     profile** (.p7b), then fill them into *Signing Configs*.
3. *Build → Build Hap(s)/APP(s) → Build Hap(s)* → `entry/build/.../entry-default-signed.hap`.
4. Copy the `.hap` to the phone, e.g. `adb push entry-default-signed.hap /sdcard/haps/`. Open
   **DevEco Assistant → Install watch app** and choose the file. Then start **Salah Now** from
   the watch's app list.
5. On the watch, open Settings (long-press) → **Location** to get a GPS fix. Do this outdoors
   the first time. The coordinates are saved on the watch.

If you see `INSTALLATION FAILED: 31 / failed to verify signature`, restart the watch, Huawei
Health and DevEco Assistant. If it still fails, regenerate the debug profile and make sure it
includes the watch UDID.

## 6. Publish to AppGallery

1. **AppGallery Connect → My apps → New app**: platform **HarmonyOS** (Lite Wearable), with
   the same bundle name as the project.
2. **Release certificate + release profile**: create them in AGC the same way as the debug
   ones, but with type *Release*. Add them as a `release` signing config in DevEco.
3. Bump `versionCode`/`versionName` in `config.json`. Then run *Build → Build Hap(s)/APP(s) →
   Build APP(s)* in release mode to get `build/outputs/.../*-signed.app`.
4. In AGC, fill in the **App information**: name, description, category (Lifestyle), and
   screenshots taken from the simulator at the watch's resolution. Also add the icon, a
   **privacy policy URL** (required because the app uses location), and the target countries.
5. **Version information → Upload the `.app`**, answer the content-rating and privacy
   questionnaires, then **Submit for review**. Review usually takes a few working days.

Review checklist for lite wearables: swipe-right must exit the app (already done), the app
must not crash when the GPS is off, the package must stay under 10 MB, and the icon must have
no transparent corners.

## Things to check on the device

Huawei hasn't published Watch Fit 5 Pro-specific developer docs, so these are best-effort:

- **Screen size**: the layout uses % widths and was sized for the Fit 4 Pro's ~408×480 panel.
  Adjust the heights in the `.css` files if text gets clipped.
- **Fonts**: lite wearables only render a few font sizes. The app only uses 30px and 38px,
  which are the safe ones.
- **Data binding**: the list view uses `class="{{...}}"` for highlighting and `show=` for
  switching views. If the target API version rejects dynamic classes, change them to a static
  class.
- **Accuracy**: this is a pure astronomical calculation. Official JAKIM/Islamic Foundation
  timetables add a few minutes of *ihtiyati* (safety margin), so expect a difference of about
  1–3 minutes. If you want an exact match, add per-prayer offsets in `computeTimes`.
