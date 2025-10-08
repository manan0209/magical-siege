import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';
import { Settings } from '../utils/storage.js';
import { Theme } from '../utils/theme.js';

export function injectGlobalEnhancements() {
  console.log('Global enhancements loaded');
  
  initializeTheme();
  injectTopNavigationBar();
  setupNotificationSystem();
  setupKeyboardShortcuts();
}

async function initializeTheme() {
  await Theme.applyStoredTheme();
}

async function injectTopNavigationBar() {
  const settings = await Settings.getAll();
  
  if (!settings.showTopBar) {
    return;
  }
  
  const userData = DOMExtractor.getUserData();
  const weekInfo = DOMExtractor.getWeekInfo();
  const progressData = DOMExtractor.getProgressData();
  const timeRemaining = TimeUtils.getTimeRemaining();
  
  const topBar = document.createElement('div');
  topBar.id = 'ms-top-bar';
  topBar.className = 'ms-topbar';
  
  function updateTopBar() {
    const time = TimeUtils.getTimeRemaining();
    const hoursLeft = progressData.goalHours - progressData.hoursThisWeek;
    const progressPercent = Math.min((progressData.hoursThisWeek / progressData.goalHours) * 100, 100);
    
    topBar.innerHTML = `
      <div class="ms-topbar-section">
        <span class="font-bold text-lg">Magical Siege</span>
        <span class="text-xs opacity-75">Week ${weekInfo.currentWeek || '?'}</span>
      </div>
      
      <div class="ms-topbar-section">
        <div class="text-center">
          <div class="text-xs opacity-75">Progress</div>
          <div class="font-bold">${progressData.hoursThisWeek.toFixed(1)}h / ${progressData.goalHours}h</div>
        </div>
        
        <div class="w-32 h-2 bg-parchment rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-purple-light to-purple-primary transition-all duration-300" 
               style="width: ${progressPercent}%"></div>
        </div>
        
        <div class="text-center">
          <div class="text-xs opacity-75">Deadline</div>
          <div class="font-bold">${time.days}d ${time.hours}h ${time.minutes}m</div>
        </div>
      </div>
      
      <div class="ms-topbar-section">
        ${userData.coins !== null ? `
          <div class="text-center">
            <div class="text-xs opacity-75">Coins</div>
            <div class="font-bold text-yellow-300">${userData.coins}</div>
          </div>
        ` : ''}
        
        ${userData.rank !== null ? `
          <div class="text-center">
            <div class="text-xs opacity-75">Rank</div>
            <div class="font-bold">#${userData.rank}</div>
          </div>
        ` : ''}
        
        <button id="ms-theme-toggle" class="ms-button text-xs px-3 py-1 mr-2" title="Toggle Theme (D)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        </button>
        
        <button id="ms-settings-btn" class="ms-button text-xs px-3 py-1">
          Settings
        </button>
      </div>
    `;
  }
  
  updateTopBar();
  setInterval(updateTopBar, 60000);
  
  document.body.insertBefore(topBar, document.body.firstChild);
  document.body.style.paddingTop = '60px';
  
  const themeToggle = document.getElementById('ms-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', async () => {
      const newTheme = await Theme.toggleDarkMode();
      showInPageNotification(
        'Theme Changed',
        `Switched to ${Theme.THEMES[newTheme].name}`,
        'info'
      );
    });
  }
  
  const settingsBtn = document.getElementById('ms-settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
    });
  }
}

function setupNotificationSystem() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_REQUEST') {
      const userData = DOMExtractor.getUserData();
      const progressData = DOMExtractor.getProgressData();
      const weekInfo = DOMExtractor.getWeekInfo();
      
      sendResponse({
        success: true,
        data: { userData, progressData, weekInfo }
      });
    }
  });
  
  checkMilestones();
}

async function checkMilestones() {
  const settings = await Settings.getAll();
  
  if (!settings.progressUpdates) {
    return;
  }
  
  const progressData = DOMExtractor.getProgressData();
  const hoursCompleted = progressData.hoursThisWeek;
  const goalHours = progressData.goalHours;
  
  const milestones = [
    { threshold: 2.5, message: '25% there! Keep the momentum going.' },
    { threshold: 5.0, message: 'Halfway done! You are crushing it.' },
    { threshold: 7.5, message: '75% complete! The finish line is near.' },
    { threshold: 10.0, message: 'Goal reached! You are a true Sieger.' }
  ];
  
  for (const milestone of milestones) {
    const storageKey = `milestone_week_${DOMExtractor.getWeekInfo().currentWeek}_${milestone.threshold}`;
    const alreadyShown = await chrome.storage.local.get(storageKey);
    
    if (hoursCompleted >= milestone.threshold && !alreadyShown[storageKey]) {
      showInPageNotification(
        'Milestone Reached',
        milestone.message,
        'success'
      );
      
      await chrome.storage.local.set({ [storageKey]: true });
    }
  }
}

function showInPageNotification(title, message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `ms-widget fixed bottom-4 right-4 z-50 max-w-sm shadow-2xl ms-slide-in`;
  
  const bgColor = type === 'success' ? 'bg-green-50' : 
                  type === 'warning' ? 'bg-yellow-50' : 
                  type === 'error' ? 'bg-red-50' : 
                  'bg-blue-50';
  
  const iconColor = type === 'success' ? 'text-green-600' : 
                    type === 'warning' ? 'text-yellow-600' : 
                    type === 'error' ? 'text-red-600' : 
                    'text-blue-600';
  
  notification.innerHTML = `
    <div class="${bgColor} p-4 rounded-lg">
      <div class="flex items-start">
        <div class="flex-1">
          <h3 class="font-bold ${iconColor} mb-1">${title}</h3>
          <p class="text-sm text-gray-700">${message}</p>
        </div>
        <button class="ms-notification-close ml-2 text-gray-500 hover:text-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  const closeBtn = notification.querySelector('.ms-notification-close');
  closeBtn.addEventListener('click', () => {
    notification.remove();
  });
  
  setTimeout(() => {
    notification.remove();
  }, 8000);
}

async function setupKeyboardShortcuts() {
  const settings = await Settings.getAll();
  
  if (!settings.keyboardShortcuts) {
    return;
  }
  
  const shortcuts = {
    'k': () => window.location.href = 'https://siege.hackclub.com/keep',
    'a': () => window.location.href = 'https://siege.hackclub.com/armory',
    'h': () => window.location.href = 'https://siege.hackclub.com/great-hall',
    'm': () => window.location.href = 'https://siege.hackclub.com/market',
    'c': () => window.location.href = 'https://siege.hackclub.com/castle',
    's': () => chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' }),
    'd': () => toggleTheme(),
    '?': () => showShortcutsHelp(),
    'r': () => location.reload(),
    't': () => toggleTopBar()
  };
  
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }
    
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    
    const handler = shortcuts[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  });
  
  showInPageNotification(
    'Keyboard Shortcuts Active',
    'Press ? to see all available shortcuts',
    'info'
  );
}

function showShortcutsHelp() {
  const helpOverlay = document.createElement('div');
  helpOverlay.id = 'ms-shortcuts-help';
  helpOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
  
  helpOverlay.innerHTML = `
    <div class="ms-widget max-w-2xl m-4 animate-fade-in">
      <div class="ms-widget-header flex items-center justify-between">
        <span>Keyboard Shortcuts</span>
        <button id="ms-close-help" class="text-parchment hover:text-white">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      <div class="ms-widget-content">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <h3 class="font-bold text-purple-primary mb-3">Navigation</h3>
            <div class="flex justify-between items-center">
              <span class="text-sm">Keep Page</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">K</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Armory</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">A</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Great Hall</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">H</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Market</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">M</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Castle</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">C</kbd>
            </div>
          </div>
          
          <div class="space-y-2">
            <h3 class="font-bold text-purple-primary mb-3">Actions</h3>
            <div class="flex justify-between items-center">
              <span class="text-sm">Settings</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">S</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Toggle Theme</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">D</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Reload Page</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">R</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Toggle Top Bar</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">T</kbd>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm">Show This Help</span>
              <kbd class="px-2 py-1 bg-parchment border-2 border-castle-brown rounded text-sm font-mono">?</kbd>
            </div>
          </div>
        </div>
        
        <div class="ms-divider"></div>
        
        <div class="text-center text-sm text-gray-600">
          Shortcuts work on any page except when typing in input fields
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(helpOverlay);
  
  const closeHelp = () => helpOverlay.remove();
  
  document.getElementById('ms-close-help').addEventListener('click', closeHelp);
  helpOverlay.addEventListener('click', (e) => {
    if (e.target === helpOverlay) {
      closeHelp();
    }
  });
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeHelp();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

async function toggleTopBar() {
  const topBar = document.getElementById('ms-top-bar');
  if (topBar) {
    const isHidden = topBar.style.display === 'none';
    topBar.style.display = isHidden ? 'flex' : 'none';
    document.body.style.paddingTop = isHidden ? '60px' : '0';
    
    await Settings.set('showTopBar', isHidden);
    
    showInPageNotification(
      'Top Bar ' + (isHidden ? 'Shown' : 'Hidden'),
      'Press T to toggle again',
      'info'
    );
  }
}

async function toggleTheme() {
  const newTheme = await Theme.toggleDarkMode();
  showInPageNotification(
    'Theme Changed',
    `Switched to ${Theme.THEMES[newTheme].name}`,
    'info'
  );
}