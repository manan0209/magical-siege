const API_STORAGE_KEY = 'ms_api_leaderboard';
const LOCAL_STORAGE_KEY = 'ms_local_leaderboard';
const CACHE_DURATION = 40 * 60 * 60 * 1000;

function getCurrentWeek() {
  const week4StartDate = new Date('2025-09-22');
  const now = new Date();
  const timeDiff = now.getTime() - week4StartDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
  const weeksDiff = Math.floor(daysDiff / 7);
  return 4 + weeksDiff;
}

async function getLeaderboard() {
  const cached = getCachedLeaderboard();
  if (cached) {
    return cached;
  }

  const currentWeek = getCurrentWeek();
  const userNameElement = document.querySelector('.user-name');
  const userName = userNameElement ? userNameElement.textContent.trim() : 'Anonymous';

  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'FETCH_FULL_LEADERBOARD',
        currentWeek: currentWeek,
        userName: userName
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });

    if (response && response.success && response.data) {
      const leaderboard = response.data.fullLeaderboard.map(user => ({
        username: user.username,
        display_name: user.display_name,
        name: user.name,
        userId: user.id,
        coins: user.coins,
        position: user.rank,
        source: user.source || 'api'
      }));

      const localUsers = getLocalLeaderboard();
      const merged = mergeLeaderboards(leaderboard, localUsers);
      
      cacheLeaderboard(merged);
      return merged;
    }

    return getLocalLeaderboard();
  } catch (error) {
    console.error('Sad to tell ya that I failed to fetch leaderboard:(', error);
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
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

export { getLeaderboard, getUserRank, clearLeaderboardCache, syncUserData };
