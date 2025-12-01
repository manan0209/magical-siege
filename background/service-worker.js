const ALARM_NAMES = {
  DEADLINE_CHECK: 'deadlineCheck',
  VOTING_CHECK: 'votingCheck',
  SYNC_DATA: 'syncData'
};

const NOTIFICATION_IDS = {
  DEADLINE_SOON: 'deadlineSoon',
  VOTING_STARTED: 'votingStarted',
  VOTING_ENDING: 'votingEnding'
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

console.log('Magical Siege service worker loaded');
