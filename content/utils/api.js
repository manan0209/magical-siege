import { Cache } from './cache.js';

const SIEGE_API_BASE = 'https://siege.hackclub.com/api/public-beta';

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
  },

  async getAllProjects() {
    return await this.fetchWithCache(`${SIEGE_API_BASE}/projects`, {}, 120000);
  },

  async getProject(id) {
    return await this.fetchWithCache(`${SIEGE_API_BASE}/project/${id}`, {}, 120000);
  },

  async getUser(idOrSlackId) {
    return await this.fetchWithCache(`${SIEGE_API_BASE}/user/${idOrSlackId}`, {}, 120000);
  },

  async getShopItems() {
    return await this.fetchWithCache(`${SIEGE_API_BASE}/shop`, {}, 300000);
  },

  async getLeaderboard() {
    return await this.fetchWithCache(`${SIEGE_API_BASE}/leaderboard`, {}, 120000);
  },

  async getUserProjectsWithHours(userId) {
    try {
      const userData = await this.getUser(userId);
      if (!userData || !userData.projects) {
        return [];
      }

      const projectsWithDetails = await Promise.all(
        userData.projects.map(async (proj) => {
          try {
            const details = await this.getProject(proj.id);
            return details;
          } catch (error) {
            console.error(`Failed to fetch project ${proj.id}:`, error);
            return proj;
          }
        })
      );

      return projectsWithDetails;
    } catch (error) {
      console.error('Failed to fetch user projects:', error);
      return [];
    }
  },

  async getCurrentWeekProjects() {
    try {
      const allProjects = await this.getAllProjects();
      if (!allProjects || !allProjects.projects) {
        return [];
      }

      const projects = allProjects.projects.filter(p => 
        p.week_badge_text && p.week_badge_text.includes('Week 8')
      );

      return projects;
    } catch (error) {
      console.error('Failed to fetch week projects:', error);
      return [];
    }
  },

  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_api_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
