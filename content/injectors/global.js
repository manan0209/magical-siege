import { Settings } from '../utils/storage.js';
import { Theme } from '../utils/theme.js';

export function injectGlobalEnhancements() {
  console.log('Global enhancements loaded');
  
  initializeTheme();
  injectFloatingActionButton();
  injectThemeIndicator();
  setupKeyboardShortcuts();
}

async function initializeTheme() {
  await Theme.applyStoredTheme();
  updateThemeIndicator();
}

function injectThemeIndicator() {
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  indicator.addEventListener('click', async () => {
    const newTheme = await Theme.cycleTheme();
    updateThemeIndicator();
    const themeNames = { default: 'Default', magical: 'Magical', dark: 'Dark Mode' };
    showNotification(`Theme: ${themeNames[newTheme]}`);
  });
  
  indicator.addEventListener('mouseover', () => {
    indicator.style.transform = 'scale(1.05)';
  });
  
  indicator.addEventListener('mouseout', () => {
    indicator.style.transform = 'scale(1)';
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
    dark: 'Dark Mode'
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
  } else {
    indicator.style.background = 'rgba(255,255,255,0.95)';
    indicator.style.color = '#3b2a1a';
    indicator.style.borderColor = 'rgba(64,43,32,0.75)';
  }
}

async function injectFloatingActionButton() {
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
    const themeNames = { default: 'Default', magical: 'Magical', dark: 'Dark Mode' };
    showNotification(`Theme: ${themeNames[newTheme]}`);
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
        const themeNames = { default: 'Default', magical: 'Magical', dark: 'Dark Mode' };
        showNotification(`Theme: ${themeNames[newTheme]}`);
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
