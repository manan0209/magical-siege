const ALARM_NAMES = {
  DEADLINE_CHECK: 'deadlineCheck',
  VOTING_CHECK: 'votingCheck',
  SYNC_DATA: 'syncData',
  WRAPPED_CACHE: 'wrappedCache'
};

const NOTIFICATION_IDS = {
  DEADLINE_SOON: 'deadlineSoon',
  VOTING_STARTED: 'votingStarted',
  VOTING_ENDING: 'votingEnding',
  WRAPPED_READY: 'wrappedReady',
  WRAPPED_ACHIEVEMENT: 'wrappedAchievement'
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Magical Siege installed');
    await setupAlarms();
    await chrome.storage.local.set({ installDate: Date.now() });
  } else if (details.reason === 'update') {
    console.log('Magical Siege updated');
    await setupAlarms();
  }
});

async function setupAlarms() {
  chrome.alarms.clearAll();
  
  chrome.alarms.create(ALARM_NAMES.DEADLINE_CHECK, {
    periodInMinutes: 60
  });
  
  chrome.alarms.create(ALARM_NAMES.VOTING_CHECK, {
    periodInMinutes: 30
  });
  
  chrome.alarms.create(ALARM_NAMES.SYNC_DATA, {
    periodInMinutes: 5
  });
  
  chrome.alarms.create(ALARM_NAMES.WRAPPED_CACHE, {
    periodInMinutes: 360
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const settings = await chrome.storage.local.get('settings');
  const userSettings = settings.settings || {};
  
  if (alarm.name === ALARM_NAMES.DEADLINE_CHECK) {
    if (userSettings.deadlineReminders !== false) {
      await checkDeadlines();
    }
  } else if (alarm.name === ALARM_NAMES.VOTING_CHECK) {
    if (userSettings.votingAlerts !== false) {
      await checkVotingPeriod();
    }
  } else if (alarm.name === ALARM_NAMES.SYNC_DATA) {
    if (userSettings.autoSync !== false) {
      await syncCachedData();
    }
  } else if (alarm.name === ALARM_NAMES.WRAPPED_CACHE) {
    await refreshWrappedCache();
  }
});

async function checkDeadlines() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((1 + 7 - dayOfWeek) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);
  
  const hoursUntilDeadline = (nextMonday - now) / (1000 * 60 * 60);
  
  if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 23) {
    await showNotification(
      NOTIFICATION_IDS.DEADLINE_SOON,
      'Deadline Approaching',
      'Less than 24 hours until Monday midnight deadline. Have you completed your 10 hours?'
    );
  }
}

async function checkVotingPeriod() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hours = now.getHours();
  
  if (dayOfWeek === 1 && hours === 0) {
    await showNotification(
      NOTIFICATION_IDS.VOTING_STARTED,
      'Voting Period Started',
      'Monday voting has begun! Review and vote on fellow Siegers projects.'
    );
  }
  
  if (dayOfWeek === 1 && hours === 23) {
    await showNotification(
      NOTIFICATION_IDS.VOTING_ENDING,
      'Voting Ending Soon',
      'Voting period ends in 1 hour. Cast your votes now!'
    );
  }
}

async function syncCachedData() {
  const tabs = await chrome.tabs.query({ 
    url: 'https://siege.hackclub.com/*' 
  });
  
  if (tabs.length > 0) {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'SYNC_REQUEST' 
      }).catch(() => {});
    }
  }
}

async function showNotification(id, title, message) {
  const settings = await chrome.storage.local.get('settings');
  const userSettings = settings.settings || {};
  
  if (userSettings.notificationsEnabled === false) {
    return;
  }
  
  await chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: '../assets/icons/icon-128.png',
    title: title,
    message: message,
    priority: 2
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ 
    url: 'https://siege.hackclub.com/' 
  });
  chrome.notifications.clear(notificationId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SHOW_NOTIFICATION') {
    showNotification(
      message.id,
      message.title,
      message.message
    ).then(() => sendResponse({ success: true }));
    return true;
  }
  
  if (message.type === 'GET_INSTALL_DATE') {
    chrome.storage.local.get('installDate').then(result => {
      sendResponse({ installDate: result.installDate });
    });
    return true;
  }
  
  if (message.type === 'FETCH_FULL_LEADERBOARD') {
    fetchFullLeaderboard(message.currentWeek, message.userName)
      .then(data => sendResponse(data))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'GENERATE_WRAPPED') {
    generateWrappedData(message.userId, message.slackId)
      .then(data => sendResponse(data))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'GET_WRAPPED_STATUS') {
    getWrappedStatus()
      .then(data => sendResponse(data))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (message.type === 'UNLOCK_ACHIEVEMENT') {
    handleAchievementUnlock(message.achievement)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function fetchFullLeaderboard(currentWeek, userName) {
  try {
    const projectsResponse = await fetch('https://siege.hackclub.com/api/public-beta/projects');
    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }
    const projectsRaw = await projectsResponse.json();
    const projectsData = Array.isArray(projectsRaw) ? projectsRaw : (projectsRaw.projects || []);

    if (!Array.isArray(projectsData) || projectsData.length === 0) {
      throw new Error('No projects data available');
    }

    let currentWeekProjects = projectsData.filter(p => {
      const weekMatch = p.week_badge_text?.match(/Week (\d+)/);
      return weekMatch && parseInt(weekMatch[1]) === currentWeek;
    });

    if (currentWeekProjects.length < 50 && currentWeek > 4) {
      console.log(`Week ${currentWeek} has only ${currentWeekProjects.length} projects (< 50), falling back to week ${currentWeek - 1}`);
      currentWeekProjects = projectsData.filter(p => {
        const weekMatch = p.week_badge_text?.match(/Week (\d+)/);
        return weekMatch && parseInt(weekMatch[1]) === currentWeek - 1;
      });
    }

    const userIds = [...new Set(currentWeekProjects.map(p => p.user?.id).filter(id => id))];

    const userDataPromises = userIds.map(async (id) => {
      try {
        const response = await fetch(`https://siege.hackclub.com/api/public-beta/user/${id}`);
        if (!response.ok) return null;
        return await response.json();
      } catch (error) {
        console.error(`Failed to fetch user ${id}:`, error);
        return null;
      }
    });

    const usersData = await Promise.all(userDataPromises);

    const leaderboard = usersData
      .filter(user => user && user.id)
      .map(user => ({
        id: user.id,
        username: user.display_name || user.name,
        name: user.name,
        display_name: user.display_name,
        coins: user.coins || 0,
        source: 'api'
      }))
      .sort((a, b) => b.coins - a.coins)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    const userEntry = leaderboard.find(u =>
      u.display_name === userName || u.name === userName || u.username === userName
    );

    return {
      success: true,
      data: {
        rank: userEntry?.rank || null,
        coins: userEntry?.coins || 0,
        totalUsers: leaderboard.length,
        fullLeaderboard: leaderboard
      }
    };
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return { success: false, error: error.message };
  }
}

async function refreshWrappedCache() {
  try {
    const result = await chrome.storage.local.get(['siege_wrapped_data', 'siege_user_id', 'siege_slack_id']);
    
    if (!result.siege_user_id) {
      return;
    }
    
    const lastGenerated = result.siege_wrapped_data?.generatedAt || 0;
    const hoursSinceGeneration = (Date.now() - lastGenerated) / (1000 * 60 * 60);
    
    if (hoursSinceGeneration < 6) {
      return;
    }
    
    await generateWrappedData(result.siege_user_id, result.siege_slack_id);
    
  } catch (error) {
    console.error('Failed to refresh wrapped cache:', error);
  }
}

async function generateWrappedData(userId, slackId = null) {
  try {
    const SIEGE_API_BASE = 'https://siege.hackclub.com/api/public-beta';
    const HACKATIME_API_BASE = 'https://api.hackatime.com/api/v1';
    
    const userResponse = await fetch(`${SIEGE_API_BASE}/user/${userId}`);
    if (!userResponse.ok) throw new Error('Failed to fetch user data');
    const userData = await userResponse.json();
    
    const projectIds = userData.projects?.map(p => p.id) || [];
    const projects = [];
    
    for (const id of projectIds) {
      try {
        const projectResponse = await fetch(`${SIEGE_API_BASE}/project/${id}`);
        if (projectResponse.ok) {
          const project = await projectResponse.json();
          projects.push(project);
        }
      } catch (error) {
        console.error(`Failed to fetch project ${id}:`, error);
      }
    }
    
    const leaderboardResponse = await fetch(`${SIEGE_API_BASE}/leaderboard`);
    const leaderboard = leaderboardResponse.ok ? await leaderboardResponse.json() : null;
    
    let hackatimeStats = null;
    if (slackId) {
      try {
        const hackatimeResponse = await fetch(`${HACKATIME_API_BASE}/users/${slackId}/stats/all_time`);
        if (hackatimeResponse.ok) {
          hackatimeStats = await hackatimeResponse.json();
        }
      } catch (error) {
        console.error('Failed to fetch Hackatime stats:', error);
      }
    }
    
    const wrappedData = {
      version: '1.0.0',
      generatedAt: Date.now(),
      userId: userId,
      slackId: slackId,
      user: userData,
      projects: projects,
      leaderboard: leaderboard,
      hackatime: hackatimeStats
    };
    
    await chrome.storage.local.set({
      siege_wrapped_data: wrappedData,
      siege_user_id: userId,
      siege_slack_id: slackId,
      siege_wrapped_last_generated: Date.now()
    });
    
    await showNotification(
      NOTIFICATION_IDS.WRAPPED_READY,
      'Siege Wrapped Ready',
      'Your Siege Wrap has been updated and is ready to view!'
    );
    
    return { success: true, data: wrappedData };
    
  } catch (error) {
    console.error('Failed to generate wrapped data:', error);
    return { success: false, error: error.message };
  }
}

async function getWrappedStatus() {
  try {
    const result = await chrome.storage.local.get(['siege_wrapped_data', 'siege_wrapped_last_generated']);
    
    if (!result.siege_wrapped_data) {
      return { 
        success: true, 
        status: 'not_generated',
        lastGenerated: null 
      };
    }
    
    const lastGenerated = result.siege_wrapped_last_generated || result.siege_wrapped_data.generatedAt;
    const hoursSinceGeneration = (Date.now() - lastGenerated) / (1000 * 60 * 60);
    const isStale = hoursSinceGeneration > 24;
    
    return {
      success: true,
      status: isStale ? 'stale' : 'ready',
      lastGenerated: lastGenerated,
      hoursSinceGeneration: Math.round(hoursSinceGeneration * 10) / 10
    };
    
  } catch (error) {
    console.error('Failed to get wrapped status:', error);
    return { success: false, error: error.message };
  }
}

async function handleAchievementUnlock(achievement) {
  try {
    const result = await chrome.storage.local.get('siege_unlocked_achievements');
    const unlocked = result.siege_unlocked_achievements || [];
    
    if (!unlocked.find(a => a.id === achievement.id)) {
      unlocked.push({
        ...achievement,
        unlockedAt: Date.now()
      });
      
      await chrome.storage.local.set({
        siege_unlocked_achievements: unlocked
      });
      
      await showNotification(
        NOTIFICATION_IDS.WRAPPED_ACHIEVEMENT,
        `Achievement Unlocked: ${achievement.name}`,
        achievement.description
      );
    }
    
  } catch (error) {
    console.error('Failed to handle achievement unlock:', error);
    throw error;
  }
}

console.log('Magical Siege service worker loaded');
