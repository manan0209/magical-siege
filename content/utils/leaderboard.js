const STORAGE_KEY = 'ms_global_leaderboard';
const SYNC_INTERVAL = 5 * 60 * 1000;
const DATA_EXPIRY = 7 * 24 * 60 * 60 * 1000;

async function syncUserData(username, coins, hours) {
  try {
    await syncToCloud({ username, coins, hours, lastUpdated: Date.now() });
    
    const freshLeaderboard = await getLeaderboard();
    
    return freshLeaderboard;
  } catch (error) {
    console.error('Sync failed:', error);
    return getLocalLeaderboard();
  }
}

function getLocalLeaderboard() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalLeaderboard(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY + '_timestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
}

async function syncToCloud(userData) {
  try {
    const WEBHOOK_URL = 'https://magical-siege-backend.siegelb.workers.dev/sync';
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      mode: 'cors'
    });
    
    if (!response.ok) {
      console.warn('Cloud sync response not OK:', response.status);
    }
  } catch (error) {
    console.warn('Cloud sync skipped (network issue):', error.message);
  }
}

async function getLeaderboard() {
  const localData = getLocalLeaderboard();
  
  const lastSync = localStorage.getItem(STORAGE_KEY + '_timestamp');
  const shouldSync = !lastSync || Date.now() - parseInt(lastSync) > SYNC_INTERVAL;
  
  if (shouldSync) {
    try {
      const WEBHOOK_URL = 'https://magical-siege-backend.siegelb.workers.dev/leaderboard';
      const response = await fetch(WEBHOOK_URL, {
        mode: 'cors'
      });
      
      if (response.ok) {
        const cloudData = await response.json();
        if (Array.isArray(cloudData) && cloudData.length > 0) {
          const mergedData = mergeLeaderboards(localData, cloudData);
          saveLocalLeaderboard(mergedData);
          return mergedData;
        }
      }
    } catch (error) {
      console.warn('Cloud fetch skipped (network issue):', error.message);
    }
  }

  return localData
    .filter(u => Date.now() - u.lastUpdated < DATA_EXPIRY)
    .sort((a, b) => b.coins - a.coins);
}

function mergeLeaderboards(local, cloud) {
  const merged = [...local];
  
  cloud.forEach(cloudUser => {
    const existingIndex = merged.findIndex(u => u.username === cloudUser.username);
    
    if (existingIndex >= 0) {
      if (cloudUser.lastUpdated > merged[existingIndex].lastUpdated) {
        merged[existingIndex] = cloudUser;
      }
    } else {
      merged.push(cloudUser);
    }
  });
  
  return merged
    .filter(u => Date.now() - u.lastUpdated < DATA_EXPIRY)
    .sort((a, b) => b.coins - a.coins);
}

function getUserRank(username, leaderboard) {
  const index = leaderboard.findIndex(u => u.username === username);
  return index >= 0 ? index + 1 : null;
}

export { syncUserData, getLeaderboard, getUserRank };
