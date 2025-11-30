import { Settings } from './storage.js';

export const Theme = {
  THEMES: {
    default: {
      name: 'Default',
      vars: {}
    },
    magical: {
      name: 'Magical',
      vars: {
        '--ms-magical-purple': '#8B5CF6',
        '--ms-magical-purple-dark': '#6D28D9',
        '--ms-magical-purple-light': '#A78BFA',
        '--ms-magical-glow': 'rgba(139, 92, 246, 0.3)'
      }
    },
    dark: {
      name: 'Dark Mode',
      vars: {
        '--ms-dark-bg': '#2d1f1a',
        '--ms-dark-card': 'rgba(45, 31, 26, 0.95)',
        '--ms-dark-text': '#e8dcc8',
        '--ms-dark-border': 'rgba(232, 220, 200, 0.15)',
        '--ms-dark-accent': '#785437'
      }
    },
    space: {
      name: 'Space',
      vars: {
        '--ms-space-bg': '#090a0f',
        '--ms-space-card': 'rgba(15, 23, 42, 0.85)',
        '--ms-space-text': '#e0e6ed',
        '--ms-space-border': 'rgba(0, 217, 255, 0.3)',
        '--ms-space-accent': '#00d9ff'
      }
    },
    winter: {
      name: 'Winter',
      vars: {
        '--ms-winter-primary': '#EDF3F8',
        '--ms-winter-secondary': '#bae6fd',
        '--ms-winter-accent': '#1C4C6B',
        '--ms-winter-glass': 'rgba(255, 255, 255, 0.15)',
        '--ms-winter-border': 'rgba(255, 255, 255, 0.3)',
        '--ms-winter-shadow': 'rgba(28, 76, 107, 0.1)'
      }
    }
  },

  async getCurrentTheme() {
    const themeName = await Settings.get('theme');
    return themeName || 'default';
  },

  async setTheme(themeName) {
    if (!this.THEMES[themeName]) {
      return false;
    }

    const theme = this.THEMES[themeName];
    
    document.body.classList.remove('ms-theme-default', 'ms-theme-magical', 'ms-theme-dark', 'ms-theme-space', 'ms-theme-winter');
    document.body.classList.add(`ms-theme-${themeName}`);
    
    Object.entries(theme.vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    await Settings.set('theme', themeName);
    document.body.setAttribute('data-ms-theme', themeName);
    
    if (themeName === 'magical') {
      this.applyMagicalCursor();
      this.removeFlashlightEffect();
      this.removeDarkCursor();
      this.removeSpaceCursor();
      this.removeWinterBackground();
    } else if (themeName === 'dark') {
      this.removeMagicalCursor();
      this.applyFlashlightEffect();
      this.applyDarkCursor();
      this.removeSpaceCursor();
      this.removeWinterBackground();
    } else if (themeName === 'space') {
      this.removeMagicalCursor();
      this.removeFlashlightEffect();
      this.removeDarkCursor();
      this.applySpaceCursor();
      this.removeWinterBackground();
    } else if (themeName === 'winter') {
      this.removeMagicalCursor();
      this.removeFlashlightEffect();
      this.removeDarkCursor();
      this.removeSpaceCursor();
      this.applyWinterBackground();
    } else {
      this.removeMagicalCursor();
      this.removeFlashlightEffect();
      this.removeDarkCursor();
      this.removeSpaceCursor();
      this.removeWinterBackground();
    }
    
    return true;
  },
  
  applyMagicalCursor() {
    let style = document.getElementById('ms-magical-cursor');
    
    if (!style) {
      style = document.createElement('style');
      style.id = 'ms-magical-cursor';
      document.head.appendChild(style);
    }
    
    style.textContent = `
      body.ms-theme-magical {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%238B5CF6" stroke-width="2"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>'), auto;
      }
      
      body.ms-theme-magical button,
      body.ms-theme-magical a,
      body.ms-theme-magical .submit-button {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%238B5CF6" stroke-width="2"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>'), pointer !important;
      }
    `;
  },
  
  removeMagicalCursor() {
    const style = document.getElementById('ms-magical-cursor');
    if (style) {
      style.remove();
    }
  },

  applyDarkCursor() {
    let style = document.getElementById('ms-dark-cursor');
    
    if (!style) {
      style = document.createElement('style');
      style.id = 'ms-dark-cursor';
      document.head.appendChild(style);
    }
    
    const cursorUrl = chrome.runtime.getURL('handcursor.cur');
    const pointerUrl = chrome.runtime.getURL('Handpointer.cur');
    
    style.textContent = `
      body.ms-theme-dark * {
        cursor: url('${cursorUrl}') 12 12, auto !important;
      }
      
      body.ms-theme-dark button,
      body.ms-theme-dark a,
      body.ms-theme-dark .submit-button,
      body.ms-theme-dark [role="button"],
      body.ms-theme-dark input[type="submit"],
      body.ms-theme-dark input[type="button"] {
        cursor: url('${pointerUrl}') 12 12, pointer !important;
      }
    `;
  },
  
  removeDarkCursor() {
    const style = document.getElementById('ms-dark-cursor');
    if (style) {
      style.remove();
    }
  },

  applySpaceCursor() {
    let style = document.getElementById('ms-space-cursor');
    
    if (!style) {
      style = document.createElement('style');
      style.id = 'ms-space-cursor';
      document.head.appendChild(style);
    }
    
    const cursorSvg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <path d="M16 4 L18 12 L26 10 L18 16 L20 24 L16 18 L12 24 L14 16 L6 10 L14 12 Z" fill="#00d9ff" stroke="#0099cc" stroke-width="1"/>
      </svg>
    `);
    
    style.textContent = `
      body.ms-theme-space * {
        cursor: url('data:image/svg+xml;charset=utf-8,${cursorSvg}') 16 16, auto !important;
      }
      
      body.ms-theme-space button,
      body.ms-theme-space a,
      body.ms-theme-space .submit-button,
      body.ms-theme-space [role="button"],
      body.ms-theme-space input[type="submit"],
      body.ms-theme-space input[type="button"] {
        cursor: url('data:image/svg+xml;charset=utf-8,${cursorSvg}') 16 16, pointer !important;
      }
    `;
  },
  
  removeSpaceCursor() {
    const style = document.getElementById('ms-space-cursor');
    if (style) {
      style.remove();
    }
  },

  applyFlashlightEffect() {
    const existingOverlay = document.getElementById('ms-flashlight-overlay');
    if (existingOverlay) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'ms-flashlight-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle 150px at var(--mouse-x, 50%) var(--mouse-y, 50%), 
                  transparent 0%, 
                  transparent 100px,
                  rgba(0, 0, 0, 0.4) 150px,
                  rgba(0, 0, 0, 0.95) 300px);
      pointer-events: none;
      z-index: 9999;
      transition: background 0.1s ease;
    `;
    
    document.body.appendChild(overlay);
    
    const updateFlashlight = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      overlay.style.setProperty('--mouse-x', `${x}%`);
      overlay.style.setProperty('--mouse-y', `${y}%`);
    };
    
    document.addEventListener('mousemove', updateFlashlight);
    overlay.dataset.hasListener = 'true';
  },

  removeFlashlightEffect() {
    const overlay = document.getElementById('ms-flashlight-overlay');
    if (overlay) {
      overlay.remove();
    }
  },

  async applyStoredTheme() {
    const themeName = await this.getCurrentTheme();
    await this.setTheme(themeName);
  },

  async cycleTheme() {
    const current = await this.getCurrentTheme();
    const themes = ['default', 'magical', 'dark', 'space', 'winter'];
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    await this.setTheme(nextTheme);
    return nextTheme;
  },
  
  async toggleDarkMode() {
    return await this.cycleTheme();
  },

  getThemeList() {
    return Object.entries(this.THEMES).map(([key, theme]) => ({
      id: key,
      name: theme.name
    }));
  },

  isDarkTheme(themeName) {
    return themeName !== 'default';
  },

  applyWinterBackground() {
    
  },

  removeWinterBackground() {
    
  }
};
