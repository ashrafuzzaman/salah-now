// @system.storage backed by localStorage.
export default {
  get(o) { let v = null; try { v = localStorage.getItem(o.key); } catch (e) {} o.success && o.success(v === null ? (o.default || '') : v); o.complete && o.complete(); },
  set(o) { try { localStorage.setItem(o.key, o.value); } catch (e) {} o.success && o.success(); o.complete && o.complete(); }
};
