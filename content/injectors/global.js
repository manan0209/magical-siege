import { Settings } from '../utils/storage.js';
import { Theme } from '../utils/theme.js';
import { TimeUtils } from '../utils/time.js';
import { injectXRayButtons, createEmbeddedXRay } from './xray-scanner.js';

export function injectGlobalEnhancements() {
  initializeTheme();
  injectFloatingActionButton();
  injectThemeIndicator();
  injectTreasuryButton();
  injectWeekCountdown();
  setupKeyboardShortcuts();
  setupMessageListener();
  injectXRayOnReviewPage();
}

function injectXRayOnReviewPage() {
  if (!window.location.pathname.startsWith('/review')) {
    return;
  }

  if (window.location.pathname.match(/\/review\/projects\/\d+/)) {
    injectXRayOnIndividualProject();
  } else {
    const checkForProjects = () => {
      const mainContainer = document.querySelector('main') || document.body;
      const projectCards = document.querySelectorAll('.project-card, [data-project], .review-project');
      
      if (projectCards.length > 0) {
        injectXRayButtons(mainContainer, '.project-card, [data-project], .review-project');
      } else {
        setTimeout(checkForProjects, 500);
      }
    };

    setTimeout(checkForProjects, 1000);
  }
}

function injectXRayOnIndividualProject() {
  const checkForCommitSection = () => {
    const repoButton = document.querySelector('a[href*="github.com"]');
    
    if (!repoButton) {
      setTimeout(checkForCommitSection, 500);
      return;
    }

    const repoUrl = repoButton.href;
    
    const commitLabel = Array.from(document.querySelectorAll('.detail-label')).find(el => 
      el.textContent.includes('GitHub Commit Activity')
    );

    if (!commitLabel) {
      setTimeout(checkForCommitSection, 500);
      return;
    }

    const detailField = commitLabel.closest('.detail-field');
    if (!detailField) {
      setTimeout(checkForCommitSection, 500);
      return;
    }

    const commitGraph = detailField.querySelector('#commit-graph');
    if (commitGraph) {
      commitGraph.remove();
    }

    commitLabel.textContent = 'Repository X-Ray Analysis';
    
    const xrayContainer = document.createElement('div');
    xrayContainer.id = 'xray-embedded-container';
    xrayContainer.style.cssText = `
      margin-top: 1rem;
    `;

    detailField.appendChild(xrayContainer);

    createEmbeddedXRay(repoUrl, xrayContainer);
  };

  setTimeout(checkForCommitSection, 1000);
}

//if you are here, jk i am on track this week, i might not even buy merc this week and already have like 102 coins with me I am rich and happy :yayyy:

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_UPDATED' && message.settings) {
      if (message.settings.theme) {
        Theme.setTheme(message.settings.theme).then(() => {
          updateThemeIndicator();
          updateTreasuryButton();
          updateWeekCountdown();
        });
      }
    }
  });
}

async function initializeTheme() {
  await Theme.applyStoredTheme();
  updateThemeIndicator();
}

function injectThemeIndicator() {
  if (document.getElementById('ms-theme-indicator')) {
    return;
  }
  
  const indicator = document.createElement('div');
  indicator.id = 'ms-theme-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9998;
    background: rgba(255,255,255,0.95);
    border: 2px solid rgba(64,43,32,0.75);
    border-radius: 12px;
    padding: 0.5rem 1rem;
    font-family: 'IM Fell English', serif;
    font-size: 0.875rem;
    color: #3b2a1a;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    white-space: nowrap;
  `;
  
  indicator.addEventListener('click', async () => {
    const newTheme = await Theme.cycleTheme();
    updateThemeIndicator();
    updateTreasuryButton();
    updateWeekCountdown();
  });
  
  indicator.addEventListener('mouseover', () => {
    indicator.style.opacity = '0.85';
  });
  
  indicator.addEventListener('mouseout', () => {
    indicator.style.opacity = '1';
  });
  
  document.body.appendChild(indicator);
  updateThemeIndicator();
}

async function updateThemeIndicator() {
  const indicator = document.getElementById('ms-theme-indicator');
  if (!indicator) return;
  
  const theme = await Theme.getCurrentTheme();
  const themeNames = {
    default: 'Default',
    magical: 'Magical',
    dark: 'Dark',
    space: 'Space',
    winter: 'Winter'
  };
  
  indicator.textContent = `Theme: ${themeNames[theme]}`;
  
  if (theme === 'dark') {
    indicator.style.background = '#2a2a2a';
    indicator.style.color = '#f5f5f4';
    indicator.style.borderColor = 'rgba(245, 245, 244, 0.2)';
  } else if (theme === 'magical') {
    indicator.style.background = 'rgba(139, 92, 246, 0.1)';
    indicator.style.color = '#6D28D9';
    indicator.style.borderColor = '#8B5CF6';
  } else if (theme === 'space') {
    indicator.style.background = 'rgba(0, 0, 0, 0.8)';
    indicator.style.color = '#00d9ff';
    indicator.style.borderColor = '#00d9ff';
  } else if (theme === 'winter') {
    indicator.style.background = 'rgba(255, 255, 255, 0.15)';
    indicator.style.backdropFilter = 'blur(20px)';
    indicator.style.color = '#0c4a6e';
    indicator.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  } else {
    indicator.style.background = 'rgba(255,255,255,0.95)';
    indicator.style.color = '#3b2a1a';
    indicator.style.borderColor = 'rgba(64,43,32,0.75)';
  }
}

function injectTreasuryButton() {
  if (document.getElementById('ms-treasury-button')) {
    return;
  }
  
  const treasuryBtn = document.createElement('div');
  treasuryBtn.id = 'ms-treasury-button';
  treasuryBtn.style.cssText = `
    position: fixed;
    top: 4rem;
    right: 1rem;
    z-index: 9998;
    background: rgba(255,255,255,0.95);
    border: 2px solid #d4a574;
    border-radius: 12px;
    padding: 0.5rem 1rem;
    font-family: 'IM Fell English', serif;
    font-size: 0.875rem;
    color: #3b2a1a;
    cursor: pointer;
    transition: all 0.2s ease;
    outline: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
    white-space: nowrap;
    box-shadow: 0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3);
    animation: treasuryGlow 2s ease-in-out infinite;
  `;
  
  treasuryBtn.textContent = 'Treasury';
  
  treasuryBtn.addEventListener('click', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'g',
      shiftKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  });
  
  treasuryBtn.addEventListener('mouseover', () => {
    treasuryBtn.style.opacity = '0.85';
  });
  
  treasuryBtn.addEventListener('mouseout', () => {
    treasuryBtn.style.opacity = '1';
  });
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes treasuryGlow {
      0%, 100% {
        box-shadow: 0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3);
      }
      50% {
        box-shadow: 0 0 20px rgba(212, 165, 116, 0.8), 0 0 40px rgba(212, 165, 116, 0.4);
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(treasuryBtn);
  updateTreasuryButton();
}

async function updateTreasuryButton() {
  const treasuryBtn = document.getElementById('ms-treasury-button');
  if (!treasuryBtn) return;
  
  const theme = await Theme.getCurrentTheme();
  
  if (theme === 'dark') {
    treasuryBtn.style.background = '#2a2a2a';
    treasuryBtn.style.color = '#f5f5f4';
    treasuryBtn.style.borderColor = '#d4a574';
    treasuryBtn.style.boxShadow = '0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3)';
  } else if (theme === 'magical') {
    treasuryBtn.style.background = 'rgba(139, 92, 246, 0.1)';
    treasuryBtn.style.color = '#6D28D9';
    treasuryBtn.style.borderColor = '#d4a574';
    treasuryBtn.style.boxShadow = '0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3)';
  } else if (theme === 'winter') {
    treasuryBtn.style.background = 'rgba(255, 255, 255, 0.15)';
    treasuryBtn.style.backdropFilter = 'blur(20px)';
    treasuryBtn.style.color = '#0c4a6e';
    treasuryBtn.style.borderColor = '#d4a574';
    treasuryBtn.style.boxShadow = '0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3)';
  } else {
    treasuryBtn.style.background = 'rgba(255,255,255,0.95)';
    treasuryBtn.style.color = '#3b2a1a';
    treasuryBtn.style.borderColor = '#d4a574';
    treasuryBtn.style.boxShadow = '0 0 12px rgba(212, 165, 116, 0.6), 0 0 24px rgba(212, 165, 116, 0.3)';
  }
}

function injectWeekCountdown() {
  if (document.getElementById('ms-week-countdown')) {
    return;
  }
  
  const countdown = document.createElement('div');
  countdown.id = 'ms-week-countdown';
  countdown.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 10rem;
    z-index: 9998;
    background: rgba(255,255,255,0.95);
    border: 2px solid rgba(64,43,32,0.75);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-family: 'IM Fell English', serif;
    color: #3b2a1a;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    min-width: 200px;
  `;
  
  //ello, if you are seeing this, if you are seeing this, have a cupcake (nooo not mee please :hehe:)
  
  countdown.innerHTML = `
    <div style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 0.25rem; text-align: center;">
      Week Ends In
    </div>
    <div id="ms-countdown-time" style="font-size: 1.25rem; font-weight: 700; font-family: 'Jaini', serif; text-align: center;">
      Loading...
    </div>
  `;
  
  document.body.appendChild(countdown);
  
  updateWeekCountdown();
  setInterval(updateWeekCountdown, 1000);
}

function updateWeekCountdown() {
  const countdownElement = document.getElementById('ms-countdown-time');
  const countdownContainer = document.getElementById('ms-week-countdown');
  if (!countdownElement || !countdownContainer) return;
  
  const timeRemaining = TimeUtils.getTimeRemaining();
  
  if (timeRemaining.total <= 0) {
    countdownElement.textContent = 'Week Ended!';
    applyCountdownTheme(countdownContainer, countdownElement, 'ended');
    return;
  }
  
  const parts = [];
  
  if (timeRemaining.days > 0) {
    parts.push(`${timeRemaining.days}d`);
  }
  if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
    parts.push(`${timeRemaining.hours}h`);
  }
  parts.push(`${timeRemaining.minutes}m`);
  parts.push(`${timeRemaining.seconds}s`);
  
  countdownElement.textContent = parts.join(' ');
  
  let urgency = 'normal';
  if (timeRemaining.days === 0 && timeRemaining.hours < 6) {
    urgency = 'critical';
  } else if (timeRemaining.days === 0 && timeRemaining.hours < 24) {
    urgency = 'warning';
  }
  
  applyCountdownTheme(countdownContainer, countdownElement, urgency);
}

function applyCountdownTheme(container, element, urgency) {
  const theme = document.body.getAttribute('data-ms-theme') || 'default';
  
  if (theme === 'dark') {
    container.style.background = '#2a2a2a';
    container.style.borderColor = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : 'rgba(245, 245, 244, 0.2)';
    element.style.color = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#e8dcc8';
  } else if (theme === 'magical') {
    container.style.background = 'rgba(139, 92, 246, 0.1)';
    container.style.borderColor = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#8B5CF6';
    element.style.color = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#6D28D9';
  } else if (theme === 'winter') {
    container.style.background = 'rgba(255, 255, 255, 0.15)';
    container.style.backdropFilter = 'blur(20px)';
    container.style.borderColor = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)';
    element.style.color = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#0c4a6e';
  } else {
    container.style.background = 'rgba(255,255,255,0.95)';
    container.style.borderColor = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : 'rgba(64,43,32,0.75)';
    element.style.color = urgency === 'critical' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#3b2a1a';
  }
}

async function injectFloatingActionButton() {
  if (document.getElementById('ms-fab')) {
    return;
  }
  
  const settings = await Settings.getAll();
  
  const fab = document.createElement('div');
  fab.id = 'ms-fab';
  fab.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  `;
  
  fab.innerHTML = `
    <div id="ms-fab-menu" style="display: none; background: rgba(255,255,255,0.95); border: 2px solid rgba(64,43,32,0.75); border-radius: 12px; padding: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
      <button id="ms-theme-toggle" style="display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-family: 'IM Fell English', serif; color: #3b2a1a; border-radius: 6px;" onmouseover="this.style.background='rgba(64,43,32,0.1)'" onmouseout="this.style.background='none'">
        Cycle Theme (T)
      </button>
      <button id="ms-refresh-data" style="display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-family: 'IM Fell English', serif; color: #3b2a1a; border-radius: 6px;" onmouseover="this.style.background='rgba(64,43,32,0.1)'" onmouseout="this.style.background='none'">
        Refresh Data (R)
      </button>
      <button id="ms-help" style="display: block; width: 100%; text-align: left; padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-family: 'IM Fell English', serif; color: #3b2a1a; border-radius: 6px;" onmouseover="this.style.background='rgba(64,43,32,0.1)'" onmouseout="this.style.background='none'">
        Shortcuts (?)
      </button>
    </div>
    <button id="ms-fab-button" style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); border: 3px solid rgba(64,43,32,0.75); box-shadow: 0 4px 12px rgba(0,0,0,0.2); cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: bold; font-family: 'Jaini', serif; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
      M
    </button>
  `;
  
  document.body.appendChild(fab);
  
  const fabButton = document.getElementById('ms-fab-button');
  const fabMenu = document.getElementById('ms-fab-menu');
  
  let menuOpen = false;
  fabButton.addEventListener('click', () => {
    menuOpen = !menuOpen;
    fabMenu.style.display = menuOpen ? 'block' : 'none';
  });
  
  document.getElementById('ms-theme-toggle')?.addEventListener('click', async () => {
    const newTheme = await Theme.cycleTheme();
    updateThemeIndicator();
    updateTreasuryButton();
    updateWeekCountdown();
    menuOpen = false;
    fabMenu.style.display = 'none';
  });
  
  document.getElementById('ms-refresh-data')?.addEventListener('click', () => {
    window.location.reload();
  });
  
  document.getElementById('ms-help')?.addEventListener('click', () => {
    showShortcutsModal();
    menuOpen = false;
    fabMenu.style.display = 'none';
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: rgba(255,255,255,0.95);
    border: 2px solid rgba(64,43,32,0.75);
    border-radius: 12px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: 'IM Fell English', serif;
    color: #3b2a1a;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function showShortcutsModal() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="background: #f5f5f4 url('/assets/parchment-texture-*.jpg'); border: 3px solid rgba(64,43,32,0.75); border-radius: 16px; padding: 2rem; max-width: 500px; width: 90%; font-family: 'IM Fell English', serif; color: #3b2a1a;">
      <h2 style="font-family: 'Jaini', serif; font-size: 2rem; margin: 0 0 1rem 0; text-align: center;">Keyboard Shortcuts</h2>
      <div style="display: grid; gap: 0.5rem;">
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>K</strong></span><span>Go to Keep</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>A</strong></span><span>Go to Armory</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>H</strong></span><span>Go to Great Hall</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>M</strong></span><span>Go to Market</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>C</strong></span><span>Go to Chambers</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>T</strong></span><span>Cycle Theme</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>R</strong></span><span>Refresh Data</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px dashed rgba(64,43,32,0.3);">
          <span><strong>Shift+G</strong></span><span>Open Treasury</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 0.5rem;">
          <span><strong>?</strong></span><span>Show this help</span>
        </div>
      </div>
      <button id="ms-shortcuts-close" style="margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; border: 2px solid rgba(64,43,32,0.75); border-radius: 8px; cursor: pointer; font-family: 'IM Fell English', serif; font-size: 1rem; font-weight: 600;">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.id === 'ms-shortcuts-close') {
      modal.remove();
    }
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', async (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    switch(e.key.toLowerCase()) {
      case 'k':
        window.location.href = '/keep';
        break;
      case 'a':
        window.location.href = '/projects';
        break;
      case 'h':
        window.location.href = '/great_hall';
        break;
      case 'm':
        window.location.href = '/market';
        break;
      case 'c':
        window.location.href = '/chambers';
        break;
      case 't':
        e.preventDefault();
        const newTheme = await Theme.cycleTheme();
        updateThemeIndicator();
        updateTreasuryButton();
        updateWeekCountdown();
        break;
      case 'r':
        e.preventDefault();
        window.location.reload();
        break;
      case '?':
        e.preventDefault();
        showShortcutsModal();
        break;
    }
  });
}
