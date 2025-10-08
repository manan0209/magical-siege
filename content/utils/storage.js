export const Storage = {
  async get(key, defaultValue = null) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  async getMultiple(keys) {
    try {
      const result = await chrome.storage.local.get(keys);
      return result;
    } catch (error) {
      console.error('Storage getMultiple error:', error);
      return {};
    }
  },

  async setMultiple(items) {
    try {
      await chrome.storage.local.set(items);
      return true;
    } catch (error) {
      console.error('Storage setMultiple error:', error);
      return false;
    }
  },

  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  async clear() {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

export const Settings = {
  DEFAULTS: {
    theme: 'default',
    notificationsEnabled: true,
    deadlineReminders: true,
    progressUpdates: true,
    votingAlerts: true,
    showTopBar: true,
    keyboardShortcuts: true,
    autoSync: true,
    syncInterval: 5
  },

  async getAll() {
    const settings = await Storage.get('settings', {});
    return { ...this.DEFAULTS, ...settings };
  },

  async get(key) {
    const settings = await this.getAll();
    return settings[key];
  },

  async set(key, value) {
    const settings = await this.getAll();
    settings[key] = value;
    return await Storage.set('settings', settings);
  },

  async setMultiple(updates) {
    const settings = await this.getAll();
    Object.assign(settings, updates);
    return await Storage.set('settings', settings);
  },

  async reset() {
    return await Storage.set('settings', this.DEFAULTS);
  }
};

export const Cache = {
  async set(key, data, ttl = 300000) {
    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      ttl: ttl
    };
    return await Storage.set(`cache_${key}`, cacheItem);
  },

  async get(key) {
    const cacheItem = await Storage.get(`cache_${key}`);
    
    if (!cacheItem) {
      return null;
    }

    const age = Date.now() - cacheItem.timestamp;
    if (age > cacheItem.ttl) {
      await Storage.remove(`cache_${key}`);
      return null;
    }

    return cacheItem.data;
  },

  async remove(key) {
    return await Storage.remove(`cache_${key}`);
  },

  async clearAll() {
    const allData = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(allData).filter(key => key.startsWith('cache_'));
    
    for (const key of cacheKeys) {
      await Storage.remove(key);
    }
    
    return true;
  }
};
