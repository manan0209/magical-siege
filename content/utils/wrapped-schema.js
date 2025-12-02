export const WRAPPED_SCHEMA_VERSION = '1.0.0';

export const WRAPPED_STORAGE_KEYS = {
  WRAPPED_DATA: 'siege_wrapped_data',
  WRAPPED_CACHE: 'siege_wrapped_cache',
  WRAPPED_TIMESTAMP: 'siege_wrapped_timestamp',
  WRAPPED_VERSION: 'siege_wrapped_version'
};

export const WRAPPED_CACHE_TTL = 24 * 60 * 60 * 1000;

export function createEmptyWrappedData() {
  return {
    version: WRAPPED_SCHEMA_VERSION,
    generatedAt: Date.now(),
    user: createEmptyUserProfile(),
    projects: [],
    aggregates: createEmptyAggregates(),
    rankings: createEmptyRankings(),
    patterns: createEmptyPatterns(),
    voting: createEmptyVoting(),
    shop: createEmptyShop(),
    hackatime: null,
    achievements: [],
    timeline: []
  };
}

function createEmptyUserProfile() {
  return {
    id: null,
    slackId: null,
    name: null,
    displayName: null,
    coins: 0,
    rank: null,
    status: null
  };
}

function createEmptyAggregates() {
  return {
    totalProjects: 0,
    totalHours: 0,
    totalCoins: 0,
    avgScore: 0,
    weeksParticipated: 0,
    completionRate: 0,
    avgHoursPerWeek: 0,
    avgCoinsPerWeek: 0,
    avgHoursPerProject: 0,
    avgCoinsPerProject: 0,
    efficiency: 0,
    bestProject: null,
    highestCoinProject: null,
    highestRatedProject: null
  };
}

function createEmptyRankings() {
  return {
    currentRank: null,
    totalParticipants: 0,
    percentile: 0,
    startRank: null,
    rankImprovement: 0
  };
}

function createEmptyPatterns() {
  return {
    mostProductiveWeek: 0,
    mostProductiveDay: null,
    mostProductiveHour: null,
    avgSessionLength: 0,
    longestSession: 0,
    consistencyScore: 0,
    codingStreak: 0
  };
}

function createEmptyVoting() {
  return {
    totalVotesCast: 0,
    ballotsSubmitted: 0,
    participationRate: 0,
    avgStarsGiven: 0,
    avgStarsReceived: 0,
    thoughtfulVoter: false
  };
}

function createEmptyShop() {
  return {
    totalPurchases: 0,
    totalSpent: 0,
    cosmeticsUnlocked: 0,
    physicalItemsPurchased: 0,
    mercenariesHired: 0
  };
}

export function validateWrappedData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object' };
  }

  if (data.version !== WRAPPED_SCHEMA_VERSION) {
    return { valid: false, error: 'Schema version mismatch' };
  }

  if (!data.user || typeof data.user !== 'object') {
    return { valid: false, error: 'User data is required' };
  }

  if (!Array.isArray(data.projects)) {
    return { valid: false, error: 'Projects must be an array' };
  }

  if (!data.aggregates || typeof data.aggregates !== 'object') {
    return { valid: false, error: 'Aggregates data is required' };
  }

  if (!data.rankings || typeof data.rankings !== 'object') {
    return { valid: false, error: 'Rankings data is required' };
  }

  if (!Array.isArray(data.achievements)) {
    return { valid: false, error: 'Achievements must be an array' };
  }

  if (!Array.isArray(data.timeline)) {
    return { valid: false, error: 'Timeline must be an array' };
  }

  return { valid: true };
}

export function isWrappedDataExpired(timestamp) {
  if (!timestamp) return true;
  const now = Date.now();
  return (now - timestamp) > WRAPPED_CACHE_TTL;
}

export function migrateWrappedData(oldData, fromVersion, toVersion) {
  if (fromVersion === toVersion) {
    return oldData;
  }

  let migratedData = { ...oldData };

  return migratedData;
}
