import { API } from './api.js';
import { 
  createEmptyWrappedData, 
  validateWrappedData,
  WRAPPED_STORAGE_KEYS,
  WRAPPED_CACHE_TTL,
  isWrappedDataExpired
} from './wrapped-schema.js';
import {
  calculateAggregates,
  buildWeeklyTimeline,
  calculatePercentile,
  calculateConsistencyScore
} from './wrapped-calculations.js';

export class WrappedDataAggregator {
  constructor(userId, slackId = null) {
    this.userId = userId;
    this.slackId = slackId;
    this.onProgress = null;
  }

  setProgressCallback(callback) {
    this.onProgress = callback;
  }

  emitProgress(stage, percentage, message = '') {
    if (this.onProgress) {
      this.onProgress({ stage, percentage, message });
    }
  }

  async loadCachedData() {
    try {
      const cached = localStorage.getItem(WRAPPED_STORAGE_KEYS.WRAPPED_DATA);
      if (!cached) return null;

      const data = JSON.parse(cached);
      
      if (!validateWrappedData(data)) {
        console.warn('Cached data failed validation');
        return null;
      }

      if (isWrappedDataExpired(data.generatedAt)) {
        console.log('Cached data expired');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load cached data:', error);
      return null;
    }
  }

  saveCachedData(data) {
    try {
      localStorage.setItem(WRAPPED_STORAGE_KEYS.WRAPPED_DATA, JSON.stringify(data));
      localStorage.setItem(WRAPPED_STORAGE_KEYS.LAST_GENERATED, Date.now().toString());
    } catch (error) {
      console.error('Failed to save cached data:', error);
    }
  }

  async fetchRawData() {
    this.emitProgress('fetching', 0, 'Starting data fetch...');

    const rawData = await API.getWrappedData(this.userId, this.slackId, {
      onProgress: (progress) => {
        const progressMap = {
          'user': { base: 0, range: 10 },
          'projects': { base: 10, range: 50 },
          'leaderboard': { base: 60, range: 10 },
          'shop': { base: 70, range: 10 },
          'hackatime': { base: 80, range: 10 },
          'complete': { base: 90, range: 10 }
        };

        const mapping = progressMap[progress.stage] || { base: 0, range: 100 };
        const percentage = mapping.base + (progress.percentage || 0) * (mapping.range / 100);
        
        this.emitProgress('fetching', Math.round(percentage), `Fetching ${progress.stage}...`);
      }
    });

    return rawData;
  }

  processUserData(userData) {
    if (!userData) return {};

    return {
      id: userData.id,
      slackId: userData.slack_id,
      name: userData.name,
      avatar: userData.avatar_url,
      status: userData.status,
      joinedAt: userData.created_at,
      bio: userData.bio || '',
      github: userData.github_username || null
    };
  }

  processProjects(projects) {
    if (!Array.isArray(projects)) return [];

    return projects.map(project => ({
      id: project.id,
      name: project.name,
      week: project.week || 0,
      hours: project.hours || 0,
      status: project.status,
      coinValue: parseFloat(project.coin_value) || 0,
      averageScore: project.average_score || 0,
      reviewCount: project.review_count || 0,
      screenshot: project.screenshot_url || null,
      description: project.description || '',
      repoUrl: project.repo_url || null,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }));
  }

  processLeaderboard(leaderboardData, userId) {
    if (!leaderboardData || !leaderboardData.leaderboard) {
      return {
        rank: 0,
        percentile: 0,
        totalParticipants: 0,
        topUser: null
      };
    }

    const leaderboard = leaderboardData.leaderboard;
    const userIndex = leaderboard.findIndex(user => user.id === userId);
    const rank = userIndex >= 0 ? userIndex + 1 : 0;
    const totalParticipants = leaderboard.length;
    const percentile = calculatePercentile(rank, totalParticipants);

    const topUser = leaderboard.length > 0 ? {
      id: leaderboard[0].id,
      name: leaderboard[0].name,
      coins: leaderboard[0].coins || 0
    } : null;

    return {
      rank,
      percentile,
      totalParticipants,
      topUser
    };
  }

  analyzePatterns(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      return {
        mostProductiveWeek: null,
        mostProductiveDay: null,
        averageSessionLength: 0,
        longestStreak: 0,
        currentStreak: 0,
        favoriteLanguage: null,
        consistencyScore: 0
      };
    }

    const weeklyHours = {};
    projects.forEach(p => {
      const week = p.week || 0;
      weeklyHours[week] = (weeklyHours[week] || 0) + (p.hours || 0);
    });

    const mostProductiveWeek = Object.entries(weeklyHours).reduce(
      (max, [week, hours]) => hours > max.hours ? { week: parseInt(week), hours } : max,
      { week: null, hours: 0 }
    );

    const consistencyScore = calculateConsistencyScore(projects);

    return {
      mostProductiveWeek: mostProductiveWeek.week,
      mostProductiveDay: null,
      averageSessionLength: 0,
      longestStreak: 0,
      currentStreak: 0,
      favoriteLanguage: null,
      consistencyScore
    };
  }

  processVotingData(projects) {
    if (!Array.isArray(projects) || projects.length === 0) {
      return {
        totalReviewsGiven: 0,
        totalReviewsReceived: 0,
        averageScoreGiven: 0,
        averageScoreReceived: 0,
        projectsReviewed: []
      };
    }

    const totalReviewsReceived = projects.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const scores = projects.filter(p => p.averageScore > 0).map(p => p.averageScore);
    const averageScoreReceived = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
      : 0;

    return {
      totalReviewsGiven: 0,
      totalReviewsReceived,
      averageScoreGiven: 0,
      averageScoreReceived: parseFloat(averageScoreReceived.toFixed(2)),
      projectsReviewed: []
    };
  }

  processShopData(shopData) {
    if (!shopData || !shopData.items) {
      return {
        itemsPurchased: [],
        totalSpent: 0,
        favoriteCategory: null
      };
    }

    return {
      itemsPurchased: [],
      totalSpent: 0,
      favoriteCategory: null,
      availableItems: shopData.items.length
    };
  }

  processHackatimeData(hackatimeData) {
    if (!hackatimeData || !hackatimeData.data) {
      return {
        totalSeconds: 0,
        totalHours: 0,
        dailyAverage: 0,
        languages: [],
        projects: [],
        editors: []
      };
    }

    const data = hackatimeData.data;
    const totalSeconds = data.total_seconds || 0;
    const totalHours = parseFloat((totalSeconds / 3600).toFixed(1));

    return {
      totalSeconds,
      totalHours,
      dailyAverage: data.daily_average || 0,
      languages: data.languages || [],
      projects: data.projects || [],
      editors: data.editors || []
    };
  }

  async aggregate(useCache = true) {
    try {
      if (useCache) {
        const cached = await this.loadCachedData();
        if (cached) {
          this.emitProgress('complete', 100, 'Loaded from cache');
          return cached;
        }
      }

      this.emitProgress('fetching', 0, 'Fetching data...');
      const rawData = await this.fetchRawData();

      this.emitProgress('processing', 90, 'Processing data...');

      const wrappedData = createEmptyWrappedData();
      wrappedData.generatedAt = Date.now();

      wrappedData.user = this.processUserData(rawData.user);
      
      const processedProjects = this.processProjects(rawData.projects);
      wrappedData.projects = processedProjects;

      wrappedData.aggregates = calculateAggregates(processedProjects);
      wrappedData.rankings = this.processLeaderboard(rawData.leaderboard, this.userId);
      wrappedData.patterns = this.analyzePatterns(processedProjects);
      wrappedData.voting = this.processVotingData(processedProjects);
      wrappedData.shop = this.processShopData(rawData.shop);
      wrappedData.hackatime = this.processHackatimeData(rawData.hackatime);
      wrappedData.timeline = buildWeeklyTimeline(processedProjects);

      this.emitProgress('processing', 95, 'Validating data...');
      
      if (!validateWrappedData(wrappedData)) {
        throw new Error('Generated data failed validation');
      }

      this.emitProgress('saving', 98, 'Saving data...');
      this.saveCachedData(wrappedData);

      this.emitProgress('complete', 100, 'Complete!');
      return wrappedData;

    } catch (error) {
      console.error('Failed to aggregate wrapped data:', error);
      this.emitProgress('error', 0, error.message);
      throw error;
    }
  }

  async refresh() {
    localStorage.removeItem(WRAPPED_STORAGE_KEYS.WRAPPED_DATA);
    localStorage.removeItem(WRAPPED_STORAGE_KEYS.LAST_GENERATED);
    return await this.aggregate(false);
  }

  static async getWrappedData(userId, slackId = null, options = {}) {
    const { onProgress = null, useCache = true } = options;
    
    const aggregator = new WrappedDataAggregator(userId, slackId);
    if (onProgress) {
      aggregator.setProgressCallback(onProgress);
    }

    return await aggregator.aggregate(useCache);
  }
}
