// @system.geolocation backed by the browser's geolocation.
export default {
  getLocation(o) {
    if (!navigator.geolocation) { o.fail && o.fail('unsupported', 1000); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => o.success && o.success({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => o.fail && o.fail(e.message, e.code),
      { timeout: o.timeout || 30000 });
  }
};
