const DEFAULTS = {
  theme: 'default'
};

async function loadSettings() {
  const result = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULTS, ...(result.settings || {}) };
  
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

function openLeaderboard() {
  chrome.tabs.create({ url: 'https://siege.hackclub.com/keep' });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset.theme;
      saveTheme(theme);
    });
  });
  
  document.getElementById('open-siege').addEventListener('click', openSiege);
  document.getElementById('open-leaderboard').addEventListener('click', openLeaderboard);
});

console.log('Magical Siege popup loaded');
