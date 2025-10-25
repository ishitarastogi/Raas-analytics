// tiny TTL cache over localStorage
const NAMESPACE = "raas-cache:v1";

function now() {
  return Date.now();
}

function k(key) {
  return `${NAMESPACE}:${key}`;
}

export function cacheGetFresh(key) {
  try {
    const raw = localStorage.getItem(k(key));
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (expiresAt && now() > expiresAt) return null; // expired
    return data;
  } catch {
    return null;
  }
}

export function cacheSet(key, data, ttlMs = 5 * 60 * 1000) {
  try {
    const payload = {
      data,
      // store with an expiry; you can set ttlMs=0 to keep forever
      expiresAt: ttlMs ? now() + ttlMs : null,
    };
    localStorage.setItem(k(key), JSON.stringify(payload));
  } catch {}
}

export function cacheClear(key) {
  try {
    localStorage.removeItem(k(key));
  } catch {}
}
