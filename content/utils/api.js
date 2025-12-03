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
  },

  async getAllUserProjects(userId, onProgress = null) {
    try {
      const userData = await this.getUser(userId);
      if (!userData || !userData.projects) {
        return [];
      }

      const total = userData.projects.length;
      const projectsWithDetails = [];

      for (let i = 0; i < userData.projects.length; i++) {
        try {
          const details = await this.getProject(userData.projects[i].id);
          projectsWithDetails.push(details);
          
          if (onProgress) {
            onProgress({
              current: i + 1,
              total,
              percentage: Math.round(((i + 1) / total) * 100)
            });
          }
        } catch (error) {
          console.error(`Failed to fetch project ${userData.projects[i].id}:`, error);
          projectsWithDetails.push(userData.projects[i]);
        }
      }

      return projectsWithDetails;
    } catch (error) {
      console.error('Failed to fetch all cupcakes projects:', error);
      return [];
    }
  },

  async getDetailedProject(projectId, options = {}) {
    const { retries = 3, retryDelay = 1000 } = options;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const project = await this.getProject(projectId);
        return project;
      } catch (error) {
        if (attempt === retries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  },

  async batchFetchProjects(projectIds, options = {}) {
    const { batchSize = 5, onProgress = null } = options;
    const results = [];
    
    for (let i = 0; i < projectIds.length; i += batchSize) {
      const batch = projectIds.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(id => this.getDetailedProject(id))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to fetch cupcake ${batch[index]}:`, result.reason);
          results.push(null);
        }
      });
      
      if (onProgress) {
        onProgress({
          current: Math.min(i + batchSize, projectIds.length),
          total: projectIds.length,
          percentage: Math.round((Math.min(i + batchSize, projectIds.length) / projectIds.length) * 100)
        });
      }
    }
    
    return results.filter(r => r !== null);
  },

  async getUserWithProjects(userId, options = {}) {
    const { includeDetails = true, onProgress = null } = options;
    
    try {
      const userData = await this.getUser(userId);
      if (!userData) {
        return null;
      }

      if (!includeDetails || !userData.projects || userData.projects.length === 0) {
        return userData;
      }

      const projectIds = userData.projects.map(p => p.id);
      const detailedProjects = await this.batchFetchProjects(projectIds, {
        onProgress
      });

      return {
        ...userData,
        projects: detailedProjects
      };
    } catch (error) {
      console.error('Failed to fetch cupcake with projects:', error);
      return null;
    }
  },

  async getHackatimeStats(slackId, options = {}) {
    const { range = 'all_time' } = options;
    const HACKATIME_API_BASE = 'https://api.hackatime.com/api/v1';
    
    try {
      const url = `${HACKATIME_API_BASE}/users/${slackId}/stats/${range}`;
      return await this.fetchWithCache(url, {}, 300000);
    } catch (error) {
      console.error('Failed to fetch Hackatime stats:', error);
      return null;
    }
  },

  async getWrappedData(userId, slackId, options = {}) {
    const { onProgress = null } = options;
    
    try {
      if (onProgress) onProgress({ stage: 'user', percentage: 0 });
      
      const userData = await this.getUser(userId);
      if (!userData) {
        throw new Error('User not found');
      }

      if (onProgress) onProgress({ stage: 'projects', percentage: 20 });
      
      const projects = await this.getAllUserProjects(userId, (progress) => {
        if (onProgress) {
          onProgress({
            stage: 'projects',
            percentage: 20 + Math.round(progress.percentage * 0.5)
          });
        }
      });

      if (onProgress) onProgress({ stage: 'leaderboard', percentage: 70 });
      
      const leaderboard = await this.getLeaderboard();

      if (onProgress) onProgress({ stage: 'shop', percentage: 80 });
      
      const shopItems = await this.getShopItems();

      if (onProgress) onProgress({ stage: 'hackatime', percentage: 90 });
      
      const hackatimeStats = slackId ? await this.getHackatimeStats(slackId) : null;

      if (onProgress) onProgress({ stage: 'complete', percentage: 100 });

      return {
        user: userData,
        projects,
        leaderboard,
        shop: shopItems,
        hackatime: hackatimeStats
      };
    } catch (error) {
      console.error('Failed to fetch wrapped data:', error);
      throw error;
    }
  }
};
