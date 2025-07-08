const CACHE_EXPIRE_DAYS = 7;
const CACHE_VERSION = 'v1';
const CACHE_EXPIRATION = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;

export function setCache(key, data) {
  try {
    const cacheData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data: data
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (e) {
    console.warn("Cache set failed:", e);
  }
}

export function getCache(key) {
  try {
    const cacheData = JSON.parse(localStorage.getItem(key));
    if (cacheData && cacheData.version === CACHE_VERSION) {
      if ((Date.now() - cacheData.timestamp) < CACHE_EXPIRATION) {
        return cacheData.data;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("Cache read failed:", e);
  }
  return null;
}