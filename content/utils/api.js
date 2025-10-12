import { Cache } from './cache.js';

export const API = {
  async fetchWithCache(url, options = {}, ttl = 300000) {
    const cacheKey = `api_${url}`;
    
    return await Cache.get(cacheKey, async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    }, ttl);
  },

  async getTechTreeData() {
    return await this.fetchWithCache('/market/tech_tree_data.json');
  },

  async getUserCoins() {
    return await this.fetchWithCache('/market/user_coins');
  }
};
