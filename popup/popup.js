const DEFAULTS = {
  theme: 'default'
};

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };
  //
  const currentTheme = settings.theme || 'default';
  document.querySelectorAll('.theme-card').forEach(card => {
    if (card.dataset.theme === currentTheme) {
      card.classList.add('active');
    }
  });
}

async function saveTheme(theme) {
  const settings = { theme };
  await chrome.storage.local.set({ settings });
  
  showSaveStatus(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme activated`);
  
  const tabs = await chrome.tabs.query({ url: 'https://siege.hackclub.com/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings }).catch(() => {});
  }
  
  document.querySelectorAll('.theme-card').forEach(card => {
    card.classList.remove('active');
  });
  document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
}

function showSaveStatus(message) {
  const status = document.getElementById('save-status');
  status.textContent = message;
  status.className = 'save-status show';
  
  setTimeout(() => {
    status.className = 'save-status';
  }, 2000);
}

function openSiege() {
  chrome.tabs.create({ url: 'https://siege.hackclub.com/' });
}

const BACKEND_URL = 'https://magical-siege-backend.siegelb.workers.dev';

const SIGNAL_TYPES = {
  POKE: { 
    id: 'poke', 
    label: 'Poke', 
    description: 'Poked you :hehe !',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
  },
  WAKEUP: { 
    id: 'wakeup', 
    label: 'Wake Up', 
    description: 'Wake up and code!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
  },
  CELEBRATE: { 
    id: 'Whoa', 
    label: 'Whoa', 
    description: 'You are ducking rich!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>'
  },
  SLOWDOWN: { 
    id: 'SlowDown', 
    label: 'Coffee', 
    description: 'Take a break man, leave some coins for me too!',
    icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>'
  }
};

async function getUsernameFromKeep() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://siege.hackclub.com/keep' });
    if (tabs.length > 0) {
      const result = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_USERNAME' });
      return result?.username || null;
    }
  } catch (error) {
    console.warn('Could not get username from Keep page', error);
  }
  return null;
}

async function getUsername() {
  let username = localStorage.getItem('ms-username');
  
  if (!username) {
    username = await getUsernameFromKeep();
    if (username) {
      localStorage.setItem('ms-username', username);
    }
  }
  
  return username || 'Anonymous';
}

async function loadSignals() {
  const username = await getUsername();
  
  if (username === 'Anonymous') {
    document.getElementById('signals-list').innerHTML = `
      <div class="signals-empty">
        <div>Visit siege.hackclub.com/keep to sync your username</div>
      </div>
    `;
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/signals/${username}`, {
      method: 'GET',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch signals');
    }
    
    const signals = await response.json();
    displaySignals(signals);
    updateBadge(signals);
    
    const unreadIds = signals.filter(s => !s.read).map(s => s.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  } catch (error) {
    console.warn('Failed to load signals:', error);
    document.getElementById('signals-list').innerHTML = `
      <div class="signals-empty">
        <div>Failed to load signals</div>
      </div>
    `;
  }
}

function displaySignals(signals) {
  const list = document.getElementById('signals-list');
  
  if (signals.length === 0) {
    list.innerHTML = `
      <div class="signals-empty">
        <div>No pokes yet</div>
        <div style="margin-top: 0.5rem; font-size: 0.85rem;">
          Open the leaderboard to poke fellow siegers!
        </div>
      </div>
    `;
    return;
  }
  
  list.innerHTML = signals.map(signal => {
    const timestamp = formatTimestamp(signal.timestamp);
    
    return `
      <div class="signal-item ${!signal.read ? 'unread' : ''}">
        <div class="signal-message">
          <span>${signal.from} poked you</span>
        </div>
        <div class="signal-time">${timestamp}</div>
      </div>
    `;
  }).join('');
}

function updateBadge(signals) {
  const unread = signals.filter(s => !s.read).length;
  const badge = document.getElementById('signal-badge');
  
  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = 'block';
    chrome.action.setBadgeText({ text: unread.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
  } else {
    badge.style.display = 'none';
    chrome.action.setBadgeText({ text: '' });
  }
}

async function markAsRead(signalIds) {
  try {
    await fetch(`${BACKEND_URL}/signal/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ signalIds })
    });
  } catch (error) {
    console.warn('Failed to mark signals as read:', error);
  }
}

function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function showSignalsPanel() {
  document.getElementById('signals-panel').style.display = 'flex';
  loadSignals();
}

function hideSignalsPanel() {
  document.getElementById('signals-panel').style.display = 'none';
}

function showToastInPopup(message, type = 'info') {
  const status = document.getElementById('save-status');
  status.textContent = message;
  status.className = `save-status show ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
  
  setTimeout(() => {
    status.className = 'save-status';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  const username = await getUsername();
  if (username !== 'Anonymous') {
    const signals = await fetch(`${BACKEND_URL}/signals/${username}`, { mode: 'cors' })
      .then(r => r.json())
      .catch(() => []);
    updateBadge(signals);
  }
  
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      saveTheme(theme);
    });
  });
  
  document.getElementById('open-siege').addEventListener('click', openSiege);
  document.getElementById('open-signals').addEventListener('click', showSignalsPanel);
  document.getElementById('close-signals').addEventListener('click', hideSignalsPanel);
});

chrome.alarms.create('checkSignals', { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkSignals') {
    const username = await getUsername();
    if (username !== 'Anonymous') {
      try {
        const response = await fetch(`${BACKEND_URL}/signals/${username}`, { mode: 'cors' });
        const signals = await response.json();
        const unread = signals.filter(s => !s.read).length;
        
        if (unread > 0) {
          chrome.action.setBadgeText({ text: unread.toString() });
          chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
      } catch (error) {
        console.warn('Failed to check signals:', error);
      }
    }
  }
});

console.log('Magical Siege popup loaded');
