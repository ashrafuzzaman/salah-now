import router from '@system.router';
import geolocation from '@system.geolocation';
import { METHODS, METHOD_KEYS } from '../../common/praytimes.js';
import { loadSettings, saveSettings } from '../../common/settings.js';

export default {
  data: {
    methodLabel: '',
    asrLabel: '',
    clockLabel: '',
    locationLabel: ''
  },

  onInit() {
    this.cfg = null;
  },

  onShow() {
    var self = this;
    loadSettings(function (cfg) {
      self.cfg = cfg;
      self.render();
    });
  },

  render() {
    var c = this.cfg;
    this.methodLabel = METHODS[c.method].label;
    this.asrLabel = c.asrFactor === 2 ? 'Hanafi (later)' : 'Standard (Shafi\'i)';
    this.clockLabel = c.use12h ? '12-hour' : '24-hour';
    this.locationLabel = c.place || (c.lat.toFixed(2) + ', ' + c.lng.toFixed(2));
  },

  commit() {
    saveSettings(this.cfg);
    this.render();
  },

  cycleMethod() {
    var i = METHOD_KEYS.indexOf(this.cfg.method);
    this.cfg.method = METHOD_KEYS[(i + 1) % METHOD_KEYS.length];
    this.commit();
  },

  toggleAsr() {
    this.cfg.asrFactor = this.cfg.asrFactor === 2 ? 1 : 2;
    this.commit();
  },

  toggleClock() {
    this.cfg.use12h = !this.cfg.use12h;
    this.commit();
  },

  updateLocation() {
    var self = this;
    this.locationLabel = 'Locating...';
    geolocation.getLocation({
      timeout: 60000,
      success: function (loc) {
        self.cfg.lat = loc.latitude;
        self.cfg.lng = loc.longitude;
        self.cfg.place = '';
        self.commit();
      },
      fail: function (data, code) {
        console.error('getLocation failed: ' + code + ' ' + data);
        self.locationLabel = 'GPS failed, tap to retry';
      }
    });
  },

  goBack() {
    router.replace({ uri: 'pages/index/index' });
  },

  onSwipe(e) {
    if (e.direction === 'right') {
      this.goBack();
    }
  }
};
