const DEFAULTS = {
  theme: 'default',
  notificationsEnabled: true,
  deadlineReminders: true,
  progressUpdates: true,
  votingAlerts: true,
  showTopBar: true,
  keyboardShortcuts: true,
  autoSync: true,
  syncInterval: 5
};

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };
  
  document.getElementById('theme-select').value = settings.theme || 'default';
  document.getElementById('show-topbar').checked = settings.showTopBar !== false;
  document.getElementById('notifications-enabled').checked = settings.notificationsEnabled !== false;
  document.getElementById('deadline-reminders').checked = settings.deadlineReminders !== false;
  document.getElementById('voting-alerts').checked = settings.votingAlerts !== false;
  document.getElementById('progress-updates').checked = settings.progressUpdates !== false;
  document.getElementById('keyboard-shortcuts').checked = settings.keyboardShortcuts !== false;
  document.getElementById('auto-sync').checked = settings.autoSync !== false;
  document.getElementById('sync-interval').value = settings.syncInterval || 5;
}

async function saveSettings() {
  const settings = {
    theme: document.getElementById('theme-select').value,
    showTopBar: document.getElementById('show-topbar').checked,
    notificationsEnabled: document.getElementById('notifications-enabled').checked,
    deadlineReminders: document.getElementById('deadline-reminders').checked,
    votingAlerts: document.getElementById('voting-alerts').checked,
    progressUpdates: document.getElementById('progress-updates').checked,
    keyboardShortcuts: document.getElementById('keyboard-shortcuts').checked,
    autoSync: document.getElementById('auto-sync').checked,
    syncInterval: parseInt(document.getElementById('sync-interval').value)
  };
  
  await chrome.storage.local.set({ settings });
  
  showSaveStatus('Settings saved');
  
  const tabs = await chrome.tabs.query({ url: 'https://siege.hackclub.com/*' });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings }).catch(() => {});
  }
}

function showSaveStatus(message) {
  const status = document.getElementById('save-status');
  status.textContent = message;
  status.className = 'save-status show';
  
  setTimeout(() => {
    status.className = 'save-status';
  }, 2000);
}

async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to default?')) {
    await chrome.storage.local.set({ settings: DEFAULTS });
    await loadSettings();
    showSaveStatus('Settings reset to default');
  }
}

function openSiege() {
  chrome.tabs.create({ url: 'https://siege.hackclub.com/' });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('change', saveSettings);
  });
  
  document.getElementById('reset-settings').addEventListener('click', resetSettings);
  document.getElementById('open-siege').addEventListener('click', openSiege);
});

console.log('Magical Siege popup loaded');
