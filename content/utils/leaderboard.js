import { API } from './api.js';

const API_STORAGE_KEY = 'ms_api_leaderboard';
const LOCAL_STORAGE_KEY = 'ms_local_leaderboard';
const CACHE_DURATION = 2 * 60 * 1000;

async function getLeaderboard() {
  const cached = getCachedLeaderboard();
  if (cached) {
    return cached;
  }

  try {
    const response = await API.getLeaderboard();
    
    if (response && response.leaderboard) {
      const apiUsers = response.leaderboard.map((user, index) => ({
        username: user.display_name || user.name,
        display_name: user.display_name,
        name: user.name,
        userId: user.id,
        slackId: user.slack_id,
        coins: user.coins,
        position: index + 1,
        role: user.rank,
        source: 'api'
      }));

      const localUsers = getLocalLeaderboard();
      const merged = mergeLeaderboards(apiUsers, localUsers);
      
      cacheLeaderboard(merged);
      return merged;
    }

    return getLocalLeaderboard();
  } catch (error) {
    console.error('Failed to fetch leaderboard from API:', error);
    return getCachedLeaderboard() || getLocalLeaderboard();
  }
}


//merge fix hopefully, idk why it broke
function mergeLeaderboards(apiUsers, localUsers) {
  const normalizeUsername = (name) => {
    if (!name) return '';
    return name.toLowerCase().trim();
  };

  const apiUsernamesSet = new Set();
  apiUsers.forEach(u => {
    if (u.username) apiUsernamesSet.add(normalizeUsername(u.username));
    if (u.display_name) apiUsernamesSet.add(normalizeUsername(u.display_name));
    if (u.name) apiUsernamesSet.add(normalizeUsername(u.name));
  });

  const localOnlyUsers = localUsers
    .filter(u => {
      const normalizedUsername = normalizeUsername(u.username);
      return normalizedUsername && !apiUsernamesSet.has(normalizedUsername);
    })
    .map(u => ({
      username: u.username,
      coins: u.coins || 0,
      hours: u.hours || 0,
      lastSync: u.lastSync,
      source: 'local',
      position: null
    }));

  const allUsers = [...apiUsers, ...localOnlyUsers];
  
  allUsers.sort((a, b) => b.coins - a.coins);
  
  allUsers.forEach((user, index) => {
    user.position = index + 1;
  });

  return allUsers;
}

function getCachedLeaderboard() {
  try {
    const cached = localStorage.getItem(API_STORAGE_KEY);
    const timestamp = localStorage.getItem(API_STORAGE_KEY + '_timestamp');
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  
  return null;
}

function cacheLeaderboard(data) {
  try {
    localStorage.setItem(API_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(API_STORAGE_KEY + '_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

function getLocalLeaderboard() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get local leaderboard:', error);
    return [];
  }
}

function saveLocalLeaderboard(leaderboard) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch (error) {
    console.error('Failed to save local leaderboard:', error);
  }
}

function syncUserData(username, coins, hours = 0) {
  try {
    const leaderboard = getLocalLeaderboard();
    
    const existingIndex = leaderboard.findIndex(u => u.username === username);
    
    const userData = {
      username,
      coins,
      hours,
      lastSync: Date.now()
    };
    
    if (existingIndex >= 0) {
      leaderboard[existingIndex] = userData;
    } else {
      leaderboard.push(userData);
    }
    
    leaderboard.sort((a, b) => b.coins - a.coins);
    
    saveLocalLeaderboard(leaderboard);
    
    clearLeaderboardCache();
  } catch (error) {
    console.error('Failed to sync user data:', error);
  }
}

function getUserRank(username, leaderboard) {
  if (!leaderboard || !Array.isArray(leaderboard) || !username) {
    return null;
  }
  
  const normalizedSearch = username.toLowerCase().trim();
  
  const user = leaderboard.find(u => {
    const uUsername = u.username ? u.username.toLowerCase().trim() : '';
    const uDisplayName = u.display_name ? u.display_name.toLowerCase().trim() : '';
    const uName = u.name ? u.name.toLowerCase().trim() : '';
    
    return uUsername === normalizedSearch || 
           uDisplayName === normalizedSearch || 
           uName === normalizedSearch;
  });
  
  return user ? user.position : null;
}

function clearLeaderboardCache() {
  try {
    localStorage.removeItem(API_STORAGE_KEY);
    localStorage.removeItem(API_STORAGE_KEY + '_timestamp');
    API.clearCache();
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

export { getLeaderboard, getUserRank, clearLeaderboardCache, syncUserData };
