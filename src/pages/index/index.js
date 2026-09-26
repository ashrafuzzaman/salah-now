import app from '@system.app';
import router from '@system.router';
import { getSchedule, formatClock, formatDuration, NAMES } from '../../common/praytimes.js';
import { loadSettings } from '../../common/settings.js';

var ROW_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default {
  data: {
    showMain: true,
    showList: false,
    place: '',
    currentLabel: 'NOW',
    currentName: '--',
    endsCaption: '',
    remaining: '--:--',
    progress: 0,
    nextName: '--',
    nextTime: '',
    rows: []
  },

  onInit() {
    this.cfg = null;
    this.schedule = null;
    this.timer = null;
  },

  onShow() {
    var self = this;
    loadSettings(function (cfg) {
      self.cfg = cfg;
      self.place = cfg.place;
      self.schedule = null;
      self.tick();
      if (self.timer === null) {
        self.timer = setInterval(function () { self.tick(); }, 1000);
      }
    });
  },

  onDestroy() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  tick() {
    if (!this.cfg) { return; }
    var now = new Date();
    // Only recompute the astronomy when the current window has ended.
    if (this.schedule === null || now.getTime() >= this.schedule.validUntil) {
      this.schedule = getSchedule(now, this.cfg);
      this.renderStatic();
    }
    var s = this.schedule;
    this.remaining = formatDuration(s.currentEnd - now.getTime());
    this.progress = Math.max(0, Math.min(100,
      Math.round((now.getTime() - s.currentStart) * 100 / (s.currentEnd - s.currentStart))));
  },

  renderStatic() {
    var s = this.schedule;
    var use12h = this.cfg.use12h;
    if (s.current) {
      this.currentLabel = 'NOW';
      this.currentName = NAMES[s.current];
      this.endsCaption = 'ends ' + formatClock(s.currentEnd, use12h) + ' in';
    } else {
      this.currentLabel = 'NO FARD PRAYER';
      this.currentName = 'Duha';
      this.endsCaption = 'Dhuhr ' + formatClock(s.currentEnd, use12h) + ' in';
    }
    this.nextName = NAMES[s.next];
    this.nextTime = formatClock(s.nextStart, use12h);

    var rows = [];
    for (var i = 0; i < ROW_KEYS.length; i++) {
      var k = ROW_KEYS[i];
      var active = k === s.current && s.currentStart === s.today[k];
      rows.push({
        name: NAMES[k],
        time: formatClock(s.today[k], use12h),
        nameCls: active ? 'rowName active' : 'rowName',
        timeCls: active ? 'rowTime active' : 'rowTime'
      });
    }
    this.rows = rows;
  },

  toggleView() {
    this.showMain = !this.showMain;
    this.showList = !this.showMain;
  },

  openSettings() {
    router.replace({ uri: 'pages/settings/settings' });
  },

  // Lite wearables require swipe-right to exit the app.
  onSwipe(e) {
    if (e.direction === 'right') {
      app.terminate();
    }
  }
};
