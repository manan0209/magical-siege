import { DOMExtractor } from '../utils/dom-extractor.js';
import { TimeUtils } from '../utils/time.js';
import { Settings } from '../utils/storage.js';

export function injectGlobalEnhancements() {
  console.log('Global enhancements loaded');
  
  injectTopNavigationBar();
  setupNotificationSystem();
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
