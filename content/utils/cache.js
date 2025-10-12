import { Storage } from './storage.js';

export const Cache = {
  async get(key, fetcher, ttl = 300000) {
    const cacheKey = `cache_${key}`;
    const cached = await Storage.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    await Storage.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  },

  async invalidate(key) {
    const cacheKey = `cache_${key}`;
    await Storage.remove(cacheKey);
  },

  async invalidateAll() {
    const all = await Storage.getAll();
    const cacheKeys = Object.keys(all).filter(k => k.startsWith('cache_'));
    
    for (const key of cacheKeys) {
      await Storage.remove(key);
    }
  }
};
