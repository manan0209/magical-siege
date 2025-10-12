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
        '--ms-dark-bg': '#1a1a1a',
        '--ms-dark-card': '#2a2a2a',
        '--ms-dark-text': '#f5f5f4',
        '--ms-dark-border': 'rgba(245, 245, 244, 0.2)',
        '--ms-dark-accent': '#785437'
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
    
    document.body.classList.remove('ms-theme-default', 'ms-theme-magical', 'ms-theme-dark');
    document.body.classList.add(`ms-theme-${themeName}`);
    
    Object.entries(theme.vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    await Settings.set('theme', themeName);
    document.body.setAttribute('data-ms-theme', themeName);
    
    if (themeName === 'magical') {
      this.applyMagicalCursor();
    } else {
      this.removeMagicalCursor();
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

  async applyStoredTheme() {
    const themeName = await this.getCurrentTheme();
    await this.setTheme(themeName);
  },

  async cycleTheme() {
    const current = await this.getCurrentTheme();
    const themes = ['default', 'magical', 'dark'];
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
  }
};
